"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

export function QuickCollect() {
  const [isInputVisible, setInputVisible] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useHotkeys("ctrl+i, cmd+i", () => setInputVisible(true));

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
        toast.success("💭 Мысль сохранена в инкубатор");
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
    <>
      <AnimatePresence>
        {isInputVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Card className="p-4 shadow-2xl w-96">
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Quick capture thought..."
                autoFocus
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  onClick={() => setInputVisible(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !content.trim()}
                >
                  {isSubmitting ? "Saving..." : "Capture"}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isInputVisible && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setInputVisible(true)}
          className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-2xl"
        >
          <PlusIcon className="w-6 h-6" />
        </motion.button>
      )}
    </>
  );
}
