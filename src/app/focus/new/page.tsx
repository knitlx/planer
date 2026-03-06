"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { quantumGradientClasses } from "@/lib/quantum-theme";
import type { ProjectStatus, ProjectType } from "@/types/project";

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
  const [type, setType] = useState<ProjectType>("NORMAL");
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
          type,
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
            <label className="text-xs tracking-wide text-qf-text-muted">
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
              <label className="text-xs tracking-wide text-qf-text-muted">
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
              className="w-full accent-[#ffc300]"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Краткое описание проекта (опционально)"
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-qf-text-primary placeholder:text-qf-text-muted focus:outline-none focus:border-qf-border-accent resize-none"
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">
              Дедлайн
            </label>
            <DatePicker
              value={deadline}
              onChange={setDeadline}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">
              Статус проекта
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-qf-text-primary focus:outline-none focus:border-qf-border-accent"
              disabled={isSubmitting}
            >
              <option value="ACTIVE">В работе</option>
              <option value="SNOOZED">На паузе</option>
              <option value="FINAL_STRETCH">Финальный рывок</option>
              <option value="INCUBATOR">Инкубатор</option>
              <option value="DONE">Готово</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs tracking-wide text-qf-text-muted">
              Тип проекта
            </label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as ProjectType)}
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-qf-text-primary focus:outline-none focus:border-qf-border-accent"
              disabled={isSubmitting}
            >
              <option value="NORMAL">Обычный</option>
              <option value="MANDATORY">Обязательный</option>
            </select>
            <p className="text-xs text-qf-text-muted">
              Обязательные проекты показываются первыми и должны быть выполнены, чтобы разблокировать доступ к обычным проектам.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="secondary"
              disabled={isSubmitting}
            >
              Назад
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Создание..." : "Создать проект"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
