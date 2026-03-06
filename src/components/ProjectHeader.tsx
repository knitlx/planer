"use client";

import { memo, useState } from "react";
import type { ProjectStatus, ProjectWithMeta } from "@/types/project";
import { getCompletedTasksCount, getPriorityFireIcons } from "@/lib/project-utils";
import { formatDurationHms, parseDurationMs } from "@/lib/utils";
import {
  quantumGlass,
  quantumGradientClasses,
} from "@/lib/quantum-theme";
import { ArrowLeft, Settings } from "lucide-react";

const projectStatusColors: Record<ProjectStatus, { bg: string; text: string }> = {
  DONE: { bg: "transparent", text: "" },
  ACTIVE: { bg: "rgba(255, 195, 0, 0.12)", text: "#ffc300" },
  FINAL_STRETCH: { bg: "rgba(255, 95, 51, 0.12)", text: "#ff5f33" },
  SNOOZED: { bg: "rgba(141, 136, 132, 0.12)", text: "#b7b0ab" },
  INCUBATOR: { bg: "rgba(162, 209, 73, 0.12)", text: "#a2d149" },
};

interface ProjectHeaderProps {
  project: ProjectWithMeta;
  onBack: () => void;
  onOpenSettings: () => void;
  onChangeStatus?: (status: ProjectStatus) => void;
  onMarkTodayCompleted?: () => void;
}

function ProjectHeaderInner({
  project,
  onBack,
  onOpenSettings,
  onChangeStatus,
  onMarkTodayCompleted,
}: ProjectHeaderProps) {
  const [editingStatus, setEditingStatus] = useState(false);
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = getCompletedTasksCount(project.tasks);
  const totalFocusTime = (project.tasks ?? []).reduce(
    (sum, task) => sum + parseDurationMs(task.timerLog),
    0,
  );
  const statusColor = projectStatusColors[project.status] || projectStatusColors.ACTIVE;
  const projectStatusLabel =
    project.status === "DONE"
      ? "Готово"
      : project.status === "ACTIVE"
      ? "В работе"
      : project.status === "SNOOZED"
        ? "На паузе"
        : project.status === "FINAL_STRETCH"
          ? "Финальный рывок"
          : "Инкубатор";
  const statusPillStyle =
    project.status === "DONE"
      ? undefined
      : { backgroundColor: statusColor.bg, color: statusColor.text };
  const statusPillClassName =
    project.status === "DONE"
      ? "text-xs px-2 py-1 rounded-full border border-qf-border-secondary text-qf-text-secondary"
      : "text-xs px-2 py-1 rounded-full cursor-pointer";

  return (
    <header className={`${quantumGlass.base} rounded-3xl border p-6 md:p-8`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FFC300] border border-[#FFC300] text-[#0A0908] font-semibold hover:brightness-105 transition-all"
        >
          <Settings className="w-4 h-4" />
          Настройки
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{project.name}</h1>
          {project.description ? (
            <p className="max-w-2xl text-sm text-qf-text-secondary mb-3 whitespace-pre-wrap">
              {project.description}
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded-full bg-qf-bg-secondary/80 border border-qf-border-secondary whitespace-nowrap">
              Важность: {getPriorityFireIcons(project.weight)}
            </span>
            {project.type === "MANDATORY" && onMarkTodayCompleted && (
              <button
                onClick={onMarkTodayCompleted}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  project.todayCompleted
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30"
                }`}
              >
                {project.todayCompleted ? "Выполнено" : "Отметить сегодня"}
              </button>
            )}
            {editingStatus && onChangeStatus ? (
              <select
                value={project.status}
                onChange={(event) => {
                  const next = event.target.value as ProjectStatus;
                  setEditingStatus(false);
                  onChangeStatus(next);
                }}
                className="text-xs px-2 py-1 rounded-full border border-qf-border-secondary bg-qf-bg-secondary text-qf-text-primary"
              >
                <option value="ACTIVE">В работе</option>
                <option value="SNOOZED">На паузе</option>
                <option value="FINAL_STRETCH">Финальный рывок</option>
                <option value="INCUBATOR">Инкубатор</option>
                <option value="DONE">Готово</option>
              </select>
            ) : (
              <span
                className={statusPillClassName}
                style={statusPillStyle}
                onClick={() => onChangeStatus ? setEditingStatus(true) : undefined}
              >
                {projectStatusLabel}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:w-auto flex-shrink-0 min-w-[280px]">
          <div className="rounded-xl bg-qf-bg-secondary/80 border border-qf-border-secondary px-4 py-3 text-center">
            <div className={`text-2xl font-bold ${quantumGradientClasses.text}`}>
              {project.progress}%
            </div>
            <div className="text-[10px] tracking-wide text-qf-text-muted">
              Прогресс
            </div>
          </div>
          <div className="rounded-xl bg-qf-bg-secondary/80 border border-qf-border-secondary px-4 py-3 text-center">
            <div className="text-2xl font-bold">{totalTasks}</div>
            <div className="text-[10px] tracking-wide text-qf-text-muted">
              Задачи
            </div>
          </div>
          <div className="rounded-xl bg-qf-bg-secondary/80 border border-qf-border-secondary px-4 py-3 text-center">
            <div className="text-2xl font-bold">{completedTasks}</div>
            <div className="text-[10px] tracking-wide text-qf-text-muted">
              Выполнено
            </div>
          </div>
          <div className="rounded-xl bg-qf-bg-secondary/80 border border-qf-border-secondary px-4 py-3 text-center">
            <div className="text-2xl font-bold">{formatDurationHms(totalFocusTime)}</div>
            <div className="text-[10px] tracking-wide text-qf-text-muted">
              Время
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export const ProjectHeader = memo(ProjectHeaderInner, (prevProps, nextProps) => {
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.progress === nextProps.project.progress &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.weight === nextProps.project.weight &&
    prevProps.project.description === nextProps.project.description &&
    prevProps.project.lastActive === nextProps.project.lastActive
  );
});
