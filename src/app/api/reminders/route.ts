import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseOptionalEnumValue,
  parseOptionalString,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";
import { ensureDefaultTelegramUser } from "@/lib/reminders/default-user";

export async function GET() {
  try {
    const reminders = await prisma.reminder.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            telegramId: true,
          },
        },
        logs: {
          orderBy: { sentAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reminders);
  } catch (error: unknown) {
    return apiError(500, "INTERNAL_ERROR", "Не удалось получить напоминания");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = assertRecord(body);

    const text = parseRequiredString(payload.text, "text", 1, 1000);
    const datetime = parseRequiredDate(payload.datetime, "datetime");
    const recurring = parseOptionalEnumValue(payload.recurring, "recurring", ["DAILY", "WEEKLY"]);
    let userId = parseOptionalString(payload.userId, "userId", 100);

    // If userId not provided, ensure default user exists
    if (!userId) {
      const defaultUser = await ensureDefaultTelegramUser();
      if (!defaultUser) {
        return apiError(
          422,
          "VALIDATION_ERROR",
          "Нет Telegram пользователя. Укажите userId или TELEGRAM_DEFAULT_CHAT_ID",
        );
      }
      userId = defaultUser.id;
    } else {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return apiError(404, "NOT_FOUND", "Пользователь не найден");
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        text,
        datetime,
        recurring: recurring as any,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            telegramId: true,
          },
        },
        logs: true,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось создать напоминание");
  }
}

function parseRequiredDate(value: unknown, fieldName: string): Date {
  if (value === undefined || value === null) {
    throw new ValidationError(`${fieldName} is required`);
  }
  const raw = parseRequiredString(value, fieldName, 1, 64);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }
  return date;
}
