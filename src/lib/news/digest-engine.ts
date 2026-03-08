import { DigestEntryStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { TelegramService } from "@/services/TelegramService";

type DigestEngineDependencies = {
  prisma: typeof prisma;
  telegram: Pick<typeof TelegramService, "sendMessage">;
};

type DigestWindow = {
  id: string;
  slug: string;
  timeUtc: string;
  maxItems?: number | null;
};

type DigestEntry = {
  id: string;
  title: string;
  summary?: string | null;
  url: string;
};

export class DigestEngine {
  constructor(
    private readonly deps: DigestEngineDependencies = {
      prisma,
      telegram: TelegramService,
    },
  ) {}

  async run(now = new Date()) {
    const windows = await this.deps.prisma.digestWindowConfig.findMany({
      where: { enabled: true },
      orderBy: { timeUtc: "asc" },
      select: { id: true, slug: true, timeUtc: true, maxItems: true },
    });

    const windowSummaries: Array<{ windowId: string; slug: string; delivered: boolean; count: number }> = [];

    for (const window of windows) {
      if (!(await this.shouldFire(window, now))) {
        windowSummaries.push({ windowId: window.id, slug: window.slug, delivered: false, count: 0 });
        continue;
      }

      const entries = await this.fetchEntries(window.id, window.maxItems ?? 5);
      if (!entries.length) {
        windowSummaries.push({ windowId: window.id, slug: window.slug, delivered: false, count: 0 });
        continue;
      }

      const message = this.formatDigest(window, entries);
      const chatId = Number(process.env.TELEGRAM_DEFAULT_CHAT_ID);
      if (Number.isNaN(chatId)) {
        console.warn(`DigestEngine: TELEGRAM_DEFAULT_CHAT_ID is not configured, skipping window ${window.slug}`);
        windowSummaries.push({ windowId: window.id, slug: window.slug, delivered: false, count: entries.length });
        continue;
      }

      const delivered = await this.deps.telegram.sendMessage(chatId, message);
      await this.deps.prisma.newsDigestEntry.updateMany({
        where: { id: { in: entries.map((entry) => entry.id) } },
        data: {
          status: { set: delivered ? DigestEntryStatus.SENT : DigestEntryStatus.SKIPPED },
          sentAt: new Date(now),
        },
      });
      await this.deps.prisma.digestDeliveryLog.create({
        data: {
          windowId: window.id,
          deliveredAt: new Date(now),
          itemCount: entries.length,
        },
      });

      windowSummaries.push({ windowId: window.id, slug: window.slug, delivered, count: entries.length });
    }

    return windowSummaries;
  }

  private async shouldFire(window: DigestWindow, now: Date): Promise<boolean> {
    if (!this.matchesTime(window.timeUtc, now)) {
      return false;
    }

    const alreadyDelivered = await this.wasDeliveredToday(window.id, now);
    return !alreadyDelivered;
  }

  private matchesTime(timeUtc: string, now: Date): boolean {
    const windowMinutes = this.parseTime(timeUtc);
    if (windowMinutes === undefined) {
      return false;
    }
    const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    return Math.abs(nowMinutes - windowMinutes) <= 5;
  }

  private async wasDeliveredToday(windowId: string, now: Date): Promise<boolean> {
    const startOfDayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const endOfDayUtc = startOfDayUtc + 24 * 60 * 60 * 1000;

    const existing = await this.deps.prisma.digestDeliveryLog.findFirst({
      where: {
        windowId,
        deliveredAt: {
          gte: new Date(startOfDayUtc),
          lt: new Date(endOfDayUtc),
        },
      },
      select: { id: true },
    });

    return Boolean(existing);
  }

  private async fetchEntries(windowId: string, maxItems: number): Promise<DigestEntry[]> {
    const rows = await this.deps.prisma.newsDigestEntry.findMany({
      where: { windowId, status: DigestEntryStatus.QUEUED },
      orderBy: [
        { raw: { llmScore: "desc" } } as Prisma.NewsDigestEntryOrderByWithRelationInput,
        { createdAt: "asc" },
      ],
      take: maxItems,
      select: {
        id: true,
        raw: {
          select: {
            title: true,
            summary: true,
            url: true,
          },
        },
      },
    });

    return rows
      .map((row) => ({
        id: row.id,
        title: row.raw?.title ?? "Без названия",
        summary: row.raw?.summary,
        url: row.raw?.url ?? "#",
      }))
      .filter((entry) => Boolean(entry.title?.trim()));
  }

  private formatDigest(window: DigestWindow, entries: DigestEntry[]): string {
    const header = `📰 <b>Дайджест ${window.slug}</b> (${window.timeUtc} UTC)`;
    const body = entries
      .map((entry, index) => {
        const summaryLine = entry.summary?.trim() ? `\n${entry.summary.trim()}` : "";
        return `${index + 1}. <b>${entry.title}</b>${summaryLine}\n<a href="${entry.url}">Читать</a>`;
      })
      .join("\n\n");

    return `${header}\n\n${body}`;
  }

  private parseTime(time: string): number | undefined {
    const [hoursStr, minutesStr = "0"] = time.split(":");
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return undefined;
    }
    return hours * 60 + minutes;
  }
}
