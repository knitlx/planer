"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/useProjectStore";

export function NewProjectButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(50);
  const { createProject } = useProjectStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createProject(name.trim(), weight);
    setName("");
    setWeight(50);
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="bg-accent hover:bg-accent-hover text-black font-medium"
      >
        + Новый проект
      </Button>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card p-5 w-full max-w-sm">
            <h2 className="text-base font-semibold mb-4 text-text-primary">
              Новый проект
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Название
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Название..."
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent focus:border-accent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Важность: {weight}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 border-white/10 text-text-secondary hover:text-text-primary hover:bg-white/5"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!name.trim()}
                  className="flex-1 bg-accent hover:bg-accent-hover text-black font-medium"
                >
                  Создать
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
