import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseOptionalString,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";
import { TelegramService } from "@/services/TelegramService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = assertRecord(body);

    const userId = parseRequiredString(payload.userId, "userId", 1, 128);
    const message =
      parseOptionalString(payload.message, "message", 2000) ||
      "Тестовое сообщение: связь с Telegram настроена ✅";

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.telegramId) {
      return apiError(404, "NOT_FOUND", "Пользователь Telegram не найден");
    }

    const success = await TelegramService.sendMessage(user.telegramId, message);

    if (!success) {
      return apiError(502, "INTERNAL_ERROR", "Telegram не принял сообщение");
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось отправить тестовое сообщение");
  }
}
