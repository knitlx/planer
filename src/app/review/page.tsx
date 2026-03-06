"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReviewPage() {
  const { projects, fetchProjects, isLoading } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  if (isLoading)
    return <div className="p-8 text-text-secondary">Загрузка...</div>;

  const completedProjects = projects.filter((p) => p.progress >= 100);
  const inProgressProjects = projects.filter(
    (p) => p.progress > 0 && p.progress < 100,
  );
  const staleProjects = projects.filter((p) => {
    const daysSinceUpdate = p.lastActive
      ? Math.floor(
          (Date.now() - new Date(p.lastActive).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
    return daysSinceUpdate >= 3;
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">
          Обзор прогресса
        </h1>

        <div className="space-y-6">
          {inProgressProjects.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                В работе
              </h2>
              <div className="space-y-4">
                {inProgressProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-4 p-3 bg-qf-bg-secondary/70 border border-qf-border-secondary rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 quantum-progress">
                          <div
                            className="quantum-progress-fill h-2"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-text-secondary">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                    <Link href={`/focus/${project.id}`}>
                      <Button size="sm" variant="outline">
                        Открыть
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedProjects.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Завершённые
              </h2>
              <div className="space-y-2">
                {completedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 p-3 text-text-muted"
                  >
                    <span>✓</span>
                    <span>{project.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {staleProjects.length > 0 && (
            <div className="card p-6 border-qf-border-primary">
              <h2 className="text-lg font-semibold text-qf-text-accent mb-4">
                Без активности
              </h2>
              <div className="space-y-2">
                {staleProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 p-3 text-text-muted"
                  >
                    <span className="text-qf-text-accent">⏰</span>
                    <span>{project.name}</span>
                    <span className="text-xs">
                      (
                      {project.lastActive
                        ? Math.floor(
                            (Date.now() -
                              new Date(project.lastActive).getTime()) /
                              (1000 * 60 * 60 * 24),
                          )
                        : 0}{" "}
                      дней)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-text-muted">Нет проектов для обзора</p>
            </div>
          )}

          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              На главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
