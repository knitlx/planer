import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { ReminderTriggerStatus, ReminderTriggerType } from "@prisma/client";

import { MandatoryTriggerEngine, type MandatoryTriggerEvent } from "@/lib/reminders/trigger-engine";
import { ensureDefaultTelegramUser } from "@/lib/reminders/default-user";
import { getSiteUrl } from "@/lib/site-url";
import { TelegramService } from "@/services/TelegramService";
import { apiError } from "@/lib/api-validation";
import { getNewsFetcher, getNewsClassifier } from "@/lib/news/news-services";
import { prisma } from "@/lib/prisma";
import type { NewsRawLike } from "@/lib/news/llm-classifier";
import { DigestEngine } from "@/lib/news/digest-engine";

const engine = new MandatoryTriggerEngine();
const digestEngine = new DigestEngine();
const NEWS_CLASSIFIER_BATCH_SIZE = 20;

type OrchestratorSummary = {
  triggers: number;
  sent: number;
  news: { collected: number; classified: number; skippedClassification: boolean };
  digests: Array<{ windowId: string; slug: string; delivered: boolean; count: number }>;
};

export async function POST() {
  const now = new Date();
  let events: MandatoryTriggerEvent[] = [];

  const [newsPipelineSummary, digestSummary] = await Promise.all([runNewsPipeline(), digestEngine.run(now)]);
  logNewsPipeline(newsPipelineSummary);
  logDigestSummary(digestSummary);

  try {
    events = await engine.evaluate(now);

    if (events.length === 0) {
      return NextResponse.json(buildSummaryResponse({
        triggers: 0,
        sent: 0,
        news: newsPipelineSummary,
        digests: digestSummary,
      }));
    }

    const user = await ensureDefaultTelegramUser();
    if (!user?.telegramId) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        "Не задан TELEGRAM_DEFAULT_CHAT_ID или пользователь Telegram. Добавьте чат, чтобы получать напоминания.",
      );
    }

    const { message, hash } = formatMandatoryTriggerMessage(events);
    const delivered = await TelegramService.sendMessage(user.telegramId, message);

    await engine.recordLogs(
      events,
      delivered ? ReminderTriggerStatus.SENT : ReminderTriggerStatus.ERROR,
      hash,
    );

    if (!delivered) {
      return apiError(502, "INTERNAL_ERROR", "Не удалось отправить сообщение в Telegram");
    }

    return NextResponse.json(
      buildSummaryResponse({
        triggers: events.length,
        sent: 1,
        news: newsPipelineSummary,
        digests: digestSummary,
      }),
    );
  } catch (error) {
    console.error("Failed to process smart reminders:", error);
    if (events.length > 0) {
      await engine.recordLogs(events, ReminderTriggerStatus.ERROR);
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось обработать умные напоминания");
  }
}

function formatMandatoryTriggerMessage(events: MandatoryTriggerEvent[]) {
  const siteUrl = getSiteUrl();
  const sorted = [...events].sort((a, b) => a.trigger.type.localeCompare(b.trigger.type));
  const top = sorted.slice(0, 3);
  const lines = top.map((event, index) => {
    const projectUrl = `${siteUrl}/focus/${event.project.id}`;
    return `${index + 1}. <b>${event.project.name}</b> — ${event.reason}\n<a href="${projectUrl}">Открыть проект</a>`;
  });

  const extraCount = events.length - top.length;
  if (extraCount > 0) {
    lines.push(`…и ещё ${extraCount} проект(ов), попавших под ограничения`);
  }

  const triggerTypes = new Set(sorted.map((event) => formatTriggerType(event.trigger.type)));
  const header = "⚠️ <b>Обязательные проекты требуют внимания</b>";
  const subtitle = `Причины: ${Array.from(triggerTypes).join(", ")}`;
  const footer = "Ответь, когда зайдёшь в фокус и выберешь следующий шаг 💪";

  const message = [header, subtitle, lines.join("\n\n"), footer].join("\n\n");
  const hash = createHash("sha256").update(message).digest("hex");
  return { message, hash };
}

function formatTriggerType(type: ReminderTriggerType) {
  switch (type) {
    case ReminderTriggerType.MANDATORY_STALE:
      return "простаивают";
    case ReminderTriggerType.MANDATORY_NO_ACTIVE_TASKS:
      return "без активных задач";
    case ReminderTriggerType.MANDATORY_IGNORED:
      return "игнорируются";
    default:
      return "неизвестная причина";
  }
}

async function runNewsPipeline() {
  const fetcher = getNewsFetcher();
  let collected = 0;
  try {
    collected = await fetcher.collect();
  } catch (error) {
    console.error("Failed to collect news sources:", error);
  }

  const classifier = getNewsClassifier();
  if (!classifier) {
    return { collected, classified: 0, skippedClassification: true } as const;
  }

  let pending: NewsRawLike[] = [];
  try {
    const rows = await prisma.newsRaw.findMany({
      where: { llmInterest: null },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: NEWS_CLASSIFIER_BATCH_SIZE,
    });
    pending = rows.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      url: item.url,
      publishedAt: item.publishedAt,
    }));
  } catch (error) {
    console.error("Failed to load news awaiting classification:", error);
    return { collected, classified: 0, skippedClassification: false } as const;
  }

  if (!pending.length) {
    return { collected, classified: 0, skippedClassification: false } as const;
  }

  try {
    await classifier.classifyBatch(pending);
    return { collected, classified: pending.length, skippedClassification: false } as const;
  } catch (error) {
    console.error("Failed to classify news digest candidates:", error);
    return { collected, classified: 0, skippedClassification: false } as const;
  }
}

function logNewsPipeline(summary: Awaited<ReturnType<typeof runNewsPipeline>>) {
  if (summary.skippedClassification) {
    console.info("News classifier is not configured; set AI_NEWS_* env vars to enable digest scoring.");
    return;
  }
  if (summary.collected > 0 || summary.classified > 0) {
    console.info(`News pipeline collected ${summary.collected} item(s) and classified ${summary.classified} item(s).`);
  }
}

function logDigestSummary(entries: Awaited<ReturnType<DigestEngine["run"]>>) {
  const delivered = entries.filter((entry) => entry.delivered);
  const skipped = entries.filter((entry) => !entry.delivered && entry.count > 0);
  if (delivered.length) {
    console.info(
      `DigestEngine delivered ${delivered.reduce((acc, item) => acc + item.count, 0)} item(s) across ${delivered.length} window(s).`,
    );
  }
  if (skipped.length) {
    console.warn(`DigestEngine skipped ${skipped.length} window(s) with queued entries due to delivery issues.`);
  }
}

function buildSummaryResponse(summary: OrchestratorSummary) {
  return {
    success: true,
    sent: summary.sent,
    triggers: summary.triggers,
    news: summary.news,
    digests: summary.digests,
  } as const;
}
