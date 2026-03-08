import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  apiError,
  assertRecord,
  parseEnumValue,
  parseOptionalBoolean,
  parseOptionalEnumValue,
  parseOptionalString,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

const SOURCE_URL_MAX = 1000;
const SOURCE_NAME_MAX = 120;

export async function GET() {
  try {
    const sources = await prisma.newsSource.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sources);
  } catch (error) {
    console.error("Failed to load news sources:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось загрузить источники новостей");
  }
}

export async function POST(request: Request) {
  try {
    const payload = assertRecord(await request.json());
    const name = parseRequiredString(payload.name, "name", 1, SOURCE_NAME_MAX);
    const type = parseEnumValue(payload.type, "type", ["RSS", "API"] as const);
    const url = parseRequiredString(payload.url, "url", 1, SOURCE_URL_MAX);

    const created = await prisma.newsSource.create({
      data: { name, type, url },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    console.error("Failed to create news source:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось создать источник новостей");
  }
}

export async function PUT(request: Request) {
  try {
    const payload = assertRecord(await request.json());
    const id = parseRequiredString(payload.id, "id", 1, 64);
    const name = parseOptionalString(payload.name, "name", SOURCE_NAME_MAX);
    const url = parseOptionalString(payload.url, "url", SOURCE_URL_MAX);
    const type = parseOptionalEnumValue(payload.type, "type", ["RSS", "API"] as const);
    const enabled = parseOptionalBoolean(payload.enabled, "enabled");

    const data: Prisma.NewsSourceUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (url !== undefined) data.url = url;
    if (type !== undefined) data.type = type;
    if (typeof enabled === "boolean") data.enabled = enabled;

    if (Object.keys(data).length === 0) {
      throw new ValidationError("Не указаны поля для обновления");
    }

    const updated = await prisma.newsSource.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    console.error("Failed to update news source:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось обновить источник новостей");
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = assertRecord(await request.json());
    const id = parseRequiredString(payload.id, "id", 1, 64);

    const result = await prisma.newsSource.update({
      where: { id },
      data: { enabled: false },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    console.error("Failed to delete news source:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось удалить источник новостей");
  }
}
