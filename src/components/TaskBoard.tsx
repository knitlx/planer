"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import type { Task, TaskStatus } from "@/types/project";
import { TASK_STATUS, isTaskCompleted } from "@/lib/project-utils";
import { quantumGlass } from "@/lib/quantum-theme";
import { CheckCircle2, Pencil, Play, Plus, X } from "lucide-react";

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
  onRenameTask: (taskId: string, title: string) => Promise<void>;
  onMoveTask: (taskId: string, status: TaskStatus) => Promise<void>;
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
  onRenameTask,
  onMoveTask,
}: TaskBoardProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isEditInteractive, setIsEditInteractive] = useState(true);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const columns = useMemo(() => {
    return {
      todo: tasks.filter((task) => task.status === TASK_STATUS.TODO),
      inProgress: tasks.filter((task) => task.status === TASK_STATUS.IN_PROGRESS),
      done: tasks.filter((task) => isTaskCompleted(task.status)),
    };
  }, [tasks]);

  const taskById = useMemo(() => {
    return new Map(tasks.map((task) => [task.id, task]));
  }, [tasks]);

  const startEditTask = (task: Task) => {
    setIsEditInteractive(false);
    setTimeout(() => {
      setEditingTaskId(task.id);
      setEditingTitle(task.title);
      setTimeout(() => setIsEditInteractive(true), 150);
    }, 0);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTitle("");
    setIsSavingEdit(false);
    setIsEditInteractive(true);
  };

  const saveTaskTitle = async () => {
    if (!editingTaskId) return;
    const nextTitle = editingTitle.trim();
    if (!nextTitle) return;
    const currentTask = taskById.get(editingTaskId);
    if (currentTask && currentTask.title.trim() === nextTitle) {
      cancelEditTask();
      return;
    }

    try {
      setIsSavingEdit(true);
      await onRenameTask(editingTaskId, nextTitle);
      cancelEditTask();
    } finally {
      setIsSavingEdit(false);
    }
  };

  const resolveDropStatus = (overId: string): TaskStatus | null => {
    if (overId.startsWith("column-")) {
      return overId.replace("column-", "") as TaskStatus;
    }
    if (overId.startsWith("task-")) {
      const taskId = overId.replace("task-", "");
      return taskById.get(taskId)?.status ?? null;
    }
    return null;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!event.over || !event.active.id || editingTaskId) return;

    const activeId = String(event.active.id);
    const overId = String(event.over.id);
    if (!activeId.startsWith("task-")) return;

    const taskId = activeId.replace("task-", "");
    const sourceTask = taskById.get(taskId);
    if (!sourceTask) return;

    const targetStatus = resolveDropStatus(overId);
    if (!targetStatus || sourceTask.status === targetStatus) return;

    await onMoveTask(taskId, targetStatus);
  };

  const cards = [
    {
      id: "todo",
      status: TASK_STATUS.TODO as TaskStatus,
      title: "К выполнению",
      tasks: columns.todo,
      accent: "bg-blue-500",
    },
    {
      id: "in-progress",
      status: TASK_STATUS.IN_PROGRESS as TaskStatus,
      title: "В процессе",
      tasks: columns.inProgress,
      accent: "bg-cyan-500",
    },
    {
      id: "done",
      status: TASK_STATUS.DONE as TaskStatus,
      title: "Готово",
      tasks: columns.done,
      accent: "bg-purple-500",
    },
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {cards.map((column) => (
            <BoardColumn
              key={column.id}
              id={`column-${column.status}`}
              title={column.title}
              accent={column.accent}
              count={column.tasks.length}
            >
              <SortableContext
                items={column.tasks.map((task) => `task-${task.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {column.tasks.length === 0 ? (
                  <div className="h-[180px] rounded-xl border border-dashed border-qf-border-secondary bg-qf-bg-secondary/40 flex items-center justify-center text-sm text-qf-text-muted">
                    Пусто
                  </div>
                ) : (
                  <div className="space-y-3">
                    {column.tasks.map((task) => {
                      const completed = isTaskCompleted(task.status);
                      const isEditing = editingTaskId === task.id;
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          status={task.status}
                          completed={completed}
                          isEditing={isEditing}
                          editingTitle={editingTitle}
                          isSavingEdit={isSavingEdit}
                          isEditInteractive={isEditInteractive}
                          canSaveEdit={editingTitle.trim().length > 0 && editingTitle.trim() !== task.title.trim()}
                          onEditStart={() => startEditTask(task)}
                          onEditCancel={cancelEditTask}
                          onEditTitleChange={setEditingTitle}
                          onEditSave={() => void saveTaskTitle()}
                          onComplete={() => onCompleteTask(task.id)}
                          onFocus={() => onStartTask(task.id)}
                          onMove={(status) => onMoveTask(task.id, status)}
                        />
                      );
                    })}
                  </div>
                )}
              </SortableContext>
            </BoardColumn>
          ))}
        </div>
      </DndContext>
    </section>
  );
}

function BoardColumn({
  id,
  title,
  accent,
  count,
  children,
}: {
  id: string;
  title: string;
  accent: string;
  count: number;
  children: ReactNode;
}) {
  const droppable = useDroppable({ id });

  return (
    <div
      ref={droppable.setNodeRef}
      id={id}
      className={`${quantumGlass.base} rounded-2xl border p-4 min-h-[260px] ${
        droppable.isOver ? "border-qf-border-accent" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${accent}`} />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-qf-bg-secondary/80 border border-qf-border-secondary text-qf-text-secondary">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function TaskCard({
  task,
  status,
  completed,
  isEditing,
  editingTitle,
  isSavingEdit,
  isEditInteractive,
  canSaveEdit,
  onEditStart,
  onEditCancel,
  onEditTitleChange,
  onEditSave,
  onComplete,
  onFocus,
  onMove,
}: {
  task: Task;
  status: TaskStatus;
  completed: boolean;
  isEditing: boolean;
  editingTitle: string;
  isSavingEdit: boolean;
  isEditInteractive: boolean;
  canSaveEdit: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditTitleChange: (title: string) => void;
  onEditSave: () => void;
  onComplete: () => void;
  onFocus: () => void;
  onMove: (status: TaskStatus) => void;
}) {
  const stopPointer = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };
  const stopClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const sortable = useSortable({
    id: `task-${task.id}`,
    disabled: isEditing || isSavingEdit,
  });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.55 : 1,
  };

  const sortableBindings =
    isEditing || isSavingEdit
      ? {}
      : { ...sortable.attributes, ...sortable.listeners };

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      {...sortableBindings}
      className="rounded-xl border border-qf-border-secondary bg-qf-bg-secondary/50 p-3"
    >
      {isEditing ? (
        <div className="space-y-2">
          <input
            value={editingTitle}
            onChange={(event) => onEditTitleChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onEditSave();
              if (event.key === "Escape") onEditCancel();
            }}
            onPointerDown={stopPointer}
            onClick={stopClick}
            className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-qf-border-accent"
            autoFocus
            disabled={!isEditInteractive || isSavingEdit}
          />
          <div className="flex items-center gap-2">
            <button
              onPointerDown={stopPointer}
              onClick={(event) => {
                stopClick(event);
                onEditSave();
              }}
              disabled={!isEditInteractive || isSavingEdit || !canSaveEdit}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-xs disabled:opacity-60"
            >
              Сохранить
            </button>
            <button
              onPointerDown={stopPointer}
              onClick={(event) => {
                stopClick(event);
                onEditCancel();
              }}
              disabled={!isEditInteractive || isSavingEdit}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-qf-border-secondary text-qf-text-secondary hover:text-white transition-colors text-xs"
            >
              <X className="w-3 h-3" />
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className={`text-sm ${completed ? "line-through text-qf-text-muted" : "text-white"}`}>
            {task.title}
          </p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {status === TASK_STATUS.DONE ? (
              <button
                onPointerDown={stopPointer}
                onClick={(event) => {
                  stopClick(event);
                  onMove(TASK_STATUS.IN_PROGRESS);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-cyan-400/40 text-cyan-200 hover:text-white hover:border-cyan-300 transition-colors text-xs"
              >
                В процессе
              </button>
            ) : (
              <>
                <button
                  onPointerDown={stopPointer}
                  onClick={(event) => {
                    stopClick(event);
                    onComplete();
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Done
                </button>
                <button
                  onPointerDown={stopPointer}
                  onClick={(event) => {
                    stopClick(event);
                    onFocus();
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  Focus
                </button>
                {status === TASK_STATUS.TODO && (
                  <button
                    onPointerDown={stopPointer}
                    onClick={(event) => {
                      stopClick(event);
                      onMove(TASK_STATUS.IN_PROGRESS);
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-cyan-400/40 text-cyan-200 hover:text-white hover:border-cyan-300 transition-colors text-xs"
                  >
                    В процессе
                  </button>
                )}
                {status === TASK_STATUS.IN_PROGRESS && (
                  <button
                    onPointerDown={stopPointer}
                    onClick={(event) => {
                      stopClick(event);
                      onMove(TASK_STATUS.TODO);
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-qf-border-secondary text-qf-text-secondary hover:text-white transition-colors text-xs"
                  >
                    В TODO
                  </button>
                )}
                <button
                  onPointerDown={stopPointer}
                  onClick={(event) => {
                    stopClick(event);
                    onEditStart();
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-qf-border-secondary text-qf-text-secondary hover:text-white transition-colors text-xs"
                  aria-label="Редактировать"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Редактировать
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
