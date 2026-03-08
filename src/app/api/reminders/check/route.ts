import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TelegramService } from "@/services/TelegramService";

export async function POST() {
  try {
    const now = new Date();
    const reminders = await prisma.reminder.findMany({
      where: {
        enabled: true,
      },
      include: {
        user: true,
        logs: {
          where: {
            sentDate: now.toISOString().split('T')[0], // Today's date
          },
        },
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of reminders) {
      // Skip if no user or telegram ID
      if (!reminder.user?.telegramId) {
        console.warn(`Reminder ${reminder.id} has no associated Telegram user`);
        continue;
      }

      // Check if we should send this reminder
      if (shouldSendReminder(reminder, now)) {
        try {
          // Format the reminder message
          const message = formatReminderMessage(reminder);

          // Send via Telegram
          const success = await TelegramService.sendMessage(
            reminder.user.telegramId,
            message
          );

          if (success) {
            // Log the successful send
            await prisma.reminderLog.create({
              data: {
                reminderId: reminder.id,
                sentDate: now.toISOString().split('T')[0],
              },
            });

            // Update last sent timestamp
            await prisma.reminder.update({
              where: { id: reminder.id },
              data: { lastSentAt: now },
            });

            sentCount++;
            console.log(`✅ Sent reminder: ${reminder.text.substring(0, 50)}...`);
          } else {
            failedCount++;
            console.error(`❌ Failed to send reminder: ${reminder.text.substring(0, 50)}...`);
          }
        } catch (error) {
          failedCount++;
          console.error(`❌ Error sending reminder ${reminder.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      message: `Проверено ${reminders.length} напоминаний. Отправлено: ${sentCount}, ошибок: ${failedCount}`,
    });
  } catch (error: unknown) {
    console.error("Failed to check reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Не удалось проверить напоминания",
      },
      { status: 500 }
    );
  }
}

function shouldSendReminder(
  reminder: any,
  currentTime: Date
): boolean {
  // Check if already sent today
  const today = currentTime.toISOString().split('T')[0];
  const alreadySentToday = reminder.logs.some((log: any) =>
    log.sentDate === today
  );

  if (alreadySentToday) {
    return false;
  }

  let reminderTime = new Date(reminder.datetime);

  // For recurring reminders, adjust the time to today
  if (reminder.recurring) {
    reminderTime = new Date(currentTime);
    reminderTime.setHours(
      new Date(reminder.datetime).getHours(),
      new Date(reminder.datetime).getMinutes(),
      0,
      0
    );
  }

  // Check if current time is within 2 minutes of reminder time
  const timeDiff = Math.abs(currentTime.getTime() - reminderTime.getTime());
  const twoMinutesInMs = 2 * 60 * 1000;

  return timeDiff <= twoMinutesInMs;
}

function formatReminderMessage(reminder: any): string {
  const emoji = getReminderEmoji(reminder.text);
  const recurringText = reminder.recurring
    ? ` (${reminder.recurring === 'DAILY' ? 'ежедневно' : 'еженедельно'})`
    : '';

  return `${emoji} <b>Напоминание${recurringText}</b>\n\n${reminder.text}`;
}

function getReminderEmoji(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('резерв') || lowerText.includes('backup')) {
    return '💾';
  }
  if (lowerText.includes('почт') || lowerText.includes('email')) {
    return '📧';
  }
  if (lowerText.includes('звон') || lowerText.includes('позвон')) {
    return '📞';
  }
  if (lowerText.includes('статист')) {
    return '📊';
  }

  return '⏰'; // Default emoji
}
