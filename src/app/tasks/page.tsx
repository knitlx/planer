"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare, Circle, PlayCircle, CheckCircle2, Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/store/useProjectStore";
import { TASK_STATUS } from "@/lib/project-utils";
import { quantumGradientClasses } from "@/lib/quantum-theme";
import type { Task } from "@/types/project";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { AppModal } from "@/components/AppModal";
import { Input } from "@/components/ui/input";

type TaskWithProject = Task & {
  projectName: string;
  projectId: string;
};

const statusOptions = [
  { key: "ALL", label: "Все" },
  { key: TASK_STATUS.TODO, label: "К выполнению" },
  { key: TASK_STATUS.IN_PROGRESS, label: "В процессе" },
  { key: TASK_STATUS.DONE, label: "Готово" },
  { key: TASK_STATUS.CANCELLED, label: "Отменено" },
] as const;

type StatusFilter = (typeof statusOptions)[number]["key"];

export default function TasksPage() {
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [taskToDelete, setTaskToDelete] = useState<TaskWithProject | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNote, setNewTaskNote] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingNote, setEditingNote] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const allTasks = useMemo<TaskWithProject[]>(() => {
    return projects.flatMap((project) =>
      (project.tasks ?? []).map((task) => ({
        ...task,
        projectName: project.name,
        projectId: project.id,
      })),
    );
  }, [projects]);

  const stats = useMemo(() => {
    return allTasks.reduce(
      (acc, task) => {
        acc.total += 1;
        if (task.status === TASK_STATUS.TODO) acc.todo += 1;
        if (task.status === TASK_STATUS.IN_PROGRESS) acc.inProgress += 1;
        if (task.status === TASK_STATUS.DONE) acc.done += 1;
        if (task.status === TASK_STATUS.CANCELLED) acc.cancelled += 1;
        return acc;
      },
      { total: 0, todo: 0, inProgress: 0, done: 0, cancelled: 0 },
    );
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "ALL") return allTasks;
    return allTasks.filter((task) => task.status === filter);
  }, [allTasks, filter]);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Не удалось удалить задачу");
      toast.success("Задача удалена");
      await fetchProjects();
      setTaskToDelete(null);
    } catch {
      toast.error("Ошибка удаления задачи");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskWithProject["status"]) => {
    setUpdatingTaskId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Не удалось обновить статус");
      await fetchProjects();
    } catch {
      toast.error("Ошибка обновления статуса");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskProjectId) return;
    setIsCreatingTask(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: newTaskProjectId,
          title: newTaskTitle.trim(),
          contextSummary: newTaskNote.trim(),
          type: "ACTION",
        }),
      });
      if (!response.ok) throw new Error("Не удалось создать задачу");
      toast.success("Задача создана");
      setNewTaskTitle("");
      setNewTaskNote("");
      await fetchProjects();
    } catch {
      toast.error("Ошибка создания задачи");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const openEditTask = (task: TaskWithProject) => {
    setEditingTask(task);
    setEditingTitle(task.title);
    setEditingNote(task.contextSummary || "");
  };

  const handleSaveTaskEdit = async () => {
    if (!editingTask || !editingTitle.trim()) return;
    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingTitle.trim(),
          contextSummary: editingNote.trim(),
        }),
      });
      if (!response.ok) throw new Error("Не удалось обновить задачу");
      toast.success("Задача обновлена");
      setEditingTask(null);
      await fetchProjects();
    } catch {
      toast.error("Ошибка обновления задачи");
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (isLoading) {
    return (
      <section className="p-6 md:p-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-56 rounded bg-qf-bg-secondary" />
          <div className="h-24 rounded-2xl bg-qf-bg-secondary" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-20 rounded-xl bg-qf-bg-secondary" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-6 md:p-12">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <h2 className="text-lg font-semibold text-red-300">Ошибка загрузки</h2>
          <p className="mt-2 text-qf-text-secondary">{error}</p>
          <button
            onClick={fetchProjects}
            className="mt-4 rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
          >
            Повторить
          </button>
        </div>
      </section>
    );
  }

  const getStatusBadge = (status: TaskWithProject["status"]) => {
    if (status === TASK_STATUS.DONE) {
      return {
        label: "Готово",
        icon: CheckCircle2,
        className: "bg-cyan-500/20 text-cyan-200 border-cyan-500/30",
      };
    }
    if (status === TASK_STATUS.IN_PROGRESS) {
      return {
        label: "В процессе",
        icon: PlayCircle,
        className: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      };
    }
    if (status === TASK_STATUS.CANCELLED) {
      return {
        label: "Отменено",
        icon: Ban,
        className: "bg-qf-bg-secondary/80 text-qf-text-secondary border-qf-border-secondary",
      };
    }
    return {
      label: "К выполнению",
      icon: Circle,
      className: "bg-qf-gradient-subtle text-cyan-200 border-qf-border-primary",
    };
  };

  return (
    <section className="p-6 md:p-12 space-y-8 animate-in fade-in duration-300">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-qf-gradient-primary flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-3xl md:text-4xl font-bold ${quantumGradientClasses.text}`}>
              Задачи
            </h1>
            <p className="text-qf-text-secondary">Всего: {stats.total}</p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white">Новая задача</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            value={newTaskProjectId}
            onChange={(event) => setNewTaskProjectId(event.target.value)}
            className="rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-white focus:outline-none focus:border-qf-border-accent"
          >
            <option value="">Выберите проект</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <Input
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder="Название задачи"
            className="md:col-span-2 bg-qf-bg-secondary border-qf-border-primary"
          />
          <button
            onClick={() => void handleCreateTask()}
            disabled={isCreatingTask || !newTaskTitle.trim() || !newTaskProjectId}
            className="rounded-lg bg-qf-gradient-primary text-white text-sm px-3 py-2 disabled:opacity-50"
          >
            {isCreatingTask ? "Создание..." : "Добавить"}
          </button>
        </div>
        <Input
          value={newTaskNote}
          onChange={(event) => setNewTaskNote(event.target.value)}
          placeholder="Заметка (опционально)"
          className="bg-qf-bg-secondary border-qf-border-primary"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Все", value: stats.total },
          { label: "К выполнению", value: stats.todo },
          { label: "В процессе", value: stats.inProgress },
          { label: "Готово", value: stats.done },
          { label: "Отменено", value: stats.cancelled },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-3"
          >
            <p className="text-xs text-qf-text-muted">{item.label}</p>
            <p className="text-2xl font-semibold mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              filter === option.key
                ? "border-qf-border-accent bg-qf-gradient-subtle text-white"
                : "border-qf-border-secondary text-qf-text-secondary hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-qf-border-secondary bg-qf-bg-glass p-10 text-center text-qf-text-muted">
          Задач пока нет
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const badge = getStatusBadge(task.status);
            const Icon = badge.icon;
            return (
              <div
                key={task.id}
                className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{task.title}</p>
                    {task.contextSummary ? (
                      <p className="mt-1 text-xs text-qf-text-secondary whitespace-pre-wrap">{task.contextSummary}</p>
                    ) : null}
                    <Link
                      href={`/focus/${task.projectId}`}
                      className="mt-1 inline-block text-sm text-qf-text-secondary hover:text-white transition-colors"
                    >
                      {task.projectName}
                    </Link>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${badge.className}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {badge.label}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-qf-border-secondary flex flex-wrap items-center justify-end gap-2">
                  {task.status !== TASK_STATUS.IN_PROGRESS && (
                    <button
                      disabled={updatingTaskId === task.id}
                      onClick={() => void handleUpdateTaskStatus(task.id, TASK_STATUS.IN_PROGRESS)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
                    >
                      В процессе
                    </button>
                  )}
                  {task.status !== TASK_STATUS.TODO && (
                    <button
                      disabled={updatingTaskId === task.id}
                      onClick={() => void handleUpdateTaskStatus(task.id, TASK_STATUS.TODO)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-qf-border-secondary text-qf-text-secondary hover:text-white transition-colors disabled:opacity-50"
                    >
                      К выполнению
                    </button>
                  )}
                  {task.status !== TASK_STATUS.DONE && task.status !== TASK_STATUS.CANCELLED && (
                    <button
                      disabled={updatingTaskId === task.id}
                      onClick={() => void handleUpdateTaskStatus(task.id, TASK_STATUS.DONE)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                    >
                      Готово
                    </button>
                  )}
                  {task.status !== TASK_STATUS.CANCELLED && (
                    <button
                      disabled={updatingTaskId === task.id}
                      onClick={() => void handleUpdateTaskStatus(task.id, TASK_STATUS.CANCELLED)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-slate-500/30 text-slate-300 hover:bg-slate-500/10 transition-colors disabled:opacity-50"
                    >
                      Отменить
                    </button>
                  )}
                  <button
                    disabled={updatingTaskId === task.id}
                    onClick={() => openEditTask(task)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-qf-border-secondary text-qf-text-secondary hover:text-white transition-colors disabled:opacity-50"
                  >
                    Редактировать
                  </button>
                  <button
                    disabled={updatingTaskId === task.id}
                    onClick={() => setTaskToDelete(task)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmActionModal
        open={Boolean(taskToDelete)}
        title="Удалить задачу?"
        description={taskToDelete ? `Задача "${taskToDelete.title}" будет удалена безвозвратно.` : ""}
        confirmText="Удалить"
        isLoading={isDeletingTask}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
      />

      <AppModal
        open={Boolean(editingTask)}
        title="Редактировать задачу"
        onClose={() => setEditingTask(null)}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setEditingTask(null)}
              className="px-4 py-2 rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={() => void handleSaveTaskEdit()}
              disabled={isSavingEdit || !editingTitle.trim()}
              className="px-4 py-2 rounded-lg bg-qf-gradient-primary text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {isSavingEdit ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            value={editingTitle}
            onChange={(event) => setEditingTitle(event.target.value)}
            className="bg-qf-bg-secondary border-qf-border-primary"
            placeholder="Название задачи"
          />
          <textarea
            value={editingNote}
            onChange={(event) => setEditingNote(event.target.value)}
            rows={4}
            placeholder="Заметка"
            className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-white focus:outline-none focus:border-qf-border-accent resize-none"
          />
        </div>
      </AppModal>
    </section>
  );
}
