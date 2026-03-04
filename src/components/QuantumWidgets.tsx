"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { getCompletedTasksCount } from "@/lib/project-utils";
import { quantumGradientClasses } from "@/lib/quantum-theme";
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
      color: "text-cyan-400",
      gradient: true,
    },
    {
      id: "tasks",
      title: "Задачи",
      value: `${Math.max(stats.completedTasks, 0)}/${Math.max(stats.totalTasks, 0)}`,
      description: "Выполнено / всего",
      icon: Target,
      color: "text-purple-400",
      gradient: false,
    },
    {
      id: "avg-progress",
      title: "Средний прогресс",
      value: `${Math.max(avgProgress, 0)}%`,
      description: "По всем проектам",
      icon: CheckCircle2,
      color: "text-green-400",
      gradient: false,
    },
    {
      id: "focus-time",
      title: "Фокус-время",
      value: formatDurationHms(stats.focusTimeMs),
      description: "Суммарно по задачам",
      icon: Clock3,
      color: "text-amber-400",
      gradient: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
      {widgets.map((widget) => (
        <div key={widget.id} className="widget-card transition-all duration-300 hover:border-cyan-500/40">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold ${widget.color}`}>{widget.title}</h3>
              <widget.icon className={`w-4 h-4 ${widget.color}`} />
            </div>
            <div className="text-3xl font-bold mb-2">
              {widget.gradient ? <span className={quantumGradientClasses.text}>{widget.value}</span> : widget.value}
            </div>
            <div className="text-sm text-qf-text-secondary mb-4">{widget.description}</div>
            <div className="quantum-progress">
              <div
                className="quantum-progress-fill"
                style={{ width: widget.id === "avg-progress" ? `${Math.max(avgProgress, 0)}%` : "100%" }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
