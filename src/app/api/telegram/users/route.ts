import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseOptionalString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        telegramId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error: unknown) {
    return apiError(500, "INTERNAL_ERROR", "Не удалось получить пользователей");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = assertRecord(body);

    const name = parseOptionalString(payload.name, "name", 100);
    const telegramId = parseTelegramId(payload.telegramId, "telegramId");

    const existing = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });

    if (existing) {
      return apiError(409, "CONFLICT", "Пользователь с таким Telegram ID уже существует");
    }

    const user = await prisma.user.create({
      data: {
        name: name || null,
        telegramId,
      },
      select: {
        id: true,
        name: true,
        telegramId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось создать пользователя");
  }
}

function parseTelegramId(value: unknown, fieldName: string): number {
  if (value === undefined || value === null) {
    throw new ValidationError(`${fieldName} is required`);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!/^[0-9]+$/.test(normalized)) {
      throw new ValidationError(`${fieldName} must contain only digits`);
    }
    return parseInt(normalized, 10);
  }

  throw new ValidationError(`${fieldName} must be a number or string`);
}
