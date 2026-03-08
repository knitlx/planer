import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-validation";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parseLimit(searchParams: URLSearchParams) {
  const raw = searchParams.get("limit");
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(1, Math.trunc(parsed)), MAX_LIMIT);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams);

    const digests = await prisma.digestDeliveryLog.findMany({
      orderBy: { deliveredAt: "desc" },
      take: limit,
      select: {
        id: true,
        deliveredAt: true,
        itemCount: true,
        window: {
          select: { id: true, slug: true, timeUtc: true },
        },
        windowId: true,
      },
    });

    const entries = await prisma.newsDigestEntry.findMany({
      where: {
        windowId: { in: digests.map((log) => log.windowId) },
        sentAt: { not: null },
      },
      orderBy: { sentAt: "desc" },
      take: limit * 5,
      select: {
        id: true,
        windowId: true,
        sentAt: true,
        raw: {
          select: { title: true, url: true, summary: true },
        },
      },
    });

    const entriesByWindow = new Map<string, typeof entries>();
    for (const entry of entries) {
      if (!entriesByWindow.has(entry.windowId)) {
        entriesByWindow.set(entry.windowId, []);
      }
      entriesByWindow.get(entry.windowId)!.push(entry);
    }

    const payload = digests.map((log) => ({
      id: log.id,
      deliveredAt: log.deliveredAt,
      itemCount: log.itemCount,
      window: log.window,
      entries: (entriesByWindow.get(log.windowId) ?? []).slice(0, log.itemCount).map((entry) => ({
        id: entry.id,
        title: entry.raw?.title,
        url: entry.raw?.url,
        summary: entry.raw?.summary,
        sentAt: entry.sentAt,
      })),
    }));

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to load digest deliveries:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось загрузить дайджесты");
  }
}
