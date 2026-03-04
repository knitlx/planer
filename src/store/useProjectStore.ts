import { create } from "zustand";
import type { ProjectStatus, ProjectWithMeta } from "@/types/project";
import { getApiErrorMessage } from "@/lib/api-client";

interface ProjectState {
  projects: ProjectWithMeta[];
  filter: string;
  sortBy: "score" | "progress" | "recent";
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  createProject: (
    name: string,
    weight?: number,
    friction?: number,
  ) => Promise<void>;
  updateProjectStatus: (
    id: string,
    status: ProjectStatus,
    lastSessionNote?: string,
  ) => Promise<void>;
  setFilter: (filter: string) => void;
  setSortBy: (sortBy: "score" | "progress" | "recent") => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  filter: "",
  sortBy: "score",
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const projects = (await response.json()) as ProjectWithMeta[];
      set({ projects, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  createProject: async (name, weight = 5, friction = 5) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, weight, friction }),
    });
    if (!response.ok) throw new Error("Failed to create project");
    await get().fetchProjects();
  },

  updateProjectStatus: async (id, status, lastSessionNote) => {
    const response = await fetch(`/api/projects/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, lastSessionNote }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as unknown;
      throw new Error(getApiErrorMessage(payload) || "Не удалось обновить статус");
    }
    await get().fetchProjects();
  },

  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),
}));
