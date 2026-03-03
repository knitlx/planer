"use client";

import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6 card">
      <div className="w-16 h-16 rounded-2xl bg-qf-gradient-subtle border border-qf-border-primary flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">
        Готовы сфокусироваться?
      </h2>
      <p className="text-text-secondary max-w-md mb-6">
        Проекты - это место, где живёт ваша работа. Создайте свой первый проект,
        чтобы начать отслеживать задачи и развивать концентрацию.
      </p>
      <Button className="bg-qf-gradient-primary text-white font-medium hover:opacity-90">
        + Создать проект
      </Button>
    </div>
  );
}
