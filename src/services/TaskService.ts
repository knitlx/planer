import { prisma } from "@/lib/prisma";
import type { Task, PrismaClient } from "@prisma/client";

export class TaskService {
  static async calculateProjectProgress(projectId: string): Promise<number> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
    });

    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter((t) => t.status === "DONE").length;
    return Math.round((completedTasks / tasks.length) * 100);
  }

  static async getNextStepTask(projectId: string): Promise<Task | null> {
    return prisma.task.findFirst({
      where: { projectId, status: "TODO", isNextStep: true },
      orderBy: { order: "asc" },
    });
  }

  static async simplifyTask(taskId: string): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new Error("Task not found");

    const microSteps = this.generateMicroSteps(task.title);

    const simplified = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: microSteps[0],
        contextSummary: `Original: "${task.title}" - simplified from ${task.type}`,
        type: "ACTION",
        isSimplified: true,
      },
    });

    return simplified;
  }

  private static generateMicroSteps(originalTitle: string): string[] {
    const patterns = [
      {
        regex: /^Разработать|Implement|Build/i,
        steps: [
          "Создать файл",
          "Добавить базовую структуру",
          "Дописать детали",
        ],
      },
      {
        regex: /^Исследовать|Research|Explore/i,
        steps: [
          "Открыть источник",
          "Прочитать первые 5 строк",
          "Заметить ключевые моменты",
        ],
      },
      {
        regex: /^Разобрать|Analyze|Parse/i,
        steps: [
          "Открыть документ",
          "Посмотреть оглавление",
          "Прочитать раздел 1",
        ],
      },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(originalTitle)) {
        return pattern.steps;
      }
    }

    return [
      "Просто открой файл",
      "Посмотри на него 1 минуту",
      "Реши, что делать дальше",
    ];
  }

  static async completeTaskWithProgress(
    taskId: string,
    contextSummary?: string,
    timerLog?: string,
  ): Promise<{ task: Task; progress: number }> {
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) throw new Error("Task not found");

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          status: "DONE",
          contextSummary,
          timerLog,
        },
      });

      const newProgress = await this.calculateProjectProgressTx(
        tx,
        task.projectId,
      );

      await tx.project.update({
        where: { id: task.projectId },
        data: {
          progress: newProgress,
          updatedAt: new Date(),
        },
      });

      if (newProgress >= 70 && task.project.status !== "FINAL_STRETCH") {
        await tx.project.update({
          where: { id: task.projectId },
          data: { status: "FINAL_STRETCH" },
        });
      }

      return { task: updatedTask, progress: newProgress };
    });

    return result;
  }

  private static async calculateProjectProgressTx(
    tx: Omit<
      PrismaClient,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
    projectId: string,
  ): Promise<number> {
    const tasks = await tx.task.findMany({
      where: { projectId },
    });

    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter((t) => t.status === "DONE").length;
    return Math.round((completedTasks / tasks.length) * 100);
  }
}
