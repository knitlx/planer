"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { quantumGradientClasses } from "@/lib/quantum-theme";
import type { ProjectStatus } from "@/types/project";

type CreateProjectResponse = {
  id: string;
};

export default function NewFocusProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(5);
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const projectName = name.trim();
    if (!projectName) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: description.trim() || null,
          weight,
          deadline: deadline ? new Date(`${deadline}T00:00:00.000Z`).toISOString() : null,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось создать проект");
      }

      const createdProject = (await response.json()) as CreateProjectResponse;
      toast.success("Проект создан");
      router.push(`/focus/${createdProject.id}`);
    } catch {
      toast.error("Ошибка создания проекта");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen p-6 md:p-12 flex items-start md:items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl border border-qf-border-glass bg-qf-bg-glass backdrop-blur-lg p-6 md:p-10">
        <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${quantumGradientClasses.text}`}>
          Новый проект
        </h1>
        <p className="text-qf-text-secondary mb-8">
          Создай проект и сразу переходи в фокус-режим.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">
              Название проекта
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Например, Запуск нового лендинга"
              className="bg-qf-bg-secondary border-qf-border-primary"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-qf-text-muted">
                Важность
              </label>
              <span className="text-sm text-qf-text-secondary">{weight}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={weight}
              onChange={(event) => setWeight(Number(event.target.value))}
              className="w-full accent-purple-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Краткое описание проекта (опционально)"
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-white placeholder:text-qf-text-muted focus:outline-none focus:border-qf-border-accent resize-none"
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">
              Дедлайн
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="bg-qf-bg-secondary border-qf-border-primary"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">
              Статус проекта
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-white focus:outline-none focus:border-qf-border-accent"
              disabled={isSubmitting}
            >
              <option value="ACTIVE">В работе</option>
              <option value="SNOOZED">На паузе</option>
              <option value="FINAL_STRETCH">Финальный рывок</option>
              <option value="INCUBATOR">Инкубатор</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              Назад
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 rounded-lg bg-qf-gradient-primary text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {isSubmitting ? "Создание..." : "Создать проект"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
