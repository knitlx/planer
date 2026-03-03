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
      title: "АКТИВНАЯ СЕССИЯ",
      value: "24:17",
      description: "Квантовый анализ данных",
      icon: Clock,
      color: "text-cyan-400",
      gradient: true,
    },
    {
      id: "active",
      title: "СЕГОДНЯ",
      value: `${Math.max(stats.completedTasks, 0)}/${Math.max(stats.totalTasks, 0)}`,
      description: "Фокус-время 3ч 42м",
      icon: Target,
      color: "text-purple-400",
      gradient: false,
    },
    {
      id: "focus-energy",
      title: "ЭНЕРГИЯ ВНИМАНИЯ",
      value: `${Math.max(avgProgress, 84)}%`,
      description: "Оптимальный уровень",
      icon: Zap,
      color: "text-green-400",
      gradient: false,
    },
    {
      id: "quick",
      title: "БЫСТРЫЕ ДЕЙСТВИЯ",
      value: "",
      description: "",
      icon: TrendingUp,
      color: "",
      gradient: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {widgets.map((widget) => (
        <div key={widget.id} className="widget-card transition-all duration-300 hover:border-cyan-500/40">
          {widget.id === "quick" ? (
            <>
              <h3 className={`font-bold gradient-text mb-4`}>{widget.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-3 rounded-lg bg-qf-bg-secondary/70 border border-qf-border-primary hover:border-cyan-500/50 transition-colors">⚡</button>
                <button className="p-3 rounded-lg bg-qf-bg-secondary/70 border border-qf-border-primary hover:border-purple-500/50 transition-colors">💡</button>
                <button className="p-3 rounded-lg bg-qf-bg-secondary/70 border border-qf-border-primary hover:border-cyan-500/50 transition-colors">📊</button>
                <button className="p-3 rounded-lg bg-qf-gradient-subtle border border-qf-border-accent hover:border-cyan-400 transition-colors">🚀</button>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${widget.color}`}>{widget.title}</h3>
                {widget.id === "time" && <div className="text-xs bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded">LIVE</div>}
              </div>
              <div className="text-3xl font-bold mb-2">
                {widget.gradient ? <span className={quantumGradientClasses.text}>{widget.value}</span> : widget.value}
              </div>
              <div className="text-sm text-qf-text-secondary mb-4">{widget.description}</div>
              <div className="quantum-progress">
                <div className="quantum-progress-fill" style={{ width: widget.id === "active" ? "67%" : "84%" }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
