import { createHash } from "node:crypto";

type NewsSourceRecord = {
  id: string;
  type: "RSS" | "API";
  url: string;
  enabled?: boolean;
};

type ParsedRssItem = Record<string, unknown> & {
  title?: string;
  link?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
};

type ApiNewsItem = {
  id?: string;
  title?: string;
  summary?: string | null;
  url?: string;
  link?: string;
  publishedAt?: string | Date | null;
};

type CreateNewsRawInput = {
  sourceId: string;
  title: string;
  summary?: string | null;
  url: string;
  publishedAt?: Date;
  hash: string;
};
export interface NewsFetcherOptions {
  prisma: {
    newsSource: {
      findMany: (args?: unknown) => Promise<any[]>;
    };
    newsRaw: {
      createMany: (args: { data: CreateNewsRawInput[]; skipDuplicates?: boolean }) => Promise<unknown>;
    };
  };
  rssParser: {
    parseURL: (url: string) => Promise<{ items?: ParsedRssItem[] } | undefined>;
  };
  fetchFn: (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
}

export class NewsFetcher {
  constructor(public readonly options: NewsFetcherOptions) {}

  async collect(): Promise<number> {
    const sources = await this.options.prisma.newsSource.findMany({
      where: { enabled: true },
    } as Record<string, unknown>);

    if (!sources.length) {
      return 0;
    }

    const collected: CreateNewsRawInput[] = [];

    for (const source of sources) {
      if (source.type === "RSS") {
        const items = await this.fetchRssItems(source);
        collected.push(...items);
      } else if (source.type === "API") {
        const items = await this.fetchApiItems(source);
        collected.push(...items);
      }
    }

    if (!collected.length) {
      return 0;
    }

    const deduped = this.dedupeByHash(collected);
    if (!deduped.length) {
      return 0;
    }

    await this.options.prisma.newsRaw.createMany({
      data: deduped,
      skipDuplicates: true,
    });

    return deduped.length;
  }

  private async fetchRssItems(source: NewsSourceRecord): Promise<CreateNewsRawInput[]> {
    try {
      const feed = await this.options.rssParser.parseURL(source.url);
      if (!feed?.items?.length) {
        return [];
      }
      return feed.items
        .map((item) => this.normalizeRssItem(source.id, item))
        .filter((entry): entry is CreateNewsRawInput => Boolean(entry));
    } catch (error) {
      console.error(`Failed to parse RSS source ${source.url}:`, error);
      return [];
    }
  }

  private async fetchApiItems(source: NewsSourceRecord): Promise<CreateNewsRawInput[]> {
    try {
      const response = await this.options.fetchFn(source.url);
      if (!response.ok) {
        console.error(`API source ${source.url} responded with status error`);
        return [];
      }
      const payload = (await response.json()) as { items?: ApiNewsItem[] };
      if (!payload?.items || !Array.isArray(payload.items)) {
        return [];
      }
      return payload.items
        .map((item) => this.normalizeApiItem(source.id, item))
        .filter((entry): entry is CreateNewsRawInput => Boolean(entry));
    } catch (error) {
      console.error(`Failed to fetch API source ${source.url}:`, error);
      return [];
    }
  }

  private normalizeRssItem(sourceId: string, item: ParsedRssItem | undefined): CreateNewsRawInput | undefined {
    if (!item) return undefined;
    const title = (item.title ?? item.guid ?? "").toString().trim();
    const url = (item.link ?? item.guid ?? "").toString().trim();
    if (!title || !url) {
      return undefined;
    }
    const summary = (item.contentSnippet ?? item.content ?? "").toString().trim();
    const publishedAt = parseDate(item.isoDate ?? item.pubDate);

    return {
      sourceId,
      title,
      summary: summary || undefined,
      url,
      publishedAt,
      hash: computeHash(sourceId, url, title),
    };
  }

  private normalizeApiItem(sourceId: string, item: ApiNewsItem | undefined): CreateNewsRawInput | undefined {
    if (!item) return undefined;
    const title = item.title?.trim();
    const url = (item.url ?? item.link ?? "").toString().trim();
    if (!title || !url) {
      return undefined;
    }
    const summary = item.summary?.toString().trim();
    const publishedAt = parseDate(item.publishedAt);

    return {
      sourceId,
      title,
      summary: summary || undefined,
      url,
      publishedAt,
      hash: computeHash(sourceId, url, title, item.id),
    };
  }

  private dedupeByHash(items: CreateNewsRawInput[]): CreateNewsRawInput[] {
    const seen = new Set<string>();
    const result: CreateNewsRawInput[] = [];
    for (const item of items) {
      if (seen.has(item.hash)) continue;
      seen.add(item.hash);
      result.push(item);
    }
    return result;
  }
}

function parseDate(input?: string | Date | null): Date | undefined {
  if (!input) return undefined;
  const date = typeof input === "string" ? new Date(input) : input;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
}

function computeHash(sourceId: string, url: string, _title?: string, externalId?: string): string {
  const base = `${sourceId}:${externalId ?? ""}:${url.toLowerCase()}`;
  return createHash("sha256").update(base).digest("hex");
}
