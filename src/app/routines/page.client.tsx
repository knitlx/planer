"use client";

import { useEffect, useState } from "react";
import { Flame, Plus, Trash2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Habit, HabitLog } from "@/types/project";

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLast30Days(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

export function RoutinesClient() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDesc, setNewHabitDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
      }
    } catch (error) {
      console.error("Failed to fetch habits:", error);
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async () => {
    if (!newHabitName.trim()) return;
    
    setIsCreating(true);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHabitName.trim(),
          description: newHabitDesc.trim() || undefined,
        }),
      });
      
      if (res.ok) {
        const newHabit = await res.json();
        setHabits([newHabit, ...habits]);
        setNewHabitName("");
        setNewHabitDesc("");
        setShowAdd(false);
        toast.success("Привычка создана");
      } else {
        toast.error("Не удалось создать привычку");
      }
    } catch {
      toast.error("Ошибка при создании привычки");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const today = getTodayDate();
    
    try {
      const res = await fetch(`/api/habits/${habitId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });
      
      if (res.ok) {
        const updatedHabit = await res.json();
        setHabits(habits.map((h) => (h.id === habitId ? updatedHabit : h)));
      }
    } catch {
      toast.error("Ошибка при обновлении привычки");
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!confirm("Удалить эту привычку?")) return;
    
    try {
      const res = await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
      if (res.ok) {
        setHabits(habits.filter((h) => h.id !== habitId));
        toast.success("Привычка удалена");
      }
    } catch {
      toast.error("Ошибка при удалении привычки");
    }
  };

  const isCompletedToday = (habit: Habit): boolean => {
    const today = getTodayDate();
    return habit.logs?.some((log) => log.date === today && log.completed) ?? false;
  };

  const getCompletedDates = (habit: Habit): Set<string> => {
    const dates = new Set<string>();
    habit.logs?.forEach((log) => {
      if (log.completed) dates.add(log.date);
    });
    return dates;
  };

  const last30Days = getLast30Days();
  const sortedHabits = [...habits].sort((a, b) => b.currentStreak - a.currentStreak);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-qf-gradient-primary flex items-center justify-center">
              <Flame className="w-6 h-6 text-[#0A0908]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Привычки</h1>
              <p className="text-text-secondary">Ежедневные рутины и привычки</p>
            </div>
          </div>
        </header>

        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 mb-6"
          >
            <div className="space-y-3">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Название привычки"
                className="w-full px-3 py-2 rounded-lg bg-qf-bg-secondary border border-qf-border-primary text-text-primary focus:outline-none focus:border-qf-border-accent"
                autoFocus
              />
              <input
                type="text"
                value={newHabitDesc}
                onChange={(e) => setNewHabitDesc(e.target.value)}
                placeholder="Описание (необязательно)"
                className="w-full px-3 py-2 rounded-lg bg-qf-bg-secondary border border-qf-border-primary text-text-primary focus:outline-none focus:border-qf-border-accent"
              />
              <div className="flex gap-2">
                <button
                  onClick={createHabit}
                  disabled={!newHabitName.trim() || isCreating}
                  className="px-4 py-2 rounded-lg bg-accent text-[#0A0908] font-medium hover:brightness-105 transition-all disabled:opacity-50"
                >
                  {isCreating ? "Создание..." : "Создать"}
                </button>
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setNewHabitName("");
                    setNewHabitDesc("");
                  }}
                  className="px-4 py-2 rounded-lg bg-qf-bg-secondary text-text-secondary hover:bg-qf-bg-tertiary transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setShowAdd(true)}
          className="w-full card p-4 flex items-center justify-center gap-2 mb-6 border-dashed hover:border-accent/50 transition-colors"
        >
          <Plus className="w-5 h-5 text-text-muted" />
          <span className="text-text-muted">Добавить привычку</span>
        </button>

        {sortedHabits.length === 0 ? (
          <div className="text-center py-12 card">
            <p className="text-text-muted">Нет привычек. Создайте первую!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedHabits.map((habit) => {
              const completedToday = isCompletedToday(habit);
              const completedDates = getCompletedDates(habit);
              
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4"
                  data-testid={`habit-card-${habit.id}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleHabit(habit.id)}
                        aria-label={`Отметить привычку ${habit.name}`}
                        data-testid={`habit-toggle-${habit.id}`}
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          completedToday
                            ? "bg-green-500/20 border-green-500 text-green-400"
                            : "bg-qf-bg-secondary border-qf-border-secondary hover:border-accent"
                        }`}
                      >
                        {completedToday && <Check className="w-5 h-5" />}
                      </button>
                      <div>
                        <h3 className="font-semibold text-text-primary">{habit.name}</h3>
                        {habit.description && (
                          <p className="text-sm text-text-muted">{habit.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div
                          className="text-lg font-bold text-accent"
                          data-testid={`habit-streak-${habit.id}`}
                        >
                          {habit.currentStreak}
                        </div>
                        <div className="text-[10px] text-text-muted">streak</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-text-secondary">{habit.bestStreak}</div>
                        <div className="text-[10px] text-text-muted">рекорд</div>
                      </div>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {last30Days.map((date) => {
                      const completed = completedDates.has(date);
                      const isToday = date === getTodayDate();
                      return (
                        <div
                          key={date}
                          className={`w-3 h-3 rounded-sm ${
                            completed
                              ? "bg-green-500"
                              : isToday
                                ? "bg-qf-bg-tertiary border border-accent/30"
                                : "bg-qf-bg-tertiary"
                          }`}
                          title={date}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
