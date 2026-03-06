"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, Plus } from "lucide-react";
import { toast } from "sonner";
import { ProjectGrid } from "@/components/ProjectGrid";
import { useProjectStore } from "@/store/useProjectStore";
import { quantumGradientClasses } from "@/lib/quantum-theme";
import type { Project } from "@/types/project";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { getApiErrorMessage } from "@/lib/api-client";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const visibleProjects = projects.filter((project) => project.status !== "DONE");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload) || "Не удалось удалить проект");
      }
      toast.success("Проект удален");
      await fetchProjects();
      setProjectToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка удаления проекта");
    } finally {
      setIsDeletingProject(false);
    }
  };

  if (isLoading) {
    return (
      <section className="p-6 md:p-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-56 rounded bg-qf-bg-secondary" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-56 rounded-2xl bg-qf-bg-secondary" />
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

  return (
    <section className="p-6 md:p-12 space-y-8 animate-in fade-in duration-300">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-qf-bg-secondary border border-qf-border-accent flex items-center justify-center">
            <Folder className="w-6 h-6 text-[#FFC300]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className={`text-3xl md:text-4xl font-bold ${quantumGradientClasses.text}`}>
              Проекты
            </h1>
            <p className="text-qf-text-secondary">
              {visibleProjects.length} {visibleProjects.length === 1 ? "проект" : visibleProjects.length < 5 ? "проекта" : "проектов"}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/focus/new")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-qf-gradient-primary text-[#0A0908] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Создать проект
        </button>
      </header>

      <ProjectGrid
        projects={visibleProjects}
        onSelectProject={(projectId) => router.push(`/focus/${projectId}`)}
        onDeleteProject={setProjectToDelete}
      />

      <ConfirmActionModal
        open={Boolean(projectToDelete)}
        title="Удалить проект?"
        description={
          projectToDelete
            ? `Проект "${projectToDelete.name}" будет удален. Если в нем есть задачи, удаление будет запрещено.`
            : ""
        }
        confirmText="Удалить"
        isLoading={isDeletingProject}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
      />
    </section>
  );
}
