"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { getCompletedTasksCount } from "@/lib/project-utils";
import { formatDurationHms, parseDurationMs } from "@/lib/utils";
import { CheckCircle2, Clock3, FolderKanban, Target } from "lucide-react";

export function QuantumWidgets() {
  const { projects } = useProjectStore();

  const stats = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        if (project.progress < 100) acc.activeProjects += 1;
        acc.totalTasks += project.tasks?.length || 0;
        acc.completedTasks += getCompletedTasksCount(project.tasks);
        acc.progressSum += project.progress;
        acc.focusTimeMs += (project.tasks ?? []).reduce(
          (sum, task) => sum + parseDurationMs(task.timerLog),
          0,
        );
        return acc;
      },
      { activeProjects: 0, totalTasks: 0, completedTasks: 0, progressSum: 0, focusTimeMs: 0 },
    );
  }, [projects]);

  const avgProgress =
    projects.length > 0 ? Math.round(stats.progressSum / projects.length) : 0;

  const widgets = [
    {
      id: "active-projects",
      title: "Активные проекты",
      value: String(stats.activeProjects),
      description: "Проекты в работе",
      icon: FolderKanban,
      color: "text-qf-status-medium-text",
    },
    {
      id: "tasks",
      title: "Задачи",
      value: `${Math.max(stats.completedTasks, 0)}/${Math.max(stats.totalTasks, 0)}`,
      description: "Выполнено / всего",
      icon: Target,
      color: "text-qf-status-low-text",
    },
    {
      id: "avg-progress",
      title: "Средний прогресс",
      value: `${Math.max(avgProgress, 0)}%`,
      description: "По всем проектам",
      icon: CheckCircle2,
      color: "text-qf-status-high-text",
    },
    {
      id: "focus-time",
      title: "Фокус-время",
      value: formatDurationHms(stats.focusTimeMs),
      description: "Суммарно по задачам",
      icon: Clock3,
      color: "text-qf-status-medium-text",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
      {widgets.map((widget) => (
        <div key={widget.id} className="stat-box px-5 py-4 rounded-2xl min-w-[100px] shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold text-qf-text-muted tracking-tighter font-[var(--font-unbounded)]">{widget.title}</p>
            <widget.icon className={`w-3.5 h-3.5 ${widget.color}`} />
          </div>
          <div className={`stat-value text-2xl ${widget.color}`}>{widget.value}</div>
          <div className="text-[11px] text-qf-text-muted mt-1 font-medium">{widget.description}</div>
        </div>
      ))}
    </div>
  );
}
