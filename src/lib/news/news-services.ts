import Parser from "rss-parser";

import { prisma } from "@/lib/prisma";
import { NewsFetcher, type NewsFetcherOptions } from "@/lib/news/news-fetcher";
import { NewsClassifier, type NewsClassifierOptions } from "@/lib/news/llm-classifier";

const rssParser = new Parser();
let fetcherInstance: NewsFetcher | null = null;
let classifierInstance: NewsClassifier | null = null;
let classifierSignature: string | null = null;

interface DigestWindowRecord {
  id: string;
  timeUtc: string;
}

let digestWindowCache: DigestWindowRecord[] = [];
let digestWindowLoadedAt: number | null = null;
const DIGEST_WINDOW_TTL_MS = 5 * 60 * 1000;

export function getNewsFetcher(): NewsFetcher {
  if (!fetcherInstance) {
    const prismaAdapter: NewsFetcherOptions["prisma"] = {
      newsSource: {
        findMany: (args) => prisma.newsSource.findMany(args as never),
      },
      newsRaw: {
        createMany: (args) => prisma.newsRaw.createMany(args as never),
      },
    };

    fetcherInstance = new NewsFetcher({
      prisma: prismaAdapter,
      rssParser,
      fetchFn: (url: string) => fetch(url),
    });
  }
  return fetcherInstance;
}

export function getNewsClassifier(): NewsClassifier | undefined {
  const config = readClassifierConfig();
  if (!config) {
    classifierInstance = null;
    classifierSignature = null;
    return undefined;
  }

  const signature = JSON.stringify(config);
  if (!classifierInstance || classifierSignature !== signature) {
    const prismaAdapter: NewsClassifierOptions["prisma"] = {
      newsRaw: {
        update: (args) => prisma.newsRaw.update(args as never),
      },
      newsDigestEntry: {
        createMany: (args) => prisma.newsDigestEntry.createMany(args as never),
      },
    };

    classifierInstance = new NewsClassifier({
      prisma: prismaAdapter,
      fetchFn: (url, init) => fetch(url, init),
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      model: config.model,
      interests: config.interests,
      selectWindowId: (item) => selectWindowId(item),
    });
    classifierSignature = signature;
  }

  return classifierInstance;
}

export async function ensureDigestWindowCache(): Promise<boolean> {
  const now = Date.now();
  if (!digestWindowLoadedAt || now - digestWindowLoadedAt > DIGEST_WINDOW_TTL_MS) {
    const windows = await prisma.digestWindowConfig.findMany({
      where: { enabled: true },
      orderBy: { timeUtc: "asc" },
      select: { id: true, timeUtc: true },
    });
    digestWindowCache = windows;
    digestWindowLoadedAt = now;
  }
  return digestWindowCache.length > 0;
}

function selectWindowId(item: { publishedAt?: string | Date | null }): string | undefined {
  void ensureDigestWindowCache();
  if (!digestWindowCache.length) {
    return undefined;
  }

  const publishedMinutes = toUtcMinutes(item.publishedAt);
  if (publishedMinutes !== undefined) {
    const target = digestWindowCache.find((window) => parseTime(window.timeUtc) >= publishedMinutes);
    if (target) {
      return target.id;
    }
  }

  return digestWindowCache[0]?.id;
}

function toUtcMinutes(value?: string | Date | null): number | undefined {
  if (!value) return undefined;
  const date = typeof value === "string" ? new Date(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function parseTime(input: string): number {
  const [hours, minutes] = input.split(":").map((part) => Number.parseInt(part, 10));
  if (Number.isNaN(hours)) {
    return 0;
  }
  return hours * 60 + (Number.isNaN(minutes) ? 0 : minutes);
}

function readClassifierConfig():
  | {
      apiUrl: string;
      apiKey: string;
      model: string;
      interests: string[];
    }
  | undefined {
  const apiUrl = process.env.AI_NEWS_LLM_API_URL?.trim();
  const apiKey = process.env.AI_NEWS_LLM_API_KEY?.trim();
  const model = process.env.AI_NEWS_LLM_MODEL?.trim();
  const interests = (process.env.AI_NEWS_INTERESTS || "")
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!apiUrl || !apiKey || !model || interests.length === 0) {
    return undefined;
  }

  return { apiUrl, apiKey, model, interests };
}
