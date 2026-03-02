"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { useFocusStore } from "@/store/useFocusStore";
import { QuantumWidgets } from "@/components/QuantumWidgets";
import { ProjectGrid } from "@/components/ProjectGrid";
import { QuickCollect } from "@/components/QuickCollect";
import { TheFocusRoom } from "@/components/TheFocusRoom";
import { getCompletedTasksCount } from "@/lib/project-utils";
import { quantumGradientClasses } from "@/lib/quantum-theme";
import { Plus, Zap, Target, Brain } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  const { currentProjectId } = useFocusStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelectProject = (projectId: string) => {
    router.push(`/focus/${projectId}`);
  };

  const projectStats = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        if (project.progress < 100) acc.active += 1;
        if (project.progress >= 100) acc.completed += 1;
        if (project.progress === 0) acc.notStarted += 1;

        if (project.weight >= 8) acc.highPriority += 1;
        else if (project.weight >= 5) acc.mediumPriority += 1;
        else acc.lowPriority += 1;

        acc.totalTasks += project.tasks?.length || 0;
        acc.completedTasks += getCompletedTasksCount(project.tasks);
        acc.progressSum += project.progress;

        return acc;
      },
      {
        active: 0,
        completed: 0,
        notStarted: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
        totalTasks: 0,
        completedTasks: 0,
        progressSum: 0,
      },
    );
  }, [projects]);

  const averageProgress =
    projects.length > 0
      ? Math.round(projectStats.progressSum / projects.length)
      : 0;

  const quickActions = [
    {
      id: "new-project",
      title: "Новый проект",
      description: "Создать проект с задачами",
      icon: Plus,
      color: "from-purple-500 to-blue-500",
      onClick: () => router.push("/focus/new"),
    },
    {
      id: "quick-collect",
      title: "Быстрый сбор",
      description: "Записать идею или задачу",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      onClick: () => {
        const quickCollect = document.getElementById("quick-collect");
        if (quickCollect) {
          quickCollect.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
    {
      id: "new-task",
      title: "Новая задача",
      description: "Добавить задачу в проект",
      icon: Target,
      color: "from-purple-500 to-pink-500",
      onClick: () => {
        if (projects.length > 0) {
          router.push(`/focus/${projects[0].id}/tasks/new`);
        } else {
          router.push("/focus/new");
        }
      },
    },
    {
      id: "quick-focus",
      title: "Быстрый фокус",
      description: "Начать сессию фокуса",
      icon: Brain,
      color: "from-cyan-500 to-blue-500",
      onClick: () => {
        if (projects.length > 0) {
          router.push(`/focus/${projects[0].id}`);
        }
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="p-12">
        <div className="animate-pulse">
          <div className="h-8 bg-qf-bg-secondary rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-qf-bg-secondary rounded-2xl"></div>
            ))}
          </div>
          <div className="h-64 bg-qf-bg-secondary rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-red-400 mb-2">Ошибка загрузки</h3>
          <p className="text-qf-text-secondary">{error}</p>
          <button
            onClick={fetchProjects}
            className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentProjectId && <TheFocusRoom />}

      <div className="p-6 md:p-12 animate-in fade-in duration-300">
        {/* Заголовок */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className={quantumGradientClasses.text}>Главная панель</span>
          </h1>
          <p className="text-lg text-qf-text-secondary max-w-2xl">
            Добро пожаловать в Focus Flow. Здесь вы найдете все ваши проекты, задачи и статистику продуктивности.
          </p>
        </header>

        {/* Виджеты реального времени */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Обзор</h2>
          <QuantumWidgets />
        </section>

        {/* Быстрые действия */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className={`bg-gradient-to-br ${action.color} rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-qf-glow hover:translate-y-[-2px] group`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{action.title}</h3>
                    <p className="text-sm text-white/80">{action.description}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Сетка проектов */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Ваши проекты</h2>
            <div className="text-sm text-qf-text-muted">
              {projects.length} {projects.length === 1 ? "проект" : projects.length < 5 ? "проекта" : "проектов"}
            </div>
          </div>
          <ProjectGrid projects={projects} onSelectProject={handleSelectProject} />
        </section>

        {/* Статистика продуктивности */}
        {projects.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Статистика продуктивности</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-qf-bg-secondary rounded-2xl p-6 border border-qf-border-glass">
                <h3 className="font-bold mb-4">Распределение по статусам</h3>
                <div className="space-y-4">
                  {[
                    { label: "В работе", value: projectStats.active, color: "bg-blue-500" },
                    { label: "Завершены", value: projectStats.completed, color: "bg-purple-500" },
                    { label: "Не начаты", value: projectStats.notStarted, color: "bg-gray-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-qf-bg-secondary rounded-2xl p-6 border border-qf-border-glass">
                <h3 className="font-bold mb-4">Прогресс по приоритетам</h3>
                <div className="space-y-4">
                  {[
                    { label: "Высокий", value: projectStats.highPriority, color: "bg-red-500" },
                    { label: "Средний", value: projectStats.mediumPriority, color: "bg-yellow-500" },
                    { label: "Низкий", value: projectStats.lowPriority, color: "bg-green-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-qf-bg-secondary rounded-2xl p-6 border border-qf-border-glass">
                <h3 className="font-bold mb-4">Общая статистика</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Всего задач</span>
                    <span className="font-bold">{projectStats.totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Выполнено задач</span>
                    <span className="font-bold">{projectStats.completedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Средний прогресс</span>
                    <span className="font-bold">{averageProgress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quick Collect */}
        <section id="quick-collect" className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Быстрый сбор идей</h2>
          <QuickCollect />
        </section>
      </div>
    </>
  );
}
