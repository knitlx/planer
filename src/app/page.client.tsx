"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useProjectStore } from "@/store/useProjectStore";
import { useFocusStore } from "@/store/useFocusStore";
import { ProjectGrid } from "@/components/ProjectGrid";
import { QuickCollect } from "@/components/QuickCollect";
import { TheFocusRoom } from "@/components/TheFocusRoom";
import { getCompletedTasksCount } from "@/lib/project-utils";
import { Plus, Zap, Target, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  const visibleProjects = useMemo(
    () => projects.filter((project) => project.status !== "DONE"),
    [projects],
  );

  const handleSelectProject = (projectId: string) => {
    router.push(`/focus/${projectId}`);
  };

  const projectStats = useMemo(() => {
    return visibleProjects.reduce(
      (acc, project) => {
        if (project.progress < 100) acc.active += 1;
        if (project.progress >= 100) acc.completed += 1;
        if (project.progress === 0) acc.notStarted += 1;

        if (project.weight >= 8) acc.highPriority += 1;
        else if (project.weight >= 5) acc.mediumPriority += 1;
        else acc.lowPriority += 1;

        acc.totalTasks += (project.tasks ?? []).filter((task) => task.status !== "DONE").length;
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
  }, [visibleProjects]);

  const averageProgress =
    visibleProjects.length > 0
      ? Math.round(projectStats.progressSum / visibleProjects.length)
      : 0;

  const availableFocusTasks = useMemo(() => {
    const activeStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS"];
    return visibleProjects.flatMap((project) =>
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
  }, [visibleProjects]);

  const handleOpenAddTask = () => {
    if (visibleProjects.length === 0) {
      router.push("/focus/new");
      return;
    }
    setSelectedProjectId(visibleProjects[0].id);
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

  const openQuickFocusModal = useCallback(() => {
    if (availableFocusTasks.length === 0) {
      toast.error("Нет активных задач для фокуса");
      return;
    }

    setSelectedFocusTaskId(availableFocusTasks[0].id);
    setShowQuickFocusModal(true);
  }, [availableFocusTasks]);

  const handleQuickFocus = () => {
    openQuickFocusModal();
  };

  useEffect(() => {
    const handler = () => openQuickFocusModal();
    window.addEventListener("quick-focus:open", handler);
    return () => window.removeEventListener("quick-focus:open", handler);
  }, [openQuickFocusModal]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("quickFocus") !== "1") return;
    openQuickFocusModal();
    window.history.replaceState(null, "", "/");
  }, [openQuickFocusModal]);

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
      onClick: () => router.push("/focus/new"),
    },
    {
      id: "quick-collect",
      title: "Быстрый сбор",
      description: "Записать идею или задачу",
      icon: Zap,
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
      onClick: handleOpenAddTask,
    },
    {
      id: "quick-focus",
      title: "Быстрый фокус",
      description: "Начать сессию фокуса",
      icon: Brain,
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

      <div className="mx-auto w-full max-w-[1600px] p-6 md:p-10 xl:p-12 animate-in fade-in duration-300 text-qf-text-primary">
        <header className="mb-12">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl xl:text-4xl font-medium tracking-tight">Обзор дня</h1>
              <p className="text-base text-qf-text-secondary font-medium">
                Ваш прогресс на сегодня
              </p>
            </div>
            <div className="flex flex-wrap gap-3 self-start xl:self-auto shrink-0">
              <div className="stat-box px-5 py-3 rounded-2xl text-center min-w-[96px] shadow-xl">
                <div className="stat-value text-xl text-qf-status-medium-text">{projectStats.active}</div>
                <div className="text-[9px] font-bold text-qf-text-muted tracking-tighter mt-1 font-[var(--font-unbounded)]">Проекты</div>
              </div>
              <div className="stat-box px-5 py-3 rounded-2xl text-center min-w-[96px] shadow-xl">
                <div className="stat-value text-xl text-qf-status-low-text">{projectStats.totalTasks}</div>
                <div className="text-[9px] font-bold text-qf-text-muted tracking-tighter mt-1 font-[var(--font-unbounded)]">Задачи</div>
              </div>
              <div className="stat-box px-5 py-3 rounded-2xl text-center min-w-[96px] shadow-xl">
                <div className="stat-value text-xl text-qf-status-high-text">{averageProgress}%</div>
                <div className="text-[9px] font-bold text-qf-text-muted tracking-tighter mt-1 font-[var(--font-unbounded)]">Прогресс</div>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-12">
          <h3 className="mb-5 text-[10px] tracking-wide text-qf-text-muted font-medium font-[var(--font-unbounded)] opacity-80">
            Горячие действия
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className="card p-5 rounded-2xl flex items-center text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mr-4 text-xl group-hover:bg-qf-status-high-text group-hover:text-[#0A0908] transition-all">
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <div className="text-[14px] font-bold">{action.title}</div>
                  <div className="text-[11px] text-qf-text-muted font-semibold mt-0.5">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] tracking-wide text-qf-text-muted font-medium font-[var(--font-unbounded)]">
              Активные проекты
            </h3>
            <Link
              href="/projects"
              className="text-xs font-medium text-qf-text-accent hover:underline font-[var(--font-unbounded)]"
            >
              Все →
            </Link>
          </div>
          <ProjectGrid projects={visibleProjects} onSelectProject={handleSelectProject} />
        </section>

        <section id="quick-collect" className="mb-12">
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
            <Button
              onClick={() => {
                setShowAddTaskModal(false);
                setNewTaskTitle("");
              }}
              variant="secondary"
              className="w-full"
              disabled={isCreatingTask}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateTask}
              className="w-full"
              disabled={isCreatingTask || !newTaskTitle.trim() || !selectedProjectId}
            >
              {isCreatingTask ? "Создание..." : "Создать"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">Проект</label>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-qf-text-primary focus:outline-none focus:border-qf-border-accent"
            >
              {visibleProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">Название задачи</label>
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
            <Button
              onClick={() => setShowQuickFocusModal(false)}
              variant="secondary"
              className="w-full"
            >
              Отмена
            </Button>
            <Button
              onClick={handleStartQuickFocus}
              className="w-full"
              disabled={!selectedFocusTaskId}
            >
              Начать фокус
            </Button>
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
              <p className="font-medium text-qf-text-primary">{task.title}</p>
              <p className="text-sm text-qf-text-secondary mt-1">{task.projectName}</p>
            </button>
          ))}
        </div>
      </AppModal>
    </>
  );
}
