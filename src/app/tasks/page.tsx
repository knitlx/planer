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
        className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
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
        className: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      };
    }
    return {
      label: "К выполнению",
      icon: Circle,
      className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
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
                <div className="mt-3 pt-3 border-t border-qf-border-secondary flex justify-end">
                  <button
                    onClick={() => setTaskToDelete(task)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors"
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
    </section>
  );
}
