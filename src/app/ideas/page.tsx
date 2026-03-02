"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Idea {
  id: string;
  content: string;
  source: string;
  processed: boolean;
  createdAt: string;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const res = await fetch("/api/ideas");
      const data = await res.json();
      setIdeas(data);
    } catch (error) {
      console.error("Error fetching ideas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async (
    id: string,
    action: "convert_to_task" | "convert_to_project",
    projectId?: string,
  ) => {
    try {
      const res = await fetch(`/api/ideas/${id}/process`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetProjectId: projectId }),
      });

      if (res.ok) {
        toast.success("Готово");
        fetchIdeas();
      }
    } catch (error) {
      toast.error("Ошибка");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить?")) return;

    try {
      const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Удалено");
        fetchIdeas();
      }
    } catch (error) {
      toast.error("Ошибка");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <div className="h-10 w-24 bg-white/5 rounded-xl animate-pulse mb-8" />
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
          <p className="text-text-secondary mt-2">
            Записывайте мысли, которые станут задачами
          </p>
        </header>

        <div className="card p-4 mb-4">
          <h2 className="text-sm font-medium text-text-secondary flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            Входящие
          </h2>

          {ideas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">Пока нет идей</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-accent/30 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <p className="text-sm text-text-primary flex-1">
                      {idea.content}
                    </p>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="text-text-muted hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-muted">
                      {idea.source} •{" "}
                      {new Date(idea.createdAt).toLocaleDateString("ru")}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() =>
                          handleProcess(idea.id, "convert_to_task")
                        }
                      >
                        Задача
                      </Button>
                      <Button
                        size="sm"
                        className="bg-accent hover:bg-accent-hover text-black text-xs h-7"
                        onClick={() =>
                          handleProcess(idea.id, "convert_to_project")
                        }
                      >
                        Проект <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 card">
          <p className="text-xs text-text-muted">
            <kbd className="px-2 py-1 bg-white/5 rounded text-xs">⌘K</kbd> чтобы
            добавить мысль
          </p>
        </div>
      </div>
    </div>
  );
}
