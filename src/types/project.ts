export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type ProjectStatus = "INCUBATOR" | "ACTIVE" | "SNOOZED" | "FINAL_STRETCH";

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
