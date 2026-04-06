import { prisma } from "@/lib/prisma";

const PROJECT_STATUSES = ["INCUBATOR", "ACTIVE", "SNOOZED", "FINAL_STRETCH", "DONE"] as const;
const PROJECT_TYPES = ["MANDATORY", "NORMAL"] as const;
const TASK_TYPES = ["ACTION", "SESSION"] as const;
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
const IDEA_STATUSES = ["INBOX", "CONVERTED_TO_TASK", "CONVERTED_TO_PROJECT", "ARCHIVED"] as const;

export type AgentToolName =
  | "list_projects"
  | "create_project"
  | "update_project"
  | "delete_project"
  | "list_tasks"
  | "create_task"
  | "update_task"
  | "delete_task"
  | "list_habits"
  | "create_habit"
  | "update_habit"
  | "set_habit_completion"
  | "list_ideas"
  | "create_idea"
  | "update_idea_status";

export type AgentToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  return normalized;
}

function asOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.round(value);
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value !== "boolean") return undefined;
  return value;
}

function asEnum<T extends readonly string[]>(value: unknown, allowed: T): T[number] | undefined {
  if (typeof value !== "string") return undefined;
  return allowed.includes(value as T[number]) ? (value as T[number]) : undefined;
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: unknown): string | undefined {
  const date = asTrimmedString(value);
  if (!date) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date must be in YYYY-MM-DD format");
  }
  return date;
}

function calculateStreak(logs: { date: string; completed: boolean }[]): { current: number; best: number } {
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let previousDate: Date | null = null;

  for (const log of sortedLogs) {
    if (!log.completed) {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 0;
      previousDate = null;
      continue;
    }

    const logDate = new Date(log.date);
    if (!previousDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (logDate.getTime() >= yesterday.getTime()) {
        currentStreak = 1;
      }
      tempStreak = 1;
    } else {
      const diff = (previousDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak += 1;
        if (currentStreak > 0) currentStreak += 1;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
        currentStreak = 0;
      }
    }
    previousDate = logDate;
  }

  bestStreak = Math.max(bestStreak, tempStreak);
  return { current: currentStreak, best: bestStreak };
}

async function listProjects() {
  return prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { tasks: true },
  });
}

async function createProject(input: Record<string, unknown>) {
  const name = asTrimmedString(input.name);
  if (!name) throw new Error("name is required");

  return prisma.project.create({
    data: {
      name,
      description: asTrimmedString(input.description) || null,
      weight: asOptionalNumber(input.weight) ?? 5,
      friction: asOptionalNumber(input.friction) ?? 5,
      status: asEnum(input.status, PROJECT_STATUSES) ?? "INCUBATOR",
      type: asEnum(input.type, PROJECT_TYPES) ?? "NORMAL",
    },
  });
}

async function updateProject(input: Record<string, unknown>) {
  const id = asTrimmedString(input.id);
  if (!id) throw new Error("id is required");

  return prisma.project.update({
    where: { id },
    data: {
      name: asTrimmedString(input.name),
      description: input.description === null ? null : asTrimmedString(input.description),
      weight: asOptionalNumber(input.weight),
      friction: asOptionalNumber(input.friction),
      status: asEnum(input.status, PROJECT_STATUSES),
      type: asEnum(input.type, PROJECT_TYPES),
    },
  });
}

async function deleteProject(input: Record<string, unknown>) {
  const id = asTrimmedString(input.id);
  if (!id) throw new Error("id is required");

  const project = await prisma.project.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });

  if (!project) throw new Error("project not found");
  if (project._count.tasks > 0) {
    throw new Error("project has tasks, delete tasks first");
  }

  await prisma.project.delete({ where: { id } });
  return { success: true };
}

async function listTasks(input: Record<string, unknown>) {
  const projectId = asTrimmedString(input.projectId);
  return prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { order: "asc" },
    take: 100,
  });
}

async function createTask(input: Record<string, unknown>) {
  let projectId = asTrimmedString(input.projectId);
  const projectName = asTrimmedString(input.projectName);
  const title = asTrimmedString(input.title);
  if (!projectId && projectName) {
    const project = await prisma.project.findFirst({
      where: { name: { contains: projectName } },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    projectId = project?.id;
  }
  if (!projectId) throw new Error("projectId (или projectName) is required");
  if (!title) throw new Error("title is required");

  return prisma.task.create({
    data: {
      projectId,
      title,
      type: asEnum(input.type, TASK_TYPES) ?? "ACTION",
      status: asEnum(input.status, TASK_STATUSES) ?? "TODO",
      order: asOptionalNumber(input.order) ?? 0,
      contextSummary: asTrimmedString(input.contextSummary) || null,
    },
  });
}

async function updateTask(input: Record<string, unknown>) {
  const id = asTrimmedString(input.id);
  if (!id) throw new Error("id is required");

  return prisma.task.update({
    where: { id },
    data: {
      title: asTrimmedString(input.title),
      contextSummary: input.contextSummary === null ? null : asTrimmedString(input.contextSummary),
      type: asEnum(input.type, TASK_TYPES),
      status: asEnum(input.status, TASK_STATUSES),
      order: asOptionalNumber(input.order),
    },
  });
}

async function deleteTask(input: Record<string, unknown>) {
  const id = asTrimmedString(input.id);
  if (!id) throw new Error("id is required");

  await prisma.task.delete({ where: { id } });
  return { success: true };
}

async function listHabits() {
  return prisma.habit.findMany({
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function createHabit(input: Record<string, unknown>) {
  const name = asTrimmedString(input.name);
  if (!name) throw new Error("name is required");

  return prisma.habit.create({
    data: {
      name,
      description: asTrimmedString(input.description) || null,
      projectId: asTrimmedString(input.projectId) || null,
    },
    include: {
      logs: true,
    },
  });
}

async function updateHabit(input: Record<string, unknown>) {
  const id = asTrimmedString(input.id);
  if (!id) throw new Error("id is required");

  return prisma.habit.update({
    where: { id },
    data: {
      name: asTrimmedString(input.name),
      description: input.description === null ? null : asTrimmedString(input.description),
      projectId: input.projectId === null ? null : asTrimmedString(input.projectId),
    },
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
  });
}

async function setHabitCompletion(input: Record<string, unknown>) {
  const habitId = asTrimmedString(input.habitId);
  if (!habitId) throw new Error("habitId is required");
  const completed = asOptionalBoolean(input.completed) ?? true;
  const date = parseDateKey(input.date) || getTodayDate();

  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { logs: { orderBy: { date: "desc" } } },
  });
  if (!habit) throw new Error("habit not found");

  const existingLog = habit.logs.find((log) => log.date === date);
  if (existingLog) {
    await prisma.habitLog.update({
      where: { id: existingLog.id },
      data: { completed },
    });
  } else {
    await prisma.habitLog.create({
      data: { habitId, date, completed },
    });
  }

  const logsAfterUpdate = await prisma.habitLog.findMany({
    where: { habitId },
    orderBy: { date: "desc" },
  });

  const streak = calculateStreak(logsAfterUpdate);
  await prisma.habit.update({
    where: { id: habitId },
    data: {
      currentStreak: streak.current,
      bestStreak: streak.best,
    },
  });

  return prisma.habit.findUnique({
    where: { id: habitId },
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
  });
}

async function listIdeas() {
  return prisma.idea.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

async function createIdea(input: Record<string, unknown>) {
  const content = asTrimmedString(input.content);
  if (!content) throw new Error("content is required");

  return prisma.idea.create({
    data: {
      content,
      source: asTrimmedString(input.source) || "AI Agent",
      projectId: asTrimmedString(input.projectId),
    },
  });
}

async function updateIdeaStatus(input: Record<string, unknown>) {
  const id = asTrimmedString(input.id);
  if (!id) throw new Error("id is required");

  const status = asEnum(input.status, IDEA_STATUSES);
  if (!status) throw new Error("status is required");

  return prisma.idea.update({
    where: { id },
    data: { status },
  });
}

export async function executeAgentTool(name: AgentToolName, rawInput: unknown): Promise<AgentToolResult> {
  try {
    const input = isRecord(rawInput) ? rawInput : {};

    switch (name) {
      case "list_projects":
        return { ok: true, data: await listProjects() };
      case "create_project":
        return { ok: true, data: await createProject(input) };
      case "update_project":
        return { ok: true, data: await updateProject(input) };
      case "delete_project":
        return { ok: true, data: await deleteProject(input) };
      case "list_tasks":
        return { ok: true, data: await listTasks(input) };
      case "create_task":
        return { ok: true, data: await createTask(input) };
      case "update_task":
        return { ok: true, data: await updateTask(input) };
      case "delete_task":
        return { ok: true, data: await deleteTask(input) };
      case "list_habits":
        return { ok: true, data: await listHabits() };
      case "create_habit":
        return { ok: true, data: await createHabit(input) };
      case "update_habit":
        return { ok: true, data: await updateHabit(input) };
      case "set_habit_completion":
        return { ok: true, data: await setHabitCompletion(input) };
      case "list_ideas":
        return { ok: true, data: await listIdeas() };
      case "create_idea":
        return { ok: true, data: await createIdea(input) };
      case "update_idea_status":
        return { ok: true, data: await updateIdeaStatus(input) };
      default:
        return { ok: false, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown tool execution error",
    };
  }
}

export const AGENT_TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "list_projects",
      description: "Get projects with task lists",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new project",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          weight: { type: "number" },
          friction: { type: "number" },
          status: { type: "string", enum: [...PROJECT_STATUSES] },
          type: { type: "string", enum: [...PROJECT_TYPES] },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_project",
      description: "Update project fields",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          weight: { type: "number" },
          friction: { type: "number" },
          status: { type: "string", enum: [...PROJECT_STATUSES] },
          type: { type: "string", enum: [...PROJECT_TYPES] },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_project",
      description: "Delete project (only when it has no tasks)",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "List tasks, optionally by project",
      parameters: {
        type: "object",
        properties: { projectId: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a task",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string" },
          projectName: { type: "string" },
          title: { type: "string" },
          contextSummary: { type: "string" },
          type: { type: "string", enum: [...TASK_TYPES] },
          status: { type: "string", enum: [...TASK_STATUSES] },
          order: { type: "number" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update task",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          contextSummary: { type: "string" },
          type: { type: "string", enum: [...TASK_TYPES] },
          status: { type: "string", enum: [...TASK_STATUSES] },
          order: { type: "number" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Delete task",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_ideas",
      description: "List ideas",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_idea",
      description: "Create idea item",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string" },
          source: { type: "string" },
          projectId: { type: "string" },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_idea_status",
      description: "Update idea status",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: [...IDEA_STATUSES] },
        },
        required: ["id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_habits",
      description: "List habits with recent logs",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_habit",
      description: "Create a new habit",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          projectId: { type: "string" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_habit",
      description: "Update habit fields",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          projectId: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_habit_completion",
      description: "Set completion for a habit on a specific date",
      parameters: {
        type: "object",
        properties: {
          habitId: { type: "string" },
          completed: { type: "boolean" },
          date: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["habitId"],
      },
    },
  },
] as const;
