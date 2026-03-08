import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReminderTriggerStatus, ReminderTriggerType } from "@prisma/client";

import type { MandatoryTriggerEvent } from "@/lib/reminders/trigger-engine";

const evaluateMock = vi.fn<[], Promise<MandatoryTriggerEvent[]>>();
const recordLogsMock = vi.fn();
const ensureDefaultTelegramUserMock = vi.fn();
const sendMessageMock = vi.fn<[], Promise<boolean>>();
const getSiteUrlMock = vi.fn(() => "https://planer.test");
const newsCollectMock = vi.fn<[], Promise<number>>();
const classifyBatchMock = vi.fn<[], Promise<void>>();
const getNewsClassifierMock = vi.fn();
const newsRawFindManyMock = vi.fn();
const digestRunMock = vi.fn();

vi.mock("@/lib/reminders/trigger-engine", () => {
  const MandatoryTriggerEngine = vi.fn(() => ({
    evaluate: evaluateMock,
    recordLogs: recordLogsMock,
  }));
  return {
    __esModule: true,
    MandatoryTriggerEngine,
  };
});

vi.mock("@/lib/reminders/default-user", () => ({
  __esModule: true,
  ensureDefaultTelegramUser: ensureDefaultTelegramUserMock,
}));

vi.mock("@/services/TelegramService", () => ({
  __esModule: true,
  TelegramService: {
    sendMessage: sendMessageMock,
  },
}));

vi.mock("@/lib/site-url", () => ({
  __esModule: true,
  getSiteUrl: getSiteUrlMock,
}));

vi.mock("@/lib/news/news-services", () => ({
  __esModule: true,
  getNewsFetcher: () => ({ collect: newsCollectMock }),
  getNewsClassifier: () => getNewsClassifierMock(),
}));

vi.mock("@/lib/news/digest-engine", () => ({
  __esModule: true,
  DigestEngine: vi.fn(() => ({
    run: digestRunMock,
  })),
}));

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    newsRaw: {
      findMany: newsRawFindManyMock,
    },
  },
}));

const { POST } = await import("@/app/api/reminders/check/route");

describe("POST /api/reminders/check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    newsCollectMock.mockResolvedValue(0);
    classifyBatchMock.mockResolvedValue();
    getNewsClassifierMock.mockReturnValue({ classifyBatch: classifyBatchMock });
    newsRawFindManyMock.mockResolvedValue([]);
    digestRunMock.mockResolvedValue([
      { windowId: "win-morning", slug: "MORNING", delivered: true, count: 2 },
    ]);
  });

  it("delivers mandatory triggers and returns orchestrator summary", async () => {
    const events = [buildEvent()];
    evaluateMock.mockResolvedValue(events);
    ensureDefaultTelegramUserMock.mockResolvedValue({ telegramId: 42 });
    sendMessageMock.mockResolvedValue(true);
    newsCollectMock.mockResolvedValue(3);
    newsRawFindManyMock.mockResolvedValue([
      {
        id: "raw-1",
        title: "AI breakthrough",
        summary: "...",
        url: "https://example",
        publishedAt: new Date().toISOString(),
      },
    ]);
    digestRunMock.mockResolvedValue([
      { windowId: "win-morning", slug: "MORNING", delivered: true, count: 1 },
    ]);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      sent: 1,
      triggers: events.length,
      news: {
        collected: 3,
        classified: 1,
        skippedClassification: false,
      },
      digests: [
        { windowId: "win-morning", slug: "MORNING", delivered: true, count: 1 },
      ],
    });
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(ensureDefaultTelegramUserMock).toHaveBeenCalledTimes(1);
    expect(recordLogsMock).toHaveBeenCalledWith(
      events,
      ReminderTriggerStatus.SENT,
      expect.any(String),
    );
  });

  it("returns summary without sending when no triggers fire", async () => {
    evaluateMock.mockResolvedValue([]);
    newsCollectMock.mockResolvedValue(5);
    getNewsClassifierMock.mockReturnValueOnce(undefined);
    digestRunMock.mockResolvedValue([
      { windowId: "win-late", slug: "LATE", delivered: false, count: 0 },
    ]);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      sent: 0,
      triggers: 0,
      news: {
        collected: 5,
        classified: 0,
        skippedClassification: true,
      },
      digests: [{ windowId: "win-late", slug: "LATE", delivered: false, count: 0 }],
    });
    expect(ensureDefaultTelegramUserMock).not.toHaveBeenCalled();
    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(recordLogsMock).not.toHaveBeenCalled();
    expect(newsRawFindManyMock).not.toHaveBeenCalled();
  });
});

function buildEvent(partial: Partial<MandatoryTriggerEvent> = {}): MandatoryTriggerEvent {
  return {
    trigger: {
      id: "cfg-1",
      type: ReminderTriggerType.MANDATORY_STALE,
      thresholdDays: 2,
      cooldownHours: 24,
      enabled: true,
      lastEvaluatedAt: null,
      createdAt: new Date("2026-03-01T00:00:00Z"),
      updatedAt: new Date("2026-03-01T00:00:00Z"),
      ...partial.trigger,
    },
    project: {
      id: "proj-1",
      name: "Проект",
      lastActive: new Date("2026-03-03T00:00:00Z"),
      updatedAt: new Date("2026-03-04T00:00:00Z"),
      tasks: [],
      ...partial.project,
    },
    reason: partial.reason ?? "Проект простаивает",
  } as MandatoryTriggerEvent;
}
