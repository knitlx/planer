import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  apiError,
  assertRecord,
  parseOptionalBoolean,
  parseOptionalInt,
  parseOptionalString,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

const TIME_PATTERN = /^\d{2}:\d{2}$/;

export async function GET() {
  try {
    const windows = await prisma.digestWindowConfig.findMany({
      orderBy: { timeUtc: "asc" },
    });
    return NextResponse.json(windows);
  } catch (error) {
    console.error("Failed to load digest windows:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось загрузить окна дайджеста");
  }
}

export async function PUT(request: Request) {
  try {
    const payload = assertRecord(await request.json());
    const id = parseRequiredString(payload.id, "id", 1, 64);
    const slug = parseOptionalString(payload.slug, "slug", 32);
    const timeUtc = parseOptionalString(payload.timeUtc, "timeUtc", 5);
    const maxItems = parseOptionalInt(payload.maxItems, "maxItems", 1, 50);
    const enabled = parseOptionalBoolean(payload.enabled, "enabled");

    if (timeUtc && !TIME_PATTERN.test(timeUtc)) {
      throw new ValidationError("timeUtc должен быть в формате HH:MM");
    }

    const data: Prisma.DigestWindowConfigUpdateInput = {};
    if (slug !== undefined) data.slug = slug;
    if (timeUtc !== undefined) data.timeUtc = timeUtc;
    if (typeof maxItems === "number") data.maxItems = maxItems;
    if (typeof enabled === "boolean") data.enabled = enabled;

    if (Object.keys(data).length === 0) {
      throw new ValidationError("Не указаны поля для обновления");
    }

    const updated = await prisma.digestWindowConfig.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    console.error("Failed to update digest window:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось обновить окно дайджеста");
  }
}
