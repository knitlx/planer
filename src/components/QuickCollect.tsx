"use client";

import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

export function QuickCollect() {
  const shortcutHintId = "quick-collect-shortcut-hint";
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inboxCount, setInboxCount] = useState(0);

  const focusInput = () => {
    const input = document.getElementById("quick-collect-input");
    input?.focus();
  };

  const fetchInboxCount = async () => {
    try {
      const response = await fetch("/api/ideas?status=INBOX");
      if (!response.ok) return;
      const data = (await response.json()) as Array<unknown>;
      setInboxCount(Array.isArray(data) ? data.length : 0);
    } catch {
      // ignore counter errors, input flow should still work
    }
  };

  useHotkeys("ctrl+k, meta+k", (event) => {
    event.preventDefault();
    focusInput();
  });

  useEffect(() => {
    fetchInboxCount();

    const handler = () => {
      focusInput();
      const block = document.getElementById("quick-collect");
      block?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener("quick-collect:open", handler);
    return () => window.removeEventListener("quick-collect:open", handler);
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, source: "Web" }),
      });

      if (response.ok) {
        toast.success("Мысль сохранена в инкубатор");
        setContent("");
        await fetchInboxCount();
      } else {
        toast.error("Не удалось сохранить мысль");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="compact-input px-6 py-5 rounded-[20px] flex items-center shadow-2xl relative">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <span className="mr-4 text-qf-text-accent text-xl">⚡</span>
      <form
        className="w-full"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <label htmlFor="quick-collect-input" className="sr-only">
          Быстрый ввод идеи
        </label>
        <input
          id="quick-collect-input"
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Быстрый ввод (Enter)..."
          aria-describedby={shortcutHintId}
          className="bg-transparent border-none outline-none w-full text-base font-medium placeholder:text-qf-text-muted text-qf-text-primary"
          disabled={isSubmitting}
        />
      </form>
      <div className="ml-4 text-[10px] font-bold text-qf-text-muted whitespace-nowrap font-[var(--font-unbounded)]">
        {inboxCount} идей
      </div>
      <div id={shortcutHintId} className="sr-only">
        Используйте Ctrl/⌘ + K для быстрого доступа к сбору идей
      </div>
    </div>
  );
}
