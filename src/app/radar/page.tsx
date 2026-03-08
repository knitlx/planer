"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { RadarCard } from "@/components/RadarCard";
import { useRouter } from "next/navigation";

export default function RadarPage() {
  const { projects, fetchProjects, isLoading } = useProjectStore();
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSelectProject = (projectId: string) => {
    router.push(`/focus/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Radar</h1>
          <p className="text-text-secondary mt-1">Обзор всех проектов</p>
        </header>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">Нет проектов</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <RadarCard
                key={project.id}
                project={project}
                onSelect={() => handleSelectProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
