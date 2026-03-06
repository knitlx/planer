export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type ProjectStatus = "INCUBATOR" | "ACTIVE" | "SNOOZED" | "FINAL_STRETCH" | "DONE";
export type ProjectType = "MANDATORY" | "NORMAL";

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  type?: "ACTION" | "SESSION";
  status: TaskStatus;
  isNextStep?: boolean;
  order?: number;
  timerLog?: string | null;
  contextSummary?: string | null;
  isSimplified?: boolean;
  priority?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Project {
  id: string;
  userId?: string | null;
  name: string;
  weight: number;
  progress: number;
  status: ProjectStatus;
  type: ProjectType;
  todayCompleted: boolean;
  lastCompletedAt?: string | Date | null;
  friction: number;
  lastActive: string | Date;
  lastSessionNote?: string | null;
  description?: string;
  deadline?: string | Date | null;
  tasks?: Task[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ProjectWithMeta extends Project {
  focusScore?: number;
  daysStale?: number;
}

export interface Habit {
  id: string;
  name: string;
  description?: string | null;
  projectId?: string | null;
  currentStreak: number;
  bestStreak: number;
  createdAt?: string | Date;
  logs?: HabitLog[];
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}
