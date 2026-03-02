"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { quantumGlass, quantumGradientClasses } from "@/lib/quantum-theme";
import { Sparkles, Send, X } from "lucide-react";

export function QuickCollect() {
  const [isInputVisible, setInputVisible] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useHotkeys("ctrl+i, meta+i", () => setInputVisible(true));

  useEffect(() => {
    const handler = () => setInputVisible(true);
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
        setInputVisible(false);
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
    <AnimatePresence>
      {isInputVisible && (
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-4 right-4 left-4 md:left-auto md:right-6 md:bottom-6 z-40"
        >
          <div
            className={`${quantumGlass.base} border border-qf-border-glass rounded-2xl shadow-2xl p-4 md:p-5 w-full md:w-[30rem]`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-qf-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${quantumGradientClasses.text}`}>
                    Quick Collect
                  </p>
                  <p className="text-[11px] text-qf-text-muted">Ctrl/Command + I</p>
                </div>
              </div>
              <button
                onClick={() => setInputVisible(false)}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-lg border border-qf-border-secondary text-qf-text-muted hover:text-white hover:border-qf-border-accent transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              placeholder="Запиши идею, задачу или заметку..."
              className="w-full min-h-28 px-3 py-2.5 bg-qf-bg-secondary border border-qf-border-primary rounded-xl text-white placeholder:text-qf-text-muted focus:outline-none focus:border-qf-border-accent transition-colors resize-none"
              autoFocus
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between gap-2 mt-3">
              <span className="text-[11px] text-qf-text-muted">Enter + Ctrl/Command для сохранения</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInputVisible(false)}
                  disabled={isSubmitting}
                  className="px-3 py-2 text-sm rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white hover:border-qf-border-accent transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !content.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-qf-gradient-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!isInputVisible && (
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setInputVisible(true)}
          className="fixed bottom-6 right-6 z-40 group"
        >
          <span className="absolute inset-0 rounded-2xl blur-xl bg-qf-gradient-primary opacity-35 group-hover:opacity-60 transition-opacity" />
          <span className="relative w-14 h-14 rounded-2xl bg-qf-gradient-primary border border-white/20 flex items-center justify-center shadow-2xl">
            <Sparkles className="w-6 h-6 text-white" />
          </span>
        </motion.button>
      )}

      {isInputVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => !isSubmitting && setInputVisible(false)}
        />
      )}
    </AnimatePresence>
  );
}
