"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { ProjectGrid } from "@/components/ProjectGrid";
import { quantumGradientClasses } from "@/lib/quantum-theme";

export default function ArchivePageClient() {
  const router = useRouter();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  const archivedProjects = projects.filter((project) => project.status === "DONE");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (isLoading) {
    return (
      <section className="p-6 md:p-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-56 rounded bg-qf-bg-secondary" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
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
            <Archive className="w-6 h-6 text-[#FFC300]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className={`text-3xl md:text-4xl font-bold ${quantumGradientClasses.text}`}>
              Архив проектов
            </h1>
            <p className="text-qf-text-secondary">
              {archivedProjects.length} {archivedProjects.length === 1 ? "проект" : archivedProjects.length < 5 ? "проекта" : "проектов"}
            </p>
          </div>
        </div>
      </header>

      {archivedProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-qf-border-secondary bg-qf-bg-glass p-10 text-center text-qf-text-muted">
          Архив пока пуст
        </div>
      ) : (
        <ProjectGrid
          projects={archivedProjects}
          onSelectProject={(projectId) => router.push(`/focus/${projectId}`)}
        />
      )}
    </section>
  );
}
