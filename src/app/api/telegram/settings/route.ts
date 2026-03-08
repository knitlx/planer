import { NextResponse } from "next/server";
import { ensureDefaultTelegramUser } from "@/lib/reminders/default-user";

export async function GET() {
  const botTokenConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const defaultChatId =
    process.env.TELEGRAM_DEFAULT_CHAT_ID || process.env.TELEGRAM_CHAT_ID || null;

  const user = await ensureDefaultTelegramUser();

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "TELEGRAM_USER_MISSING",
          message:
            "Не задан TELEGRAM_DEFAULT_CHAT_ID. Добавьте его в .env, чтобы использовать напоминания",
        },
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    user,
    botTokenConfigured,
    defaultChatId,
  });
}
