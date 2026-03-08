import { prisma } from "@/lib/prisma";
import type {
  Project,
  ReminderTriggerConfig,
  ReminderTriggerLog,
  ReminderTriggerType,
  Task,
} from "@prisma/client";

type ProjectWithTasks = Project & { tasks: Task[] };
type TriggerConfigShape = Pick<
  ReminderTriggerConfig,
  "id" | "type" | "thresholdDays" | "cooldownHours"
>;

const MS_IN_HOUR = 1000 * 60 * 60;
const MS_IN_DAY = MS_IN_HOUR * 24;

export interface TriggerMatch {
  triggerId: string;
  triggerType: ReminderTriggerType;
  projectId: string;
  projectName: string;
  reason: string;
}

export function evaluateMandatoryStale(
  projects: ProjectWithTasks[],
  config: TriggerConfigShape,
  now = new Date(),
): TriggerMatch[] {
  const threshold = config.thresholdDays ?? 2;

  return projects
    .filter((project) => project.type === "MANDATORY")
    .filter((project) => {
      if (!project.lastActive) return false;
      const diffDays = daysBetween(now, project.lastActive);
      return diffDays >= threshold;
    })
    .map((project) => ({
      triggerId: config.id,
      triggerType: config.type,
      projectId: project.id,
      projectName: project.name,
      reason: `Последняя активность ${Math.floor(
        daysBetween(now, project.lastActive!),
      )} дн. назад`,
    }));
}

export function evaluateMandatoryIgnored(
  mandatoryProjects: ProjectWithTasks[],
  otherProjects: ProjectWithTasks[],
  config: TriggerConfigShape,
  now = new Date(),
): TriggerMatch[] {
  const threshold = config.thresholdDays ?? 1;
  const activeOthers = otherProjects.filter((project) => {
    if (!project.lastActive) return false;
    const diffHours = hoursBetween(now, project.lastActive);
    return diffHours <= 24;
  });

  if (activeOthers.length === 0) {
    return [];
  }

  return mandatoryProjects
    .filter((project) => {
      if (!project.lastActive) return false;
      const diffDays = daysBetween(now, project.lastActive);
      return diffDays >= threshold;
    })
    .map((project) => ({
      triggerId: config.id,
      triggerType: config.type,
      projectId: project.id,
      projectName: project.name,
      reason: `Активность была только в других проектах (${activeOthers
        .slice(0, 1)
        .map((p) => p.name)
        .join(", ")})`,
    }));
}

export function evaluateMandatoryNoActiveTasks(
  projects: ProjectWithTasks[],
  config: TriggerConfigShape,
): TriggerMatch[] {
  return projects
    .filter((project) => project.type === "MANDATORY")
    .filter((project) => {
      const tasks = project.tasks ?? [];
      return !tasks.some((task) =>
        ["TODO", "IN_PROGRESS"].includes(task.status),
      );
    })
    .map((project) => ({
      triggerId: config.id,
      triggerType: config.type,
      projectId: project.id,
      projectName: project.name,
      reason: "Нет активных задач в очереди",
    }));
}

export class MandatoryTriggerEngine {
  constructor(private readonly db = prisma) {}

  async evaluate(now = new Date()): Promise<TriggerMatch[]> {
    const configs = await this.db.reminderTriggerConfig.findMany({
      where: { enabled: true },
    });

    if (configs.length === 0) {
      return [];
    }

    const projects = (await this.db.project.findMany({
      where: { status: { not: "DONE" } },
      include: { tasks: true },
    })) as ProjectWithTasks[];

    const mandatoryProjects = projects.filter(
      (project) => project.type === "MANDATORY",
    );
    const otherProjects = projects.filter(
      (project) => project.type !== "MANDATORY",
    );

    if (mandatoryProjects.length === 0) {
      return [];
    }

    const allMatches: TriggerMatch[] = [];

    for (const config of configs) {
      const matches = await this.evaluateConfig(
        config,
        mandatoryProjects,
        otherProjects,
        now,
      );

      if (matches.length === 0) {
        await this.updateEvaluationTimestamp(config.id, now);
        continue;
      }

      const eligible = await this.filterByCooldown(config, matches, now);
      if (eligible.length > 0) {
        allMatches.push(...eligible);
      }
      await this.updateEvaluationTimestamp(config.id, now);
    }

    return allMatches;
  }

  private async evaluateConfig(
    config: ReminderTriggerConfig,
    mandatoryProjects: ProjectWithTasks[],
    otherProjects: ProjectWithTasks[],
    now: Date,
  ): Promise<TriggerMatch[]> {
    switch (config.type) {
      case "MANDATORY_STALE":
        return evaluateMandatoryStale(mandatoryProjects, config, now);
      case "MANDATORY_IGNORED":
        return evaluateMandatoryIgnored(
          mandatoryProjects,
          otherProjects,
          config,
          now,
        );
      case "MANDATORY_NO_ACTIVE_TASKS":
        return evaluateMandatoryNoActiveTasks(mandatoryProjects, config);
      default:
        return [];
    }
  }

  private async filterByCooldown(
    config: ReminderTriggerConfig,
    matches: TriggerMatch[],
    now: Date,
  ): Promise<TriggerMatch[]> {
    const cutoff = new Date(
      now.getTime() - config.cooldownHours * MS_IN_HOUR,
    );
    const projectIds = matches.map((match) => match.projectId);

    if (projectIds.length === 0) {
      return matches;
    }

    const recentLogs = await this.db.reminderTriggerLog.findMany({
      where: {
        triggerId: config.id,
        projectId: { in: projectIds },
        firedAt: { gte: cutoff },
      },
      select: { projectId: true },
    });

    if (recentLogs.length === 0) {
      return matches;
    }

    const suppressed = new Set(
      recentLogs.map((log: Pick<ReminderTriggerLog, "projectId">) => log.projectId),
    );
    return matches.filter((match) => !suppressed.has(match.projectId));
  }

  private async updateEvaluationTimestamp(id: string, now: Date) {
    await this.db.reminderTriggerConfig.update({
      where: { id },
      data: { lastEvaluatedAt: now },
    });
  }
}

function daysBetween(now: Date, other: Date | string): number {
  const otherDate = new Date(other);
  return (now.getTime() - otherDate.getTime()) / MS_IN_DAY;
}

function hoursBetween(now: Date, other: Date | string): number {
  const otherDate = new Date(other);
  return (now.getTime() - otherDate.getTime()) / MS_IN_HOUR;
}
