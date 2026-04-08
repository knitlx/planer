"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReviewPage() {
  const { projects, fetchProjects, isLoading } = useProjectStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchProjects();
      setInitialized(true);
    };
    void init();
  }, [fetchProjects]);

  if (isLoading || !initialized)
    return <div className="min-h-screen flex items-center justify-center text-qf-text-secondary">Загрузка...</div>;

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

  const emptyState =
    projects.length > 0 &&
    completedProjects.length === 0 &&
    inProgressProjects.length === 0 &&
    staleProjects.length === 0;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-qf-text-primary mb-8">
          Обзор прогресса
        </h1>

        <div className="space-y-6">
          {inProgressProjects.length > 0 && (
            <div className="card p-4 md:p-6">
              <h2 className="text-lg font-semibold text-qf-text-primary mb-4">
                В работе
              </h2>
              <div className="space-y-4">
                {inProgressProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-4 p-3 bg-qf-bg-secondary/70 border border-qf-border-secondary rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-qf-text-primary break-words">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 rounded-full bg-qf-bg-tertiary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#ffc300] to-[#ff5f33]"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-qf-text-secondary shrink-0">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                    <Link href={`/focus/${project.id}`}>
                      <Button size="sm" variant="outline" className="shrink-0">
                        Открыть
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedProjects.length > 0 && (
            <div className="card p-4 md:p-6">
              <h2 className="text-lg font-semibold text-qf-text-primary mb-4">
                Завершённые
              </h2>
              <div className="space-y-2">
                {completedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 p-3 text-qf-text-muted"
                  >
                    <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{project.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {staleProjects.length > 0 && (
            <div className="card p-4 md:p-6 border-qf-border-primary">
              <h2 className="text-lg font-semibold text-qf-text-accent mb-4">
                Без активности
              </h2>
              <div className="space-y-2">
                {staleProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 p-3 text-qf-text-muted"
                  >
                    <svg className="w-4 h-4 text-qf-text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="flex-1 min-w-0 break-words">{project.name}</span>
                    <span className="text-xs shrink-0">
                      {project.lastActive
                        ? Math.floor(
                            (Date.now() -
                              new Date(project.lastActive).getTime()) /
                              (1000 * 60 * 60 * 24),
                          )
                        : 0}{" "}
                      дн.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {emptyState && (
            <div className="card p-8 text-center">
              <p className="text-qf-text-muted">Все проекты в норме — без активности или завершены</p>
            </div>
          )}

          {projects.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-qf-text-muted">Нет проектов для обзора</p>
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
