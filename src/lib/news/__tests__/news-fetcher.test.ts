import { beforeEach, describe, expect, it, vi } from "vitest";

import { NewsFetcher, type NewsFetcherOptions } from "@/lib/news/news-fetcher";

describe("NewsFetcher", () => {
  let prismaMock: {
    newsSource: { findMany: ReturnType<typeof vi.fn> };
    newsRaw: { createMany: ReturnType<typeof vi.fn> };
  };
  let rssParserMock: { parseURL: ReturnType<typeof vi.fn> };
  let fetchFnMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    prismaMock = {
      newsSource: { findMany: vi.fn() },
      newsRaw: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
    };
    rssParserMock = {
      parseURL: vi.fn(),
    };
    fetchFnMock = vi.fn();
  });

  it("deduplicates RSS entries by hash before inserting", async () => {
    prismaMock.newsSource.findMany.mockResolvedValue([
      {
        id: "rss-src",
        type: "RSS",
        url: "https://example.com/rss.xml",
        enabled: true,
      },
    ]);

    rssParserMock.parseURL.mockResolvedValue({
      items: [
        { title: "Same", link: "https://site/article-1", isoDate: "2026-03-07T10:00:00Z" },
        { title: "Duplicate", link: "https://site/article-1", isoDate: "2026-03-07T10:05:00Z" },
      ],
    });

    const fetcher = new NewsFetcher({
      prisma: prismaMock as unknown as NewsFetcherOptions["prisma"],
      rssParser: rssParserMock as unknown as NewsFetcherOptions["rssParser"],
      fetchFn: fetchFnMock as unknown as NewsFetcherOptions["fetchFn"],
    });

    await fetcher.collect();

    expect(prismaMock.newsRaw.createMany).toHaveBeenCalledTimes(1);
    const payload = prismaMock.newsRaw.createMany.mock.calls[0][0];
    expect(payload.skipDuplicates).toBe(true);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]).toMatchObject({ url: "https://site/article-1" });
    expect(payload.data[0].hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("normalizes API sources via fetch client", async () => {
    prismaMock.newsSource.findMany.mockResolvedValue([
      {
        id: "api-src",
        type: "API",
        url: "https://api.example.com/news",
        enabled: true,
      },
    ]);

    fetchFnMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "api-1",
            title: "API story",
            summary: "Important",
            url: "https://api.example.com/news/1",
            publishedAt: "2026-03-07T09:00:00Z",
          },
        ],
      }),
    });

    const fetcher = new NewsFetcher({
      prisma: prismaMock as unknown as NewsFetcherOptions["prisma"],
      rssParser: rssParserMock as unknown as NewsFetcherOptions["rssParser"],
      fetchFn: fetchFnMock as unknown as NewsFetcherOptions["fetchFn"],
    });
    await fetcher.collect();

    expect(fetchFnMock).toHaveBeenCalledWith("https://api.example.com/news");
    const payload = prismaMock.newsRaw.createMany.mock.calls[0][0];
    expect(payload.data[0]).toMatchObject({
      url: "https://api.example.com/news/1",
      title: "API story",
      summary: "Important",
    });
  });
});
