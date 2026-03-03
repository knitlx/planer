"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProjectStore } from "@/store/useProjectStore";
import { useFocusStore } from "@/store/useFocusStore";
import { QuantumWidgets } from "@/components/QuantumWidgets";
import { ProjectGrid } from "@/components/ProjectGrid";
import { QuickCollect } from "@/components/QuickCollect";
import { TheFocusRoom } from "@/components/TheFocusRoom";
import { getCompletedTasksCount } from "@/lib/project-utils";
import { quantumGradientClasses } from "@/lib/quantum-theme";
import { Plus, Zap, Target, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TaskStatus } from "@/types/project";
import { AppModal } from "@/components/AppModal";

export default function Dashboard() {
  const router = useRouter();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  const { currentProjectId } = useFocusStore();
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [showQuickFocusModal, setShowQuickFocusModal] = useState(false);
  const [selectedFocusTaskId, setSelectedFocusTaskId] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

  const availableFocusTasks = useMemo(() => {
    const activeStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS"];
    return projects.flatMap((project) =>
      (project.tasks ?? [])
        .filter((task) => activeStatuses.includes(task.status))
        .map((task) => ({
          id: task.id,
          title: task.title,
          projectId: project.id,
          projectName: project.name,
          status: task.status,
        })),
    );
  }, [projects]);

  const handleOpenAddTask = () => {
    if (projects.length === 0) {
      router.push("/focus/new");
      return;
    }
    setSelectedProjectId(projects[0].id);
    setShowAddTaskModal(true);
  };

  const handleCreateTask = async () => {
    const title = newTaskTitle.trim();
    if (!title || !selectedProjectId) return;

    setIsCreatingTask(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          projectId: selectedProjectId,
          type: "ACTION",
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось создать задачу");
      }

      toast.success("Задача создана");
      setShowAddTaskModal(false);
      setNewTaskTitle("");
      await fetchProjects();
      router.push(`/focus/${selectedProjectId}`);
    } catch {
      toast.error("Ошибка создания задачи");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleQuickFocus = () => {
    if (availableFocusTasks.length === 0) {
      toast.error("Нет активных задач для фокуса");
      return;
    }

    setSelectedFocusTaskId(availableFocusTasks[0].id);
    setShowQuickFocusModal(true);
  };

  const handleStartQuickFocus = () => {
    const selectedTask = availableFocusTasks.find(
      (task) => task.id === selectedFocusTaskId,
    );
    if (!selectedTask) return;
    setShowQuickFocusModal(false);
    router.push(`/focus/${selectedTask.projectId}/room?taskId=${selectedTask.id}`);
  };

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
        window.dispatchEvent(new Event("quick-collect:open"));
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
      onClick: handleOpenAddTask,
    },
    {
      id: "quick-focus",
      title: "Быстрый фокус",
      description: "Начать сессию фокуса",
      icon: Brain,
      color: "from-cyan-500 to-blue-500",
      onClick: handleQuickFocus,
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

      <div className="p-6 md:p-12 animate-in fade-in duration-300 text-white">
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

      <AppModal
        open={showAddTaskModal}
        title="Новая задача"
        onClose={() => {
          if (isCreatingTask) return;
          setShowAddTaskModal(false);
          setNewTaskTitle("");
        }}
        disableClose={isCreatingTask}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setShowAddTaskModal(false);
                setNewTaskTitle("");
              }}
              className="px-4 py-2 rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white transition-colors"
              disabled={isCreatingTask}
            >
              Отмена
            </button>
            <button
              onClick={handleCreateTask}
              className="px-4 py-2 rounded-lg bg-qf-gradient-primary text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              disabled={isCreatingTask || !newTaskTitle.trim() || !selectedProjectId}
            >
              {isCreatingTask ? "Создание..." : "Создать"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">Проект</label>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-white focus:outline-none focus:border-qf-border-accent"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">Название задачи</label>
            <Input
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="Что нужно сделать?"
              className="bg-qf-bg-secondary border-qf-border-primary"
            />
          </div>
        </div>
      </AppModal>

      <AppModal
        open={showQuickFocusModal}
        title="Быстрый фокус"
        description="Выбери задачу для фокус-сессии"
        onClose={() => setShowQuickFocusModal(false)}
        maxWidthClassName="max-w-2xl"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowQuickFocusModal(false)}
              className="px-4 py-2 rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleStartQuickFocus}
              className="px-4 py-2 rounded-lg bg-qf-gradient-primary text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              disabled={!selectedFocusTaskId}
            >
              Начать фокус
            </button>
          </div>
        }
      >
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {availableFocusTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedFocusTaskId(task.id)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                selectedFocusTaskId === task.id
                  ? "border-qf-border-accent bg-qf-gradient-subtle"
                  : "border-qf-border-secondary bg-qf-bg-secondary/50 hover:border-qf-border-primary"
              }`}
            >
              <p className="font-medium text-white">{task.title}</p>
              <p className="text-sm text-qf-text-secondary mt-1">{task.projectName}</p>
            </button>
          ))}
        </div>
      </AppModal>
    </>
  );
}
