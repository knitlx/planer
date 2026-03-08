import { describe, it, expect, vi, beforeEach } from "vitest";
import { DigestEntryStatus } from "@prisma/client";

import { DigestEngine } from "@/lib/news/digest-engine";

describe("DigestEngine", () => {
  const prismaMock = {
    digestWindowConfig: { findMany: vi.fn() },
    newsDigestEntry: { findMany: vi.fn(), updateMany: vi.fn() },
    digestDeliveryLog: { create: vi.fn(), findFirst: vi.fn() },
  } as const;
  const telegramMock = { sendMessage: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_DEFAULT_CHAT_ID = "123";
    prismaMock.digestWindowConfig.findMany.mockResolvedValue([
      { id: "win-morning", slug: "MORNING", timeUtc: "07:30", enabled: true, maxItems: 5 },
    ]);
    prismaMock.newsDigestEntry.findMany.mockResolvedValue([
      { rawId: "raw-1", title: "AI breakthrough", summary: "...", url: "https://example", llmScore: 5 },
    ]);
    prismaMock.digestDeliveryLog.findFirst.mockResolvedValue(null);
    telegramMock.sendMessage.mockResolvedValue(true);
  });

  it("delivers enabled windows and marks entries as sent", async () => {
    const engine = new DigestEngine({ prisma: prismaMock as any, telegram: telegramMock as any });
    await engine.run(new Date("2026-03-08T07:35:00Z"));
    expect(telegramMock.sendMessage).toHaveBeenCalledTimes(1);
    expect(prismaMock.newsDigestEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: { set: DigestEntryStatus.SENT },
        }),
      })
    );
    expect(prismaMock.digestDeliveryLog.create).toHaveBeenCalled();
  });
});
