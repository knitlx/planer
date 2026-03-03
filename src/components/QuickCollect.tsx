"use client";

import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function QuickCollect() {
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
    <>
      <div className="quantum-glass p-6">
        <div className="flex items-center justify-between mb-6 gap-3">
          <h3 className="text-xl font-bold gradient-text">БЫСТРЫЙ СБОР ИДЕЙ</h3>
          <div className="text-sm text-dim text-right">
            <span className="text-cyan-400">{inboxCount} необработанных идей</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <input
            id="quick-collect-input"
            type="text"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSubmit();
            }}
            placeholder="Запишите идею, мысль или задачу..."
            className="flex-1 px-4 py-3 rounded-xl bg-gray-900/50 border border-quantum focus:border-cyan-500/50 focus:outline-none transition-colors"
            disabled={isSubmitting}
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-black font-bold hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Сохранение..." : "Сохранить"}
          </button>
        </div>

        <div className="mt-4 text-sm text-dim">
          Используйте ⌘K для быстрого доступа к сбору идей из любого места
        </div>
      </div>

      <button
        onClick={focusInput}
        className="fixed bottom-6 right-4 md:bottom-8 md:right-8 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:scale-110 transition-transform z-40"
        aria-label="QuickCollect"
      >
        <Plus className="w-6 h-6 text-black" strokeWidth={2.5} />
      </button>
    </>
  );
}
