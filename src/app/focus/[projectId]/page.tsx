"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ProjectHeader } from "@/components/ProjectHeader";
import { TaskBoard } from "@/components/TaskBoard";
import type { ProjectWithMeta, Task } from "@/types/project";
import { TASK_STATUS } from "@/lib/project-utils";
import { AppModal } from "@/components/AppModal";

export default function FocusProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectWithMeta | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [importance, setImportance] = useState(75);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    fetchProjectData();
  }, [projectId]);

  useEffect(() => {
    if (searchParams.get("newTask") === "1") {
      setShowAddTask(true);
    }
  }, [searchParams]);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Не удалось загрузить проект");
      }
      const data = (await response.json()) as ProjectWithMeta;
      setProject(data);
      setTasks(data.tasks || []);
      setImportance((data.weight || 5) * 10);
    } catch {
      toast.error("Ошибка загрузки проекта");
    } finally {
      setIsLoading(false);
    }
  };

  const taskStats = useMemo(() => {
    const todo = tasks.filter((task) => task.status === TASK_STATUS.TODO).length;
    const inProgress = tasks.filter(
      (task) => task.status === TASK_STATUS.IN_PROGRESS,
    ).length;
    const done = tasks.filter((task) => task.status === TASK_STATUS.DONE).length;
    return { todo, inProgress, done };
  }, [tasks]);

  const handleStartTask = (taskId: string) => {
    router.push(`/focus/${projectId}/room?taskId=${taskId}`);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      setIsCreatingTask(true);
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          projectId,
          type: "ACTION",
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось добавить задачу");
      }

      toast.success("Задача добавлена");
      setNewTaskTitle("");
      setShowAddTask(false);
      await fetchProjectData();
    } catch {
      toast.error("Ошибка добавления задачи");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Не удалось завершить задачу");
      }

      toast.success("Задача завершена");
      await fetchProjectData();
    } catch {
      toast.error("Ошибка завершения задачи");
    }
  };

  const handleSaveSettings = async () => {
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project.name,
          weight: Math.round(importance / 10),
          friction: project.friction || 5,
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось сохранить настройки");
      }

      toast.success("Настройки сохранены");
      setShowSettings(false);
      await fetchProjectData();
    } catch {
      toast.error("Ошибка сохранения настроек");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-qf-text-secondary">Загрузка...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-qf-text-secondary">Проект не найден</div>
      </div>
    );
  }

  return (
    <section className="p-6 md:p-12 animate-in fade-in duration-300 space-y-8">
      <ProjectHeader
        project={{ ...project, tasks }}
        onBack={() => router.push("/")}
        onOpenSettings={() => setShowSettings(true)}
      />

      <TaskBoard
        tasks={tasks}
        newTaskTitle={newTaskTitle}
        showAddTask={showAddTask}
        isCreatingTask={isCreatingTask}
        onNewTaskTitleChange={setNewTaskTitle}
        onToggleAddTask={() => setShowAddTask((prev) => !prev)}
        onAddTask={handleAddTask}
        onCompleteTask={handleCompleteTask}
        onStartTask={handleStartTask}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-4">
          <div className="text-2xl font-bold">{taskStats.todo}</div>
          <div className="text-xs uppercase tracking-wider text-qf-text-muted">К выполнению</div>
        </div>
        <div className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-4">
          <div className="text-2xl font-bold">{taskStats.inProgress}</div>
          <div className="text-xs uppercase tracking-wider text-qf-text-muted">В процессе</div>
        </div>
        <div className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-4">
          <div className="text-2xl font-bold">{taskStats.done}</div>
          <div className="text-xs uppercase tracking-wider text-qf-text-muted">Готово</div>
        </div>
      </div>

      <AppModal
        open={showSettings}
        title="Настройки проекта"
        onClose={() => setShowSettings(false)}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded-lg bg-qf-gradient-primary text-white hover:opacity-90 transition-opacity"
            >
              Сохранить
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">Название</label>
            <Input
              value={project.name}
              onChange={(event) => setProject({ ...project, name: event.target.value })}
              className="bg-qf-bg-secondary border-qf-border-primary"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-qf-text-muted">Важность</label>
              <span className="text-sm text-qf-text-secondary">{importance}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={importance}
              onChange={(event) => setImportance(Number(event.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
        </div>
      </AppModal>
    </section>
  );
}
