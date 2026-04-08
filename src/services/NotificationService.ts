import { differenceInHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { ProjectService } from "./ProjectService";
import { TelegramService } from "./TelegramService";

interface NotificationEvent {
  type: string;
  condition: (payload: any) => Promise<boolean>;
  message: (payload: any) => string;
}

const NOTIFICATION_EVENTS: NotificationEvent[] = [
  {
    type: "CLOSER",
    condition: async (payload: { project: any }) => {
      const { project } = payload;
      if (project.status !== "FINAL_STRETCH") return false;
      const hoursSinceActive = differenceInHours(
        new Date(),
        new Date(project.updatedAt),
      );
      return hoursSinceActive >= 24;
    },
    message: (payload) =>
      `🏁 В проекте "${payload.project.name}" осталось всего чуть-чуть до 100%. Заскочим на 15 минут, чтобы закрыть его навсегда?`,
  },
  {
    type: "GUARD",
    condition: async (payload: { activeProjectsCount: number }) => {
      return payload.activeProjectsCount >= 3;
    },
    message: () =>
      `🛡️ У тебя уже 3 проекта в фокусе. Чтобы добавить этот, давай выберем, какой мы 'заморозим' или доделаем?`,
  },
];

export class NotificationService {
  static async processAll() {
    for (const event of NOTIFICATION_EVENTS) {
      try {
        await this.processEvent(event);
      } catch (error) {
        console.error(
          `Failed to process notification event ${event.type}:`,
          error,
        );
      }
    }
  }

  private static async processEvent(event: NotificationEvent) {
    const payload = await this.getPayloadForEvent(event.type);
    if (!payload) return;

    const shouldNotify = await event.condition(payload);
    if (!shouldNotify) return;

    const wasRecentlySent = await this.wasNotificationRecentlySent(
      event.type,
      payload,
    );
    if (wasRecentlySent) return;

    const message = event.message(payload);

    await TelegramService.sendMessage(
      parseInt(process.env.TELEGRAM_DEFAULT_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "0"),
      message,
    );

    await this.logNotificationSent(event.type, payload);
  }

  private static async getPayloadForEvent(type: string): Promise<any> {
    switch (type) {
      case "CLOSER":
        const project = await ProjectService.getClosestToFinish();
        return project ? { project } : null;
      case "GUARD":
        return {
          activeProjectsCount: await ProjectService.countActiveProjects(),
        };
      default:
        return null;
    }
  }

  private static async wasNotificationRecentlySent(
    type: string,
    payload: any,
  ): Promise<boolean> {
    const projectId = payload.project?.id;

    const recentNotification = await prisma.notificationLog.findFirst({
      where: {
        type,
        projectId,
        sentAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return !!recentNotification;
  }

  private static async logNotificationSent(
    type: string,
    payload: any,
  ): Promise<void> {
    const projectId = payload.project?.id;

    await prisma.notificationLog.create({
      data: { type, projectId },
    });
  }
}
