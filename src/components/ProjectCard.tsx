"use client";

import { motion } from "framer-motion";
import type { Project, Task } from "@prisma/client";
import { ChevronRight, Clock } from "lucide-react";

interface ProjectCardProps {
  project: Project & { tasks?: Task[] };
  onSelect: () => void;
}

const getPriorityLabel = (weight: number | null): string => {
  if (weight === null || weight < 33) return "Низкий";
  if (weight < 66) return "Средний";
  return "Высокий";
};

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const progress = project.progress ?? 0;
  const taskCount = project.tasks?.length ?? 0;
  const completedCount =
    project.tasks?.filter((t) => t.status === "DONE").length ?? 0;
  const daysSinceUpdate = project.lastActive
    ? Math.floor(
        (Date.now() - new Date(project.lastActive).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const isComplete = progress >= 100;
  const isHot = progress >= 50 && progress < 100;
  const isStale = daysSinceUpdate > 3 && !isComplete;

  const priorityClass =
    "text-[10px] px-2 py-0.5 rounded font-medium " +
    ((project.weight ?? 0) >= 66
      ? "bg-rose-500/10 text-rose-400"
      : (project.weight ?? 0) >= 33
        ? "bg-amber-500/10 text-amber-400"
        : "bg-text-muted/20 text-text-secondary");

  return (
    <motion.div
      onClick={onSelect}
      className="card card-hover p-4 cursor-pointer relative"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
    >
      {isHot && !isComplete && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-neon" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-3">
          <h3 className="text-sm font-medium text-text-primary line-clamp-2">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={priorityClass}>
              {getPriorityLabel(project.weight)}
            </span>
            {isComplete && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                Завершён
              </span>
            )}
            {isStale && (
              <span className="flex items-center gap-1 text-[10px] text-text-muted">
                <Clock className="w-3 h-3" />
                {daysSinceUpdate}дн
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div
            className={
              "text-2xl font-semibold " +
              (isComplete
                ? "text-emerald-400"
                : isHot
                  ? "text-accent text-glow"
                  : "text-text-primary")
            }
          >
            {progress}
          </div>
          <div className="text-[9px] text-text-muted uppercase">%</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={
              "h-full rounded-full " +
              (isComplete
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : isHot
                  ? "bg-gradient-to-r from-accent to-accent-hover"
                  : "bg-text-muted")
            }
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {completedCount}/{taskCount} задач
        </span>
        <span className="text-xs text-accent flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          Открыть <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}
