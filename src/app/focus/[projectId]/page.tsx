"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectHeader } from "@/components/ProjectHeader";
import { TaskBoard } from "@/components/TaskBoard";
import type { ProjectStatus, ProjectWithMeta, Task, TaskStatus, ProjectType } from "@/types/project";
import { TASK_STATUS } from "@/lib/project-utils";
import { AppModal } from "@/components/AppModal";
import { getApiErrorMessage } from "@/lib/api-client";
import { useProjectStore } from "@/store/useProjectStore";

export default function FocusProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { fetchProjects } = useProjectStore();

  const [project, setProject] = useState<ProjectWithMeta | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNote, setNewTaskNote] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [importance, setImportance] = useState(75);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    fetchProjectData();
  }, [projectId]);

  useEffect(() => {
    if (searchParams.get("newTask") === "1") setShowAddTask(true);
    if (searchParams.get("settings") === "1") setShowSettings(true);
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
    const cancelled = tasks.filter((task) => task.status === TASK_STATUS.CANCELLED).length;
    return { todo, inProgress, done, cancelled };
  }, [tasks]);

  const projectWithMeta = useMemo(() => {
    if (!project) return null;
    return { ...project, tasks };
  }, [project, tasks]);

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
          contextSummary: newTaskNote,
          projectId,
          type: "ACTION",
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось добавить задачу");
      }

      toast.success("Задача добавлена");
      setNewTaskTitle("");
      setNewTaskNote("");
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

  const handleRenameTask = async (taskId: string, title: string, contextSummary: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contextSummary }),
      });

      if (!response.ok) {
        throw new Error("Не удалось обновить задачу");
      }

      toast.success("Задача обновлена");
      await fetchProjectData();
    } catch {
      toast.error("Ошибка обновления задачи");
    }
  };

  const handleMoveTask = async (taskId: string, status: TaskStatus, order?: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, order }),
      });

      if (!response.ok) {
        throw new Error("Не удалось обновить статус задачи");
      }
      setTasks((prev) =>
        prev.map((task) => (
          task.id === taskId
            ? { ...task, status, order: order ?? task.order }
            : task
        )),
      );
      if (order === undefined) {
        await fetchProjectData();
      }
    } catch {
      toast.error("Ошибка перемещения задачи");
    }
  };

  const handleUpdateTaskTimer = async (taskId: string, ms: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timerLog: String(ms) }),
      });
      if (!response.ok) {
        throw new Error("Не удалось обновить время задачи");
      }
      const updatedTask = (await response.json()) as Task;
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, timerLog: updatedTask.timerLog } : task)));
    } catch {
      toast.error("Ошибка обновления времени");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить задачу");
      }

      toast.success("Задача удалена");
      await fetchProjectData();
    } catch {
      toast.error("Ошибка удаления задачи");
    }
  };

  const handleChangeProjectStatus = async (status: ProjectStatus) => {
    try {
      const payload: Record<string, unknown> = { status };
      if (project?.status === "ACTIVE" && status !== "ACTIVE") {
        payload.lastSessionNote = "Смена статуса без заметки";
      }
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as unknown;
        throw new Error(getApiErrorMessage(payload) || "Не удалось обновить статус проекта");
      }
      const updated = (await response.json()) as ProjectWithMeta;
      setProject((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка обновления статуса проекта");
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
          description: project.description || null,
          weight: Math.round(importance / 10),
          friction: project.friction || 5,
          deadline: project.deadline ? new Date(project.deadline).toISOString() : null,
          status: project.status,
          type: project.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось сохранить настройки");
      }

      toast.success("Настройки сохранены");
      setShowSettings(false);
      await fetchProjectData();
      // Update global project list for FocusPage grouping changes
      await fetchProjects();
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
        key={project.id}
        project={projectWithMeta!}
        onBack={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
          }
          router.push("/projects");
        }}
        onOpenSettings={() => setShowSettings(true)}
        onChangeStatus={handleChangeProjectStatus}
      />

      <TaskBoard
        tasks={tasks}
        newTaskTitle={newTaskTitle}
        newTaskNote={newTaskNote}
        showAddTask={showAddTask}
        isCreatingTask={isCreatingTask}
        onNewTaskTitleChange={setNewTaskTitle}
        onNewTaskNoteChange={setNewTaskNote}
        onToggleAddTask={() => setShowAddTask((prev) => !prev)}
        onAddTask={handleAddTask}
        onStartTask={handleStartTask}
        onRenameTask={handleRenameTask}
        onMoveTask={handleMoveTask}
        onDeleteTask={handleDeleteTask}
        onUpdateTaskTimer={handleUpdateTaskTimer}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-4">
          <div className="text-2xl font-bold">{taskStats.todo}</div>
          <div className="text-xs tracking-wide text-qf-text-muted">К выполнению</div>
        </div>
        <div className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-4">
          <div className="text-2xl font-bold">{taskStats.inProgress}</div>
          <div className="text-xs tracking-wide text-qf-text-muted">В процессе</div>
        </div>
        <div className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-4">
          <div className="text-2xl font-bold">{taskStats.done}</div>
          <div className="text-xs tracking-wide text-qf-text-muted">Готово</div>
        </div>
        <div className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-4">
          <div className="text-2xl font-bold">{taskStats.cancelled}</div>
          <div className="text-xs tracking-wide text-qf-text-muted">Отменено</div>
        </div>
      </div>

      <AppModal
        open={showSettings}
        title="Настройки проекта"
        onClose={() => setShowSettings(false)}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setShowSettings(false)}
              variant="secondary"
              className="w-full"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="w-full"
            >
              Сохранить
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">Название</label>
            <Input
              value={project.name}
              onChange={(event) => setProject({ ...project, name: event.target.value })}
              className="bg-qf-bg-secondary border-qf-border-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">Описание</label>
            <textarea
              value={project.description || ""}
              onChange={(event) => setProject({ ...project, description: event.target.value })}
              rows={4}
              placeholder="Краткое описание проекта..."
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-qf-text-primary placeholder:text-qf-text-muted focus:outline-none focus:border-qf-border-accent resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">Дедлайн</label>
            <DatePicker
              value={project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : ""}
              onChange={(next) =>
                setProject({
                  ...project,
                  deadline: next ? new Date(`${next}T00:00:00.000Z`).toISOString() : undefined,
                })
              }
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs tracking-wide text-qf-text-muted">Важность</label>
              <span className="text-sm text-qf-text-secondary">{importance}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={importance}
              onChange={(event) => setImportance(Number(event.target.value))}
              className="w-full accent-[#ffc300]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">Статус проекта</label>
            <select
              value={project.status}
              onChange={(event) =>
                setProject({ ...project, status: event.target.value as ProjectStatus })
              }
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-qf-text-primary focus:outline-none focus:border-qf-border-accent"
            >
              <option value="INCUBATOR">Инкубатор</option>
              <option value="ACTIVE">В работе</option>
              <option value="SNOOZED">На паузе</option>
              <option value="FINAL_STRETCH">Финальный рывок</option>
              <option value="DONE">Готово</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">Тип проекта</label>
            <select
              value={project.type || "NORMAL"}
              onChange={(event) =>
                setProject({ ...project, type: event.target.value as ProjectType })
              }
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-qf-text-primary focus:outline-none focus:border-qf-border-accent"
            >
              <option value="NORMAL">Обычный</option>
              <option value="MANDATORY">Обязательный</option>
            </select>
            <p className="text-xs text-qf-text-muted">
              Обязательные проекты показываются первыми и должны быть выполнены, чтобы разблокировать доступ к обычным проектам.
            </p>
          </div>
        </div>
      </AppModal>
    </section>
  );
}
