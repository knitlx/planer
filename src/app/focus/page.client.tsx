"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { useRouter } from "next/navigation";
import { Flame, ArrowRight, Target, Lock, Unlock } from "lucide-react";
import { motion } from "framer-motion";
import type { ProjectType } from "@/types/project";

function isThailandBefore8AM(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const thailandHour = (utcHour + 7) % 24;
  return thailandHour < 8;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function FocusPage() {
  const { projects, fetchProjects, isLoading, updateProject } = useProjectStore();
  const router = useRouter();
  const [projectsUnlocked, setProjectsUnlocked] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (projects.length === 0) return;
    
    const resetMandatoryProjects = async () => {
      const now = new Date();
      const thailandHour = (now.getUTCHours() + 7) % 24; // Thailand = UTC+7
      
      // If it's before 8:00 Thailand time, no reset needed
      if (thailandHour < 8) return;
      
      const mandatoryProjects = projects.filter((p) => p.type === "MANDATORY");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Reset projects that were completed before today's 8:00 Thailand time
      const projectsToReset = mandatoryProjects.filter((p) => {
        if (!p.lastCompletedAt) return false;
        const completedAt = new Date(p.lastCompletedAt);
        // Reset if completed before today (meaning it was yesterday's completion)
        return completedAt < today;
      });
      
      if (projectsToReset.length > 0) {
        console.log('Resetting mandatory projects for new day:', projectsToReset.map(p => p.name));
        // Reset todayCompleted for projects completed before today
        for (const project of projectsToReset) {
          try {
            await updateProject(project.id, { todayCompleted: false });
          } catch (error) {
            console.error(`Failed to reset project ${project.name}:`, error);
          }
        }
      }
    };
    
    resetMandatoryProjects();
    
    // Also check for unlocking normal projects
    const thailandBefore8 = isThailandBefore8AM();
    if (!thailandBefore8) {
      const mandatoryProjects = projects.filter((p) => p.type === "MANDATORY");
      const allCompleted = mandatoryProjects.every(
        (p) => p.todayCompleted || p.lastCompletedAt
          ? isSameDay(new Date(p.lastCompletedAt!), new Date())
          : false
      );
      
      if (allCompleted) {
        setProjectsUnlocked(true);
      }
    }
  }, [projects, updateProject]);

  const handleEnterFocus = (projectId: string) => {
    router.push(`/focus/${projectId}`);
  };

  const handleMarkTodayCompleted = async (projectId: string) => {
    try {
      await updateProject(projectId, { todayCompleted: true });
      
      // Re-fetch projects to get updated state
      await fetchProjects();
    } catch (error) {
      console.error("Failed to mark project as completed:", error);
    }
  };

  const statusLabel = (status: string) => {
    if (status === "DONE") return "Готово";
    if (status === "ACTIVE") return "В работе";
    if (status === "SNOOZED") return "На паузе";
    if (status === "FINAL_STRETCH") return "Финальный рывок";
    return "Инкубатор";
  };

  const getTypeLabel = (type?: ProjectType) => {
    if (type === "MANDATORY") return "Обязательный";
    return "Обычный";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Загрузка...</div>
      </div>
    );
  }

  const mandatoryProjects = projects.filter(
    (p) => p.status !== "DONE" && p.type === "MANDATORY"
  );
  const normalProjects = projects.filter(
    (p) => p.status !== "DONE" && p.type !== "MANDATORY"
  );

  const allMandatoryCompleted = mandatoryProjects.every((p) => {
    if (!p.lastCompletedAt) return false;
    return isSameDay(new Date(p.lastCompletedAt), new Date());
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-qf-gradient-primary flex items-center justify-center">
              <Flame className="w-6 h-6 text-[#0A0908]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Focus Room</h1>
              <p className="text-text-secondary">Выберите проект для глубокой работы</p>
            </div>
          </div>
        </header>

        {mandatoryProjects.length === 0 && normalProjects.length === 0 ? (
          <div className="text-center py-12 card">
            <p className="text-text-muted">Создайте проект, чтобы начать</p>
          </div>
        ) : (
          <>
            {mandatoryProjects.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-yellow-400" />
                  <h2 className="text-lg font-semibold text-text-primary">Обязательные</h2>
                  {allMandatoryCompleted && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                      Выполнено
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {mandatoryProjects.map((project) => {
                    const isCompletedToday = project.lastCompletedAt 
                      ? isSameDay(new Date(project.lastCompletedAt), new Date())
                      : false;
                    
                    return (
                      <motion.button
                        type="button"
                        key={project.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card w-full text-left p-4 flex items-center justify-between hover:border-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-qf-border-accent border-l-4 border-l-yellow-400"
                        onClick={() => handleEnterFocus(project.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-qf-gradient-subtle border border-qf-border-secondary flex items-center justify-center">
                            <Target className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-text-primary">{project.name}</h3>
                            <p className="text-sm text-text-muted">
                              Прогресс: {project.progress}% · {statusLabel(project.status)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isCompletedToday && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkTodayCompleted(project.id);
                              }}
                              className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                            >
                              Отметить сегодня
                            </button>
                          )}
                          {isCompletedToday && (
                            <div className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                              ✓ Выполнено
                            </div>
                          )}
                          <ArrowRight className="w-5 h-5 text-text-muted" aria-hidden />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {normalProjects.length > 0 && (
              <div>
                {!projectsUnlocked ? (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card w-full text-left p-4 flex items-center justify-center gap-2 bg-qf-bg-secondary/50 border-dashed"
                    onClick={() => setProjectsUnlocked(true)}
                  >
                    <Unlock className="w-4 h-4 text-text-muted" />
                    <span className="text-text-muted">
                      Показать остальные проекты ({normalProjects.length})
                    </span>
                  </motion.button>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Unlock className="w-4 h-4 text-green-400" />
                      <h2 className="text-lg font-semibold text-text-primary">Остальные проекты</h2>
                    </div>
                    <div className="space-y-3">
                      {normalProjects.map((project) => (
                        <motion.button
                          type="button"
                          key={project.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="card w-full text-left p-4 flex items-center justify-between hover:border-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-qf-border-accent"
                          onClick={() => handleEnterFocus(project.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-qf-gradient-subtle border border-qf-border-secondary flex items-center justify-center">
                              <Target className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-text-primary">{project.name}</h3>
                              <p className="text-sm text-text-muted">
                                Прогресс: {project.progress}% · {statusLabel(project.status)}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-text-muted" aria-hidden />
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
