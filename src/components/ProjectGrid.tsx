"use client";

import { useRouter } from "next/navigation";
import { Project } from "@/types/project";
import { getCompletedTasksCount, getPriorityLabel } from "@/lib/project-utils";
import { quantumGlass, quantumGradientClasses, getStatusByProgress, getStatusColor } from "@/lib/quantum-theme";
import { Target, Calendar, ArrowRight } from "lucide-react";

interface ProjectGridProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
}

export function ProjectGrid({ projects, onSelectProject }: ProjectGridProps) {
  const router = useRouter();

  const getPriorityColor = (weight: number) => {
    if (weight >= 8) return "bg-red-500/20 text-red-400";
    if (weight >= 5) return "bg-yellow-500/20 text-yellow-400";
    return "bg-green-500/20 text-green-400";
  };

  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return "Не задано";
    return new Date(dateValue).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  if (projects.length === 0) {
    return (
      <div className={`${quantumGlass.base} rounded-2xl p-12 text-center border border-qf-border-glass`}>
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center">
          <Target className="w-8 h-8 text-qf-text-muted" />
        </div>
        <h3 className="text-xl font-bold mb-3">Нет проектов</h3>
        <p className="text-qf-text-secondary mb-6 max-w-md mx-auto">
          Создайте свой первый проект, чтобы начать работу с Focus Flow
        </p>
        <button
          onClick={() => router.push("/focus/new")}
          className={`${quantumGradientClasses.bg} text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity`}
        >
          Создать проект
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const status = getStatusByProgress(project.progress);
        const statusColor = getStatusColor(status);
        const priorityColor = getPriorityColor(project.weight);
        const completedTasks = getCompletedTasksCount(project.tasks);
        const totalTasks = project.tasks?.length || 0;

        return (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`${quantumGlass.base} rounded-2xl p-6 border border-qf-border-glass cursor-pointer transition-all duration-300 hover:border-qf-border-accent hover:shadow-qf-glow hover:translate-y-[-4px] group`}
          >
            {/* Заголовок и прогресс */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-qf-text-accent transition-colors">
                  {project.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityColor}`}>
                    {getPriorityLabel(project.weight)}
                  </span>
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: statusColor.bg,
                      color: statusColor.text
                    }}
                  >
                    {status === "completed" ? "Завершен" : "В работе"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold mb-1">
                  <span className={quantumGradientClasses.text}>{project.progress}</span>
                </div>
                <div className="text-[10px] text-qf-text-muted uppercase tracking-tighter">%</div>
              </div>
            </div>

            {/* Описание */}
            {project.description && (
              <p className="text-sm text-qf-text-secondary mb-6 line-clamp-2">
                {project.description}
              </p>
            )}

            {/* Прогресс бар */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-qf-text-muted mb-2">
                <span>Прогресс</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-qf-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{totalTasks}</div>
                <div className="text-xs text-qf-text-muted uppercase tracking-wider">Задачи</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{completedTasks}</div>
                <div className="text-xs text-qf-text-muted uppercase tracking-wider">Выполнено</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">
                  {project.deadline ? formatDate(project.deadline) : "—"}
                </div>
                <div className="text-xs text-qf-text-muted uppercase tracking-wider">Дедлайн</div>
              </div>
            </div>

            {/* Футер */}
            <div className="flex items-center justify-between pt-4 border-t border-qf-border-secondary">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-qf-text-muted" />
                <span className="text-xs text-qf-text-muted">
                  {project.createdAt ? formatDate(project.createdAt) : "Недавно"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-qf-text-accent group-hover:gap-3 transition-all">
                <span className="text-sm font-medium">Открыть</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
