"use client";

import { Flame } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { motion } from "framer-motion";

export function StreakCounter() {
  const { projects } = useProjectStore();

  const completedToday = projects.filter((p) => {
    const lastActive = p.updatedAt ? new Date(p.updatedAt) : null;
    const today = new Date();
    return (
      lastActive &&
      lastActive.getDate() === today.getDate() &&
      lastActive.getMonth() === today.getMonth() &&
      lastActive.getFullYear() === today.getFullYear()
    );
  }).length;

  const hasWorkedToday = completedToday > 0;

  const getProjectText = (n: number) => {
    if (n % 10 === 1 && n % 100 !== 11) return "проект";
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20))
      return "проекта";
    return "проектов";
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white shadow-lg shadow-orange-500/25"
    >
      <Flame
        className={`w-5 h-5 ${hasWorkedToday ? "animate-pulse" : "opacity-50"}`}
      />
      <div className="flex flex-col">
        <span className="text-sm font-bold">
          {hasWorkedToday ? "Отличный день!" : "Ещё не работал"}
        </span>
        <span className="text-xs opacity-90">
          {completedToday} {getProjectText(completedToday)} сегодня
        </span>
      </div>
    </motion.div>
  );
}
