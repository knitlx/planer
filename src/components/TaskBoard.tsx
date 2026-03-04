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
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import type { Task, TaskStatus } from "@/types/project";
import { TASK_STATUS } from "@/lib/project-utils";
import { quantumGlass } from "@/lib/quantum-theme";
import { formatDurationHms, parseDurationMs } from "@/lib/utils";
import { Pencil, Play, Plus, Trash2, X } from "lucide-react";

interface TaskBoardProps {
  tasks: Task[];
  newTaskTitle: string;
  newTaskNote: string;
  showAddTask: boolean;
  isCreatingTask: boolean;
  onNewTaskTitleChange: (value: string) => void;
  onNewTaskNoteChange: (value: string) => void;
  onToggleAddTask: () => void;
  onAddTask: () => void;
  onStartTask: (taskId: string) => void;
  onRenameTask: (taskId: string, title: string, contextSummary: string) => Promise<void>;
  onMoveTask: (taskId: string, status: TaskStatus, order?: number) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TaskBoard({
  tasks,
  newTaskTitle,
  newTaskNote,
  showAddTask,
  isCreatingTask,
  onNewTaskTitleChange,
  onNewTaskNoteChange,
  onToggleAddTask,
  onAddTask,
  onStartTask,
  onRenameTask,
  onMoveTask,
  onDeleteTask,
}: TaskBoardProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingNote, setEditingNote] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isEditInteractive, setIsEditInteractive] = useState(true);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const columns = useMemo(() => {
    const sortByOrder = (a: Task, b: Task) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return String(a.id).localeCompare(String(b.id));
    };
    return {
      todo: tasks.filter((task) => task.status === TASK_STATUS.TODO).sort(sortByOrder),
      inProgress: tasks.filter((task) => task.status === TASK_STATUS.IN_PROGRESS).sort(sortByOrder),
      done: tasks.filter((task) => task.status === TASK_STATUS.DONE).sort(sortByOrder),
      cancelled: tasks.filter((task) => task.status === TASK_STATUS.CANCELLED).sort(sortByOrder),
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
      setEditingNote(task.contextSummary || "");
      setTimeout(() => setIsEditInteractive(true), 150);
    }, 0);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTitle("");
    setEditingNote("");
    setIsSavingEdit(false);
    setIsEditInteractive(true);
  };

  const saveTaskTitle = async () => {
    if (!editingTaskId) return;
    const nextTitle = editingTitle.trim();
    const nextNote = editingNote.trim();
    if (!nextTitle) return;
    const currentTask = taskById.get(editingTaskId);
    if (
      currentTask &&
      currentTask.title.trim() === nextTitle &&
      (currentTask.contextSummary || "").trim() === nextNote
    ) {
      cancelEditTask();
      return;
    }

    try {
      setIsSavingEdit(true);
      await onRenameTask(editingTaskId, nextTitle, nextNote);
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
    if (!targetStatus) return;

    const getColumnTasks = (status: TaskStatus): Task[] => {
      if (status === TASK_STATUS.TODO) return columns.todo;
      if (status === TASK_STATUS.IN_PROGRESS) return columns.inProgress;
      if (status === TASK_STATUS.DONE) return columns.done;
      return columns.cancelled;
    };

    const sourceColumn = getColumnTasks(sourceTask.status);
    const sourceIndex = sourceColumn.findIndex((task) => task.id === taskId);
    if (sourceIndex < 0) return;

    if (sourceTask.status === targetStatus) {
      const overTaskId = overId.startsWith("task-") ? overId.replace("task-", "") : null;
      const targetIndex = overTaskId
        ? sourceColumn.findIndex((task) => task.id === overTaskId)
        : sourceColumn.length - 1;
      if (targetIndex < 0 || targetIndex === sourceIndex) return;

      const reordered = arrayMove(sourceColumn, sourceIndex, targetIndex);
      for (let index = 0; index < reordered.length; index += 1) {
        const task = reordered[index];
        const currentOrder = task.order ?? 0;
        if (currentOrder !== index) {
          await onMoveTask(task.id, task.status, index);
        }
      }
      return;
    }

    const sourceWithoutActive = sourceColumn.filter((task) => task.id !== taskId);
    const targetColumn = getColumnTasks(targetStatus);
    const overTaskId = overId.startsWith("task-") ? overId.replace("task-", "") : null;
    const targetInsertIndex = overTaskId
      ? targetColumn.findIndex((task) => task.id === overTaskId)
      : targetColumn.length;
    const normalizedInsertIndex = targetInsertIndex < 0 ? targetColumn.length : targetInsertIndex;
    const targetWithActive = [...targetColumn];
    targetWithActive.splice(normalizedInsertIndex, 0, { ...sourceTask, status: targetStatus });

    for (let index = 0; index < sourceWithoutActive.length; index += 1) {
      const task = sourceWithoutActive[index];
      const currentOrder = task.order ?? 0;
      if (currentOrder !== index) {
        await onMoveTask(task.id, task.status, index);
      }
    }

    for (let index = 0; index < targetWithActive.length; index += 1) {
      const task = targetWithActive[index];
      const currentOrder = task.order ?? 0;
      if (task.id === taskId || task.status !== targetStatus || currentOrder !== index) {
        await onMoveTask(task.id, targetStatus, index);
      }
    }
  };

  const primaryCards = [
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
          <h2 className="text-lg font-semibold">Доска задач</h2>
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
            <input
              value={newTaskNote}
              onChange={(event) => onNewTaskNoteChange(event.target.value)}
              placeholder="Заметка к задаче (опционально)..."
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
          {primaryCards.map((column) => (
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
                      const completed = task.status === TASK_STATUS.DONE || task.status === TASK_STATUS.CANCELLED;
                      const isEditing = editingTaskId === task.id;
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          status={task.status}
                          completed={completed}
                          isEditing={isEditing}
                          editingTitle={editingTitle}
                          editingNote={editingNote}
                          isSavingEdit={isSavingEdit}
                          isEditInteractive={isEditInteractive}
                          canSaveEdit={
                            editingTitle.trim().length > 0 &&
                            (
                              editingTitle.trim() !== task.title.trim() ||
                              editingNote.trim() !== (task.contextSummary || "").trim()
                            )
                          }
                          onEditStart={() => startEditTask(task)}
                          onEditCancel={cancelEditTask}
                          onEditTitleChange={setEditingTitle}
                          onEditNoteChange={setEditingNote}
                          onEditSave={() => void saveTaskTitle()}
                          onFocus={() => onStartTask(task.id)}
                          onMove={(status) => onMoveTask(task.id, status)}
                          onDelete={() => onDeleteTask(task.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </SortableContext>
            </BoardColumn>
          ))}
        </div>
        <div className="mt-4">
          <BoardColumn
            id={`column-${TASK_STATUS.CANCELLED}`}
            title="Отменено"
            accent="bg-slate-500"
            count={columns.cancelled.length}
          >
            <SortableContext
              items={columns.cancelled.map((task) => `task-${task.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {columns.cancelled.length === 0 ? (
                <div className="h-[120px] rounded-xl border border-dashed border-qf-border-secondary bg-qf-bg-secondary/40 flex items-center justify-center text-sm text-qf-text-muted">
                  Пусто
                </div>
              ) : (
                <div className="space-y-3">
                  {columns.cancelled.map((task) => {
                    const completed = true;
                    const isEditing = editingTaskId === task.id;
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        status={task.status}
                        completed={completed}
                        isEditing={isEditing}
                        editingTitle={editingTitle}
                        editingNote={editingNote}
                        isSavingEdit={isSavingEdit}
                        isEditInteractive={isEditInteractive}
                        canSaveEdit={
                          editingTitle.trim().length > 0 &&
                          (
                            editingTitle.trim() !== task.title.trim() ||
                            editingNote.trim() !== (task.contextSummary || "").trim()
                          )
                        }
                        onEditStart={() => startEditTask(task)}
                        onEditCancel={cancelEditTask}
                        onEditTitleChange={setEditingTitle}
                        onEditNoteChange={setEditingNote}
                        onEditSave={() => void saveTaskTitle()}
                        onFocus={() => onStartTask(task.id)}
                        onMove={(status) => onMoveTask(task.id, status)}
                        onDelete={() => onDeleteTask(task.id)}
                      />
                    );
                  })}
                </div>
              )}
            </SortableContext>
          </BoardColumn>
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
  editingNote,
  isSavingEdit,
  isEditInteractive,
  canSaveEdit,
  onEditStart,
  onEditCancel,
  onEditTitleChange,
  onEditNoteChange,
  onEditSave,
  onFocus,
  onMove,
  onDelete,
}: {
  task: Task;
  status: TaskStatus;
  completed: boolean;
  isEditing: boolean;
  editingTitle: string;
  editingNote: string;
  isSavingEdit: boolean;
  isEditInteractive: boolean;
  canSaveEdit: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditTitleChange: (title: string) => void;
  onEditNoteChange: (note: string) => void;
  onEditSave: () => void;
  onFocus: () => void;
  onMove: (status: TaskStatus) => void;
  onDelete: () => void;
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
          <textarea
            value={editingNote}
            onChange={(event) => onEditNoteChange(event.target.value)}
            onPointerDown={stopPointer}
            onClick={stopClick}
            rows={3}
            placeholder="Заметка к задаче..."
            className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-qf-border-accent resize-none"
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
          {task.contextSummary ? (
            <p className="mt-1 text-xs text-qf-text-secondary whitespace-pre-wrap">{task.contextSummary}</p>
          ) : null}
          <p className="mt-1 text-xs text-qf-text-muted">
            Время: {formatDurationHms(parseDurationMs(task.timerLog))}
          </p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <select
              value={status}
              aria-label="Статус задачи"
              onPointerDown={stopPointer}
              onClick={stopClick}
              onChange={(event) => {
                const nextStatus = event.target.value as TaskStatus;
                if (nextStatus !== status) {
                  onMove(nextStatus);
                }
              }}
              className="h-7 rounded-md border border-qf-border-secondary bg-qf-bg-secondary px-2 text-xs text-qf-text-secondary focus:outline-none focus:border-qf-border-accent"
            >
              <option value={TASK_STATUS.TODO}>К выполнению</option>
              <option value={TASK_STATUS.IN_PROGRESS}>В процессе</option>
              <option value={TASK_STATUS.DONE}>Готово</option>
              <option value={TASK_STATUS.CANCELLED}>Отменено</option>
            </select>
            {status !== TASK_STATUS.DONE && status !== TASK_STATUS.CANCELLED && (
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
            <button
              onPointerDown={stopPointer}
              onClick={(event) => {
                stopClick(event);
                onDelete();
              }}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-red-400/40 text-red-300 hover:text-white hover:border-red-300 transition-colors text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Удалить
            </button>
          </div>
        </>
      )}
    </div>
  );
}
