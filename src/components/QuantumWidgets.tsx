"use client";

import { useMemo } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { getCompletedTasksCount } from "@/lib/project-utils";
import { quantumGlass, quantumGradientClasses } from "@/lib/quantum-theme";
import { Clock, Target, Zap, TrendingUp } from "lucide-react";

export function QuantumWidgets() {
  const { projects } = useProjectStore();

  const stats = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        if (project.progress < 100) acc.activeProjects += 1;
        acc.totalTasks += project.tasks?.length || 0;
        acc.completedTasks += getCompletedTasksCount(project.tasks);
        acc.progressSum += project.progress;
        return acc;
      },
      { activeProjects: 0, totalTasks: 0, completedTasks: 0, progressSum: 0 },
    );
  }, [projects]);

  const avgProgress =
    projects.length > 0 ? Math.round(stats.progressSum / projects.length) : 0;

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Доброе утро";
    if (hour < 18) return "Добрый день";
    return "Добрый вечер";
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const widgets = [
    {
      id: "time",
      title: "Время и дата",
      value: getTimeOfDay(),
      description: formatDate(),
      icon: Clock,
      color: "from-purple-500 to-blue-500",
      gradient: true,
    },
    {
      id: "active",
      title: "Активные проекты",
      value: stats.activeProjects,
      description: "в работе",
      icon: Target,
      color: "bg-purple-500/20",
      gradient: false,
    },
    {
      id: "tasks",
      title: "Задачи",
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      description: "выполнено",
      icon: Zap,
      color: "bg-blue-500/20",
      gradient: false,
    },
    {
      id: "progress",
      title: "Средний прогресс",
      value: `${avgProgress}%`,
      description: "по всем проектам",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-purple-500/20 to-blue-500/20",
      gradient: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className={`${quantumGlass.base} rounded-2xl p-6 border border-qf-border-glass transition-all duration-300 hover:border-qf-border-accent hover:shadow-qf-glow group`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${widget.color} ${widget.gradient ? "bg-gradient-to-br" : ""}`}>
              <widget.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">
                {widget.gradient ? (
                  <span className={quantumGradientClasses.text}>{widget.value}</span>
                ) : (
                  <span>{widget.value}</span>
                )}
              </div>
              <div className="text-xs text-qf-text-muted uppercase tracking-wider">
                {widget.title}
              </div>
            </div>
          </div>
          <p className="text-sm text-qf-text-secondary">{widget.description}</p>
          <div className="mt-4 pt-4 border-t border-qf-border-secondary">
            <div className="flex items-center justify-between">
              <span className="text-xs text-qf-text-muted">Обновлено только что</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
