"use client";

import { useRouter } from "next/navigation";
import { Project } from "@/types/project";
import { getPriorityFireIcons } from "@/lib/project-utils";
import { quantumGradientClasses } from "@/lib/quantum-theme";
import { Settings, Target, Trash2 } from "lucide-react";

interface ProjectGridProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onDeleteProject?: (project: Project) => void;
}

export function ProjectGrid({ projects, onSelectProject, onDeleteProject }: ProjectGridProps) {
  const router = useRouter();

  const getStatusBadgeClass = (status: Project["status"]) => {
    if (status === "DONE") {
      return "badge-status border border-qf-border-secondary text-qf-text-secondary bg-transparent";
    }
    if (status === "ACTIVE") {
      return "badge-status bg-[#ffc300]/12 text-[#ffc300] border border-[#ffc300]/35";
    }
    if (status === "FINAL_STRETCH") {
      return "badge-status bg-[#ff5f33]/12 text-[#ff5f33] border border-[#ff5f33]/35";
    }
    if (status === "SNOOZED") {
      return "badge-status bg-[#8d8884]/12 text-[#b7b0ab] border border-[#8d8884]/35";
    }
    return "badge-status bg-[#a2d149]/12 text-[#a2d149] border border-[#a2d149]/35";
  };

  if (projects.length === 0) {
    return (
      <div className="project-card-shell rounded-2xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-qf-gradient-subtle border border-qf-border-secondary flex items-center justify-center">
          <Target className="w-8 h-8 text-qf-text-muted" />
        </div>
        <h2 className="text-xl font-bold mb-3">Нет проектов</h2>
        <p className="text-qf-text-secondary mb-6 max-w-md mx-auto">
          Создайте свой первый проект, чтобы начать работу с Focus Flow
        </p>
        <button
          onClick={() => router.push("/focus/new")}
          className={`${quantumGradientClasses.bg} text-[#0A0908] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
        >
          Создать проект
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const progressLabel =
          project.status === "DONE"
            ? "Готово"
            : project.status === "ACTIVE"
            ? "В работе"
            : project.status === "FINAL_STRETCH"
              ? "Финальный рывок"
              : project.status === "SNOOZED"
                ? "На паузе"
                : "Инкубатор";
        const nextTaskTitle = (project.tasks ?? []).find((task) => task.status !== "DONE")?.title ?? "Продолжить работу";

        return (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectProject(project.id);
              }
            }}
            role="button"
            tabIndex={0}
            className="card p-6 rounded-[24px] flex flex-col justify-between min-h-[190px] text-left w-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qf-border-accent cursor-pointer"
          >
            <div className="mb-4">
              <div className="flex justify-between items-start mb-5">
                <h4 className="text-[18px] font-medium tracking-tight leading-tight line-clamp-2 pr-2 min-h-[2.4em]">{project.name}</h4>
                <div className="text-xs whitespace-nowrap shrink-0 text-[#ffc300]">{getPriorityFireIcons(project.weight)}</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-qf-text-primary font-bold font-[var(--font-unbounded)]">{project.progress}%</span>
                  <span className={getStatusBadgeClass(project.status)}>{progressLabel}</span>
                </div>
                <div className="progress-bar w-full">
                  <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div className="text-[14px] text-qf-text-primary font-semibold leading-snug max-w-[65%] line-clamp-2">
                {project.description?.trim() || nextTaskTitle}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/focus/${project.id}?settings=1`);
                  }}
                  className="w-8 h-8 rounded-xl bg-[#ffc300]/10 border border-[#ffc300]/25 flex items-center justify-center text-qf-text-accent hover:bg-[#ffc300]/15 transition-all"
                  aria-label="Открыть настройки проекта"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {onDeleteProject ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteProject(project);
                    }}
                    className="w-8 h-8 rounded-xl bg-[#ff5f33]/10 border border-[#ff5f33]/30 flex items-center justify-center text-[#ff8d70] hover:bg-[#ff5f33]/15 transition-all"
                    aria-label="Удалить проект"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
