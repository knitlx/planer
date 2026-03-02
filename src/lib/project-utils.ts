import type { Task, TaskStatus } from "@/types/project";

export const TASK_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const;

export function isTaskCompleted(status: TaskStatus): boolean {
  return status === TASK_STATUS.DONE;
}

export function getCompletedTasksCount(tasks?: Task[]): number {
  return tasks?.filter((task) => isTaskCompleted(task.status)).length || 0;
}

export function getPriorityLabel(weight: number): string {
  if (weight >= 8) return "Высокий";
  if (weight >= 5) return "Средний";
  return "Низкий";
}
