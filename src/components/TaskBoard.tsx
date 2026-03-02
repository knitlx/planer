"use client";

import { useMemo } from "react";
import type { Task } from "@/types/project";
import { TASK_STATUS, isTaskCompleted } from "@/lib/project-utils";
import { quantumGlass } from "@/lib/quantum-theme";
import { CheckCircle2, Play, Plus } from "lucide-react";

interface TaskBoardProps {
  tasks: Task[];
  newTaskTitle: string;
  showAddTask: boolean;
  isCreatingTask: boolean;
  onNewTaskTitleChange: (value: string) => void;
  onToggleAddTask: () => void;
  onAddTask: () => void;
  onCompleteTask: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
}

export function TaskBoard({
  tasks,
  newTaskTitle,
  showAddTask,
  isCreatingTask,
  onNewTaskTitleChange,
  onToggleAddTask,
  onAddTask,
  onCompleteTask,
  onStartTask,
}: TaskBoardProps) {
  const columns = useMemo(() => {
    return {
      todo: tasks.filter((task) => task.status === TASK_STATUS.TODO),
      inProgress: tasks.filter((task) => task.status === TASK_STATUS.IN_PROGRESS),
      done: tasks.filter((task) => isTaskCompleted(task.status)),
    };
  }, [tasks]);

  const cards = [
    { id: "todo", title: "К выполнению", tasks: columns.todo, accent: "bg-blue-500" },
    {
      id: "in-progress",
      title: "В процессе",
      tasks: columns.inProgress,
      accent: "bg-cyan-500",
    },
    { id: "done", title: "Готово", tasks: columns.done, accent: "bg-purple-500" },
  ] as const;

  return (
    <section className="space-y-6">
      <div className={`${quantumGlass.base} rounded-2xl border p-4 md:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Task Board</h2>
          <button
            onClick={onToggleAddTask}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-qf-gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Добавить задачу
          </button>
        </div>
        {showAddTask && (
          <div className="mt-4 flex flex-col md:flex-row gap-2">
            <input
              value={newTaskTitle}
              onChange={(event) => onNewTaskTitleChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !isCreatingTask) onAddTask();
              }}
              placeholder="Название задачи..."
              className="flex-1 rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-white placeholder:text-qf-text-muted focus:outline-none focus:border-qf-border-accent"
              disabled={isCreatingTask}
            />
            <button
              onClick={onAddTask}
              disabled={isCreatingTask || !newTaskTitle.trim()}
              className="px-4 py-2 rounded-lg border border-qf-border-primary text-sm text-qf-text-secondary hover:text-white hover:border-qf-border-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingTask ? "Добавление..." : "Сохранить"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {cards.map((column) => (
          <div
            key={column.id}
            className={`${quantumGlass.base} rounded-2xl border p-4 min-h-[260px]`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${column.accent}`} />
                <h3 className="font-semibold">{column.title}</h3>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-qf-border-secondary text-qf-text-secondary">
                {column.tasks.length}
              </span>
            </div>

            {column.tasks.length === 0 ? (
              <div className="h-[180px] rounded-xl border border-dashed border-qf-border-secondary bg-qf-bg-secondary/40 flex items-center justify-center text-sm text-qf-text-muted">
                Пусто
              </div>
            ) : (
              <div className="space-y-3">
                {column.tasks.map((task) => {
                  const completed = isTaskCompleted(task.status);
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-qf-border-secondary bg-qf-bg-secondary/50 p-3"
                    >
                      <p
                        className={`text-sm ${completed ? "line-through text-qf-text-muted" : "text-white"}`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        {!completed && (
                          <>
                            <button
                              onClick={() => onCompleteTask(task.id)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Done
                            </button>
                            <button
                              onClick={() => onStartTask(task.id)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-xs"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Focus
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
