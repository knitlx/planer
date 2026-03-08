import { prisma } from "@/lib/prisma";

function parseTelegramId(): number | null {
  const idStr = process.env.TELEGRAM_DEFAULT_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (!idStr) {
    return null;
  }
  const parsed = Number(idStr);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function ensureDefaultTelegramUser() {
  const telegramId = parseTelegramId();
  if (!telegramId) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (existing) {
    return existing;
  }

  const defaultName = process.env.TELEGRAM_DEFAULT_USER_NAME || "Telegram";

  return prisma.user.create({
    data: {
      telegramId,
      name: defaultName,
    },
  });
}
