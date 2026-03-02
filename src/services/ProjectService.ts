import { prisma } from "@/lib/prisma";
import type { Project, Task } from "@prisma/client";

interface FocusScoreParams {
  weight: number;
  friction: number;
  progress: number;
  daysSinceActive: number;
}

export class ProjectService {
  static calculateFocusScore(params: FocusScoreParams): number {
    const { weight, friction, progress, daysSinceActive } = params;

    let score = weight * 10 + progress * 0.3;

    if (progress >= 70) score += 25;

    if (daysSinceActive >= 3) {
      score -= daysSinceActive * 5;
    }

    score -= friction * 3;

    return Math.max(0, score);
  }

  static getDaysSinceActive(project: { updatedAt: Date }): number {
    const now = new Date();
    const updated = new Date(project.updatedAt);
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  static async countActiveProjects(userId?: string): Promise<number> {
    return prisma.project.count({
      where: {
        userId,
        status: "ACTIVE",
      },
    });
  }

  static async getClosestToFinish(userId?: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: {
        userId,
        status: "FINAL_STRETCH",
      },
      orderBy: { progress: "desc" },
    });
  }

  static async enrichProjects(projects: (Project & { tasks?: Task[] })[]) {
    return projects.map((project) => ({
      ...project,
      focusScore: this.calculateFocusScore({
        weight: project.weight,
        friction: project.friction ?? 5,
        progress: project.progress,
        daysSinceActive: this.getDaysSinceActive(project),
      }),
      daysStale: this.getDaysSinceActive(project),
    }));
  }
}
