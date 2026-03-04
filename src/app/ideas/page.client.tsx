"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { AppModal } from "@/components/AppModal";
import { getApiErrorMessage } from "@/lib/api-client";

interface Idea {
  id: string;
  content: string;
  source: string;
  processed: boolean;
  status: IdeaStatus;
  convertedEntityType?: "TASK" | "PROJECT" | null;
  convertedEntityId?: string | null;
  projectId?: string | null;
  createdAt: string;
}

type IdeaStatus = "INBOX" | "CONVERTED_TO_TASK" | "CONVERTED_TO_PROJECT" | "ARCHIVED";
type IdeaStatusFilter = "ALL" | IdeaStatus;

interface ProjectOption {
  id: string;
  name: string;
}

type ConversionMode = "task" | "project" | null;
const statusFilters: Array<{ value: IdeaStatusFilter; label: string }> = [
  { value: "INBOX", label: "Входящие" },
  { value: "CONVERTED_TO_TASK", label: "В задачи" },
  { value: "CONVERTED_TO_PROJECT", label: "В проекты" },
  { value: "ARCHIVED", label: "Архив" },
  { value: "ALL", label: "Все" },
];

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [statusFilter, setStatusFilter] = useState<IdeaStatusFilter>("INBOX");
  const [isLoading, setIsLoading] = useState(true);
  const [activeIdea, setActiveIdea] = useState<Idea | null>(null);
  const [mode, setMode] = useState<ConversionMode>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [seedTaskTitle, setSeedTaskTitle] = useState("");
  const [projectWeight, setProjectWeight] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<Idea | null>(null);
  const [isDeletingIdea, setIsDeletingIdea] = useState(false);
  const [isArchivingIdea, setIsArchivingIdea] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchIdeas(statusFilter);
  }, [statusFilter]);

  const fetchIdeas = async (status: IdeaStatusFilter) => {
    try {
      const res = await fetch(`/api/ideas?status=${status}`);
      const data = await res.json();
      setIdeas(data);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = (await res.json()) as ProjectOption[];
      setProjects(data);
    } catch (error) {
      toast.error("Не удалось загрузить проекты");
    }
  };

  const openTaskConversion = (idea: Idea) => {
    if (projects.length === 0) {
      toast.error("Сначала создайте проект");
      return;
    }
    setActiveIdea(idea);
    setMode("task");
    setTaskTitle(idea.content);
    setTaskProjectId(projects[0].id);
  };

  const openProjectConversion = (idea: Idea) => {
    setActiveIdea(idea);
    setMode("project");
    setProjectName("");
    setSeedTaskTitle(idea.content);
    setProjectWeight(5);
  };

  const resetConversionState = () => {
    setActiveIdea(null);
    setMode(null);
    setTaskTitle("");
    setTaskProjectId("");
    setProjectName("");
    setSeedTaskTitle("");
    setProjectWeight(5);
    setIsSubmitting(false);
  };

  const handleProcess = async (
    id: string,
    action: "convert_to_task" | "convert_to_project",
    payload: Record<string, unknown>,
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/ideas/${id}/process`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      if (res.ok) {
        toast.success("Готово");
        await Promise.all([fetchIdeas(statusFilter), fetchProjects()]);
        resetConversionState();
      } else {
        const payload = (await res.json()) as unknown;
        toast.error(getApiErrorMessage(payload) || "Ошибка");
      }
    } catch (error) {
      toast.error("Ошибка");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ideaToDelete) return;
    setIsDeletingIdea(true);
    try {
      const res = await fetch(`/api/ideas/${ideaToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Удалено");
        await fetchIdeas(statusFilter);
        setIdeaToDelete(null);
      } else {
        toast.error("Не удалось удалить идею");
      }
    } catch (error) {
      toast.error("Ошибка");
    } finally {
      setIsDeletingIdea(false);
    }
  };

  const handleArchive = async (ideaId: string) => {
    setIsArchivingIdea(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/process`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });

      if (!res.ok) {
        const payload = (await res.json()) as unknown;
        throw new Error(getApiErrorMessage(payload) || "Не удалось архивировать идею");
      }

      toast.success("Идея отправлена в архив");
      await fetchIdeas(statusFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setIsArchivingIdea(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <div className="h-10 w-24 bg-qf-bg-secondary rounded-xl animate-pulse mb-8" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 card animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Идеи</h1>
          <p className="text-text-secondary mt-2">Записывайте мысли, которые станут задачами</p>
        </header>

        <div className="card p-4 mb-4">
          <h2 className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-300" />
            Идеи
          </h2>
          <div className="flex flex-wrap gap-2 my-4">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  statusFilter === filter.value
                    ? "border-qf-border-accent bg-qf-gradient-subtle text-white"
                    : "border-qf-border-secondary text-qf-text-secondary hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {ideas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">Пока нет идей</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="p-4 bg-qf-bg-secondary/70 rounded-lg border border-qf-border-secondary hover:border-qf-border-accent transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <p className="text-sm text-text-primary flex-1">{idea.content}</p>
                    <button
                      onClick={() => setIdeaToDelete(idea)}
                      className="text-text-muted hover:text-red-400 transition-colors shrink-0"
                      aria-label="Удалить идею"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-muted">
                      {idea.source} • {new Date(idea.createdAt).toLocaleDateString("ru")}
                    </span>
                    {idea.status === "INBOX" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => openTaskConversion(idea)}
                        >
                          Задача
                        </Button>
                        <Button
                          size="sm"
                          className="bg-qf-gradient-primary text-white text-xs h-7 hover:opacity-90"
                          onClick={() => openProjectConversion(idea)}
                        >
                          Проект <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          disabled={isArchivingIdea}
                          onClick={() => handleArchive(idea.id)}
                        >
                          Архив
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-qf-text-secondary">
                        {idea.status === "CONVERTED_TO_TASK" && idea.projectId && (
                          <Link href={`/focus/${idea.projectId}`} className="hover:text-white transition-colors">
                            Открыть проект
                          </Link>
                        )}
                        {idea.status === "CONVERTED_TO_PROJECT" && idea.convertedEntityId && (
                          <Link href={`/focus/${idea.convertedEntityId}`} className="hover:text-white transition-colors">
                            Открыть проект
                          </Link>
                        )}
                        {idea.status === "ARCHIVED" && "В архиве"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 card">
          <p className="text-xs text-text-muted">
            <kbd className="px-2 py-1 bg-qf-bg-secondary rounded text-xs border border-qf-border-secondary">Ctrl/⌘K</kbd>{" "}
            чтобы добавить мысль
          </p>
        </div>
      </div>

      <AppModal
        open={Boolean(activeIdea && mode === "task")}
        title="Преобразовать в задачу"
        description={activeIdea?.content}
        onClose={resetConversionState}
        disableClose={isSubmitting}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={resetConversionState}
              className="px-4 py-2 rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              onClick={() =>
                activeIdea &&
                handleProcess(activeIdea.id, "convert_to_task", {
                  targetProjectId: taskProjectId,
                  title: taskTitle,
                })
              }
              className="px-4 py-2 rounded-lg bg-qf-gradient-primary text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              disabled={isSubmitting || !taskProjectId || !taskTitle.trim()}
            >
              {isSubmitting ? "Сохранение..." : "Создать задачу"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">Проект</label>
            <select
              value={taskProjectId}
              onChange={(event) => setTaskProjectId(event.target.value)}
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-white focus:outline-none focus:border-qf-border-accent"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">Название задачи</label>
            <Input
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              className="bg-qf-bg-secondary border-qf-border-primary"
            />
          </div>
        </div>
      </AppModal>

      <AppModal
        open={Boolean(activeIdea && mode === "project")}
        title="Преобразовать в проект"
        description={activeIdea?.content}
        onClose={resetConversionState}
        disableClose={isSubmitting}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={resetConversionState}
              className="px-4 py-2 rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              onClick={() =>
                activeIdea &&
                handleProcess(activeIdea.id, "convert_to_project", {
                  projectName,
                  title: seedTaskTitle,
                  weight: projectWeight,
                })
              }
              className="px-4 py-2 rounded-lg bg-qf-gradient-primary text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              disabled={isSubmitting || !projectName.trim()}
            >
              {isSubmitting ? "Сохранение..." : "Создать проект"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">Название проекта</label>
            <Input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="bg-qf-bg-secondary border-qf-border-primary"
              placeholder="Введите название проекта"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">Первая задача (опционально)</label>
            <Input
              value={seedTaskTitle}
              onChange={(event) => setSeedTaskTitle(event.target.value)}
              className="bg-qf-bg-secondary border-qf-border-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-qf-text-muted">Важность: {projectWeight}/10</label>
            <input
              type="range"
              min={1}
              max={10}
              value={projectWeight}
              onChange={(event) => setProjectWeight(Number(event.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
        </div>
      </AppModal>

      <ConfirmActionModal
        open={Boolean(ideaToDelete)}
        title="Удалить идею?"
        description={ideaToDelete ? `Идея "${ideaToDelete.content}" будет удалена безвозвратно.` : ""}
        confirmText="Удалить"
        isLoading={isDeletingIdea}
        onCancel={() => setIdeaToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

