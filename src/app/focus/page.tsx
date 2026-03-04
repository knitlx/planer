"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { useRouter } from "next/navigation";
import { Flame, ArrowRight, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function FocusPage() {
  const { projects, fetchProjects, isLoading } = useProjectStore();
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleEnterFocus = (projectId: string) => {
    router.push(`/focus/${projectId}`);
  };

  const statusLabel = (status: string) => {
    if (status === "ACTIVE") return "В работе";
    if (status === "SNOOZED") return "На паузе";
    if (status === "FINAL_STRETCH") return "Финальный рывок";
    return "Инкубатор";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.progress < 100);
  const completedProjects = projects.filter((p) => p.progress >= 100);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-qf-gradient-primary flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Focus Room
              </h1>
              <p className="text-text-secondary">
                Выберите проект для глубокой работы
              </p>
            </div>
          </div>
        </header>

        {activeProjects.length === 0 && completedProjects.length === 0 ? (
          <div className="text-center py-12 card">
            <p className="text-text-muted">Создайте проект чтобы начать</p>
          </div>
        ) : (
          <>
            {activeProjects.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Активные проекты
                </h2>
                <div className="space-y-3">
                  {activeProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card p-4 flex items-center justify-between hover:border-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleEnterFocus(project.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-qf-gradient-subtle border border-qf-border-secondary flex items-center justify-center">
                          <Target className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary">
                            {project.name}
                          </h3>
                          <p className="text-sm text-text-muted">
                            Прогресс: {project.progress}% · Статус: {statusLabel(project.status)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-text-muted" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {completedProjects.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Завершённые
                </h2>
                <div className="space-y-2 opacity-60">
                  {completedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="card p-3 flex items-center gap-3"
                    >
                      <span className="text-text-muted">✓ {project.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
