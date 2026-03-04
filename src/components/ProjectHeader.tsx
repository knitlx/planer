"use client";

import type { ProjectWithMeta } from "@/types/project";
import { getCompletedTasksCount } from "@/lib/project-utils";
import { formatDurationHms, parseDurationMs } from "@/lib/utils";
import {
  quantumGlass,
  quantumGradientClasses,
  getStatusByProgress,
  getStatusColor,
} from "@/lib/quantum-theme";
import { ArrowLeft, Settings, Sparkles } from "lucide-react";

interface ProjectHeaderProps {
  project: ProjectWithMeta;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function ProjectHeader({
  project,
  onBack,
  onOpenSettings,
}: ProjectHeaderProps) {
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = getCompletedTasksCount(project.tasks);
  const totalFocusTime = (project.tasks ?? []).reduce(
    (sum, task) => sum + parseDurationMs(task.timerLog),
    0,
  );
  const status = getStatusByProgress(project.progress);
  const statusColor = getStatusColor(status);
  const projectStatusLabel =
    project.status === "ACTIVE"
      ? "В работе"
      : project.status === "SNOOZED"
        ? "На паузе"
        : project.status === "FINAL_STRETCH"
          ? "Финальный рывок"
          : "Инкубатор";

  return (
    <header className={`${quantumGlass.base} rounded-3xl border p-6 md:p-8`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-qf-text-secondary hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>
        <button
          onClick={onOpenSettings}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white hover:border-qf-border-accent transition-colors"
        >
          <Settings className="w-4 h-4" />
          Настройки
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-qf-bg-secondary/80 border border-qf-border-secondary text-xs text-qf-text-secondary mb-4">
            <Sparkles className="w-3 h-3" />
            Focus Flow
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{project.name}</h1>
          {project.description ? (
            <p className="max-w-2xl text-sm text-qf-text-secondary mb-3 whitespace-pre-wrap">
              {project.description}
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded-full bg-qf-bg-secondary/80 border border-qf-border-secondary">
              Вес: {project.weight}
            </span>
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
            >
              {status === "completed" ? "Завершен" : projectStatusLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
          <div className="rounded-xl bg-qf-bg-secondary/80 border border-qf-border-secondary px-4 py-3 text-center">
            <div className={`text-2xl font-bold ${quantumGradientClasses.text}`}>
              {project.progress}%
            </div>
            <div className="text-[10px] uppercase tracking-wider text-qf-text-muted">
              Прогресс
            </div>
          </div>
          <div className="rounded-xl bg-qf-bg-secondary/80 border border-qf-border-secondary px-4 py-3 text-center">
            <div className="text-2xl font-bold">{totalTasks}</div>
            <div className="text-[10px] uppercase tracking-wider text-qf-text-muted">
              Задачи
            </div>
          </div>
          <div className="rounded-xl bg-qf-bg-secondary/80 border border-qf-border-secondary px-4 py-3 text-center">
            <div className="text-2xl font-bold">{completedTasks}</div>
            <div className="text-[10px] uppercase tracking-wider text-qf-text-muted">
              Выполнено
            </div>
          </div>
          <div className="rounded-xl bg-qf-bg-secondary/80 border border-qf-border-secondary px-4 py-3 text-center">
            <div className="text-2xl font-bold">{formatDurationHms(totalFocusTime)}</div>
            <div className="text-[10px] uppercase tracking-wider text-qf-text-muted">
              Время
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
