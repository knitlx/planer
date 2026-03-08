import { beforeEach, describe, expect, it, vi } from "vitest";

import { NewsClassifier, type NewsClassifierOptions } from "@/lib/news/llm-classifier";

describe("NewsClassifier", () => {
  let prismaMock: {
    newsRaw: { update: ReturnType<typeof vi.fn> };
    newsDigestEntry: { createMany: ReturnType<typeof vi.fn> };
  };
  let fetchFnMock: ReturnType<typeof vi.fn>;
  let selectWindowId: NewsClassifierOptions["selectWindowId"] & ReturnType<typeof vi.fn>;

  beforeEach(() => {
    prismaMock = {
      newsRaw: { update: vi.fn() },
      newsDigestEntry: { createMany: vi.fn() },
    };
    fetchFnMock = vi.fn();
    selectWindowId = vi.fn() as NewsClassifierOptions["selectWindowId"] & ReturnType<typeof vi.fn>;
  });

  it("sends interests to LLM API and stores digest entries for interested items", async () => {
    fetchFnMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { id: "news-1", interest: true, score: 5 },
          { id: "news-2", interest: false, score: 1 },
        ],
      }),
    });
    selectWindowId.mockReturnValue("window-1");

    const classifier = new NewsClassifier({
      prisma: prismaMock as unknown as NewsClassifierOptions["prisma"],
      fetchFn: fetchFnMock as unknown as NewsClassifierOptions["fetchFn"],
      apiUrl: "https://llm.example.com",
      apiKey: "test-key",
      model: "gpt-news",
      interests: ["AI", "productivity"],
      selectWindowId,
    });

    const items = [
      {
        id: "news-1",
        title: "AI chips surge",
        summary: "NVIDIA released new cards",
        url: "https://example.com/ai",
        publishedAt: new Date("2026-03-07T09:00:00Z"),
      },
      {
        id: "news-2",
        title: "Sports",
        summary: "Not relevant",
        url: "https://example.com/sports",
        publishedAt: null,
      },
    ];

    await classifier.classifyBatch(items);

    expect(fetchFnMock).toHaveBeenCalledWith(
      "https://llm.example.com",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      }),
    );
    const body = JSON.parse(fetchFnMock.mock.calls[0][1]!.body as string);
    expect(body.interests).toEqual(expect.arrayContaining(["AI", "productivity"]));
    expect(body.items[0]).toMatchObject({ id: "news-1", title: "AI chips surge" });

    expect(prismaMock.newsRaw.update).toHaveBeenCalledTimes(2);
    expect(prismaMock.newsRaw.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "news-1" } }),
    );

    expect(selectWindowId).toHaveBeenCalledWith(items[0]);
    expect(prismaMock.newsDigestEntry.createMany).toHaveBeenCalledWith({
      data: [{ rawId: "news-1", windowId: "window-1" }],
      skipDuplicates: true,
    });
  });

  it("skips digest entries when window selector returns undefined", async () => {
    fetchFnMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ id: "news-3", interest: true, score: 4 }],
      }),
    });
    selectWindowId.mockReturnValue(undefined);

    const classifier = new NewsClassifier({
      prisma: prismaMock as unknown as NewsClassifierOptions["prisma"],
      fetchFn: fetchFnMock as unknown as NewsClassifierOptions["fetchFn"],
      apiUrl: "https://llm.example.com",
      apiKey: "test-key",
      model: "gpt-news",
      interests: ["AI"],
      selectWindowId,
    });

    await classifier.classifyBatch([
      {
        id: "news-3",
        title: "AI chips surge",
        summary: null,
        url: "https://example.com/ai",
        publishedAt: undefined,
      },
    ]);

    expect(prismaMock.newsDigestEntry.createMany).not.toHaveBeenCalled();
  });
});
