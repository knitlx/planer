import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-validation";

interface TelegramMessage {
  message: {
    chat: { id: number };
    text: string;
    from: { id: number; username?: string };
  };
}

export async function POST(request: Request) {
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.error("Invalid webhook secret");
    return apiError(401, "UNAUTHORIZED", "Не авторизовано");
  }

  const body: TelegramMessage = await request.json();
  const { text } = body.message;

  const idea = await prisma.idea.create({
    data: {
      content: text,
      source: "Telegram",
    },
  });

  return NextResponse.json({ success: true, ideaId: idea.id });
}
