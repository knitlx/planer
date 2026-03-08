import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  ReminderTriggerStatus,
  ReminderTriggerType,
  type Project,
  type ReminderTriggerConfig,
  type ReminderTriggerLog,
  type Task,
  type TaskStatus,
} from "@prisma/client";

const HOURS_IN_MS = 60 * 60 * 1000;
const DAYS_IN_MS = 24 * HOURS_IN_MS;
const ACTIVE_TASK_STATUSES: ReadonlySet<TaskStatus> = new Set([
  "TODO",
  "IN_PROGRESS",
]);
const DEFAULT_STALE_DAYS = 2;
const DEFAULT_IGNORED_DAYS = 1;

export interface MandatoryProjectSnapshot {
  id: string;
  name: string;
  lastActive: Date;
  updatedAt: Date;
  tasks: Pick<Task, "status">[];
}

export interface MandatoryTriggerMatch {
  project: MandatoryProjectSnapshot;
  reason: string;
}

export interface MandatoryTriggerEvent extends MandatoryTriggerMatch {
  trigger: ReminderTriggerConfig;
}

export class MandatoryTriggerEngine {
  constructor(private readonly client = prisma) {}

  async evaluate(now = new Date()): Promise<MandatoryTriggerEvent[]> {
    const configs = await this.client.reminderTriggerConfig.findMany({
      where: { enabled: true },
      orderBy: { type: "asc" },
    });

    if (configs.length === 0) {
      return [];
    }

    const [mandatoryProjects, normalProjects] = await Promise.all([
      this.client.project.findMany({
        where: { type: "MANDATORY", status: { not: "DONE" } },
        include: {
          tasks: {
            select: { status: true },
          },
        },
      }),
      this.client.project.findMany({
        where: { type: { not: "MANDATORY" }, status: { not: "DONE" } },
        select: { id: true, lastActive: true, updatedAt: true },
      }),
    ]);

    if (mandatoryProjects.length === 0) {
      return [];
    }

    const snapshots = mandatoryProjects.map(toSnapshot);
    const normalSnapshots = normalProjects.map((project) => ({
      id: project.id,
      lastActive: project.lastActive,
      updatedAt: project.updatedAt,
    }));

    const cooldownWindowStart = this.computeCooldownWindow(configs, now);
    const recentLogs = await this.client.reminderTriggerLog.findMany({
      where: {
        triggerId: { in: configs.map((cfg) => cfg.id) },
        firedAt: cooldownWindowStart ? { gte: cooldownWindowStart } : undefined,
      },
      select: { triggerId: true, projectId: true, firedAt: true },
    });

    const latestLogByKey = new Map<string, ReminderTriggerLog["firedAt"]>();
    for (const log of recentLogs) {
      const key = this.logKey(log.triggerId, log.projectId);
      const current = latestLogByKey.get(key);
      if (!current || current < log.firedAt) {
        latestLogByKey.set(key, log.firedAt);
      }
    }

    const events: MandatoryTriggerEvent[] = [];
    for (const config of configs) {
      const matches = evaluateConfig(config, snapshots, normalSnapshots, now);
      for (const match of matches) {
        const key = this.logKey(config.id, match.project.id);
        const lastFired = latestLogByKey.get(key);
        if (
          lastFired &&
          now.getTime() - lastFired.getTime() < config.cooldownHours * HOURS_IN_MS
        ) {
          continue;
        }
        events.push({ trigger: config, ...match });
      }
    }

    await this.client.reminderTriggerConfig.updateMany({
      where: { id: { in: configs.map((cfg) => cfg.id) } },
      data: { lastEvaluatedAt: now },
    });

    return events;
  }

  async recordLogs(
    events: MandatoryTriggerEvent[],
    status: ReminderTriggerStatus,
    messageHash?: string,
  ) {
    if (events.length === 0) return;

    await this.client.reminderTriggerLog.createMany({
      data: events.map((event) => ({
        triggerId: event.trigger.id,
        projectId: event.project.id,
        status,
        messageHash,
      })),
    });
  }

  private computeCooldownWindow(
    configs: ReminderTriggerConfig[],
    now: Date,
  ): Date | undefined {
    if (configs.length === 0) return undefined;
    const maxHours = Math.max(...configs.map((cfg) => cfg.cooldownHours));
    return new Date(now.getTime() - maxHours * HOURS_IN_MS);
  }

  private logKey(triggerId: string, projectId?: string | null) {
    return `${triggerId}:${projectId ?? "none"}`;
  }
}

function toSnapshot(project: Project & { tasks: Pick<Task, "status">[] }): MandatoryProjectSnapshot {
  return {
    id: project.id,
    name: project.name,
    lastActive: project.lastActive,
    updatedAt: project.updatedAt,
    tasks: project.tasks,
  };
}

function evaluateConfig(
  config: ReminderTriggerConfig,
  projects: MandatoryProjectSnapshot[],
  normalProjects: Pick<Project, "id" | "lastActive" | "updatedAt">[],
  now: Date,
): MandatoryTriggerMatch[] {
  switch (config.type) {
    case ReminderTriggerType.MANDATORY_STALE:
      return evaluateMandatoryStale(
        projects,
        config.thresholdDays ?? DEFAULT_STALE_DAYS,
        now,
      );
    case ReminderTriggerType.MANDATORY_NO_ACTIVE_TASKS:
      return evaluateMandatoryNoActiveTasks(projects);
    case ReminderTriggerType.MANDATORY_IGNORED:
      return evaluateMandatoryIgnored(
        projects,
        normalProjects,
        config.thresholdDays ?? DEFAULT_IGNORED_DAYS,
        now,
      );
    default:
      return [];
  }
}

export function evaluateMandatoryStale(
  projects: MandatoryProjectSnapshot[],
  thresholdDays = DEFAULT_STALE_DAYS,
  now = new Date(),
): MandatoryTriggerMatch[] {
  const thresholdMs = thresholdDays * DAYS_IN_MS;
  return projects
    .filter((project) => now.getTime() - project.lastActive.getTime() >= thresholdMs)
    .map((project) => ({
      project,
      reason: `Проект простаивает уже ${daysBetween(project.lastActive, now)} дн.`,
    }));
}

export function evaluateMandatoryNoActiveTasks(
  projects: MandatoryProjectSnapshot[],
): MandatoryTriggerMatch[] {
  return projects
    .filter(
      (project) =>
        project.tasks.length === 0 ||
        project.tasks.every((task) => !ACTIVE_TASK_STATUSES.has(task.status)),
    )
    .map((project) => ({
      project,
      reason: "Нет активных задач",
    }));
}

export function evaluateMandatoryIgnored(
  mandatoryProjects: MandatoryProjectSnapshot[],
  otherProjects: Pick<Project, "id" | "lastActive" | "updatedAt">[],
  thresholdDays = DEFAULT_IGNORED_DAYS,
  now = new Date(),
): MandatoryTriggerMatch[] {
  const thresholdMs = thresholdDays * DAYS_IN_MS;
  const hasRecentNormalWork = otherProjects.some(
    (project) => now.getTime() - new Date(project.lastActive).getTime() < thresholdMs,
  );

  if (!hasRecentNormalWork) {
    return [];
  }

  return mandatoryProjects
    .filter((project) => now.getTime() - project.lastActive.getTime() >= thresholdMs)
    .map((project) => ({
      project,
      reason: "За последние дни ты работал только над обычными проектами",
    }));
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / DAYS_IN_MS));
}
