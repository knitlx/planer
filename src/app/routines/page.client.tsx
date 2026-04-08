"use client";

import { useEffect, useState } from "react";
import { Flame, Plus, Trash2, Check, Calendar, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import type { Habit, HabitLog } from "@/types/project";

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function HabitCalendar({ habit, completedDates }: { habit: Habit; completedDates: Set<string> }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());

  const calendarDays: Date[] = [];
  const currentDate = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth.getMonth();
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const formatDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return (
    <div className="mt-1 border-t border-qf-border-secondary pt-2 w-[150px] max-w-full mx-auto">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="text-[10px] px-1 py-0.5 rounded hover:bg-qf-bg-tertiary transition-colors text-qf-text-primary">‹</button>
        <span className="text-xs font-medium text-qf-text-primary">
          {currentMonth.toLocaleDateString("ru-RU", { month: "short" })}
        </span>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="text-[10px] px-1 py-0.5 rounded hover:bg-qf-bg-tertiary transition-colors text-qf-text-primary">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0 w-[126px] mx-auto">
        {calendarDays.map((date, index) => {
          const dateStr = formatDateKey(date);
          const completed = completedDates.has(dateStr);
          const today = isToday(date);
          return (
            <div key={index} className={`w-[18px] h-[18px] flex items-center justify-center text-[9px] rounded-sm transition-colors leading-none ${
              isCurrentMonth(date)
                ? completed ? "bg-green-500 text-white font-medium"
                  : today ? "bg-[#ffc300] text-[#0A0908] font-medium"
                  : "bg-qf-bg-secondary text-qf-text-primary hover:bg-qf-bg-tertiary"
                : "bg-transparent text-transparent"
            }`}>
              {isCurrentMonth(date) ? date.getDate() : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RoutinesClient() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDesc, setNewHabitDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCalendars, setShowCalendars] = useState<Record<string, boolean>>({});
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [habitToDeleteId, setHabitToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.ok) setHabits(await res.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить привычки");
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
        body: JSON.stringify({ name: newHabitName.trim(), description: newHabitDesc.trim() || undefined }),
      });
      if (res.ok) {
        setHabits([await res.json(), ...habits]);
        setNewHabitName(""); setNewHabitDesc(""); setShowAdd(false);
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
    try {
      const res = await fetch(`/api/habits/${habitId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: getTodayDate() }),
      });
      if (res.ok) {
        const updatedHabit = await res.json();
        setHabits(habits.map((h) => (h.id === habitId ? updatedHabit : h)));
      }
    } catch {
      toast.error("Ошибка при обновлении привычки");
    }
  };

  const deleteHabit = async () => {
    if (!habitToDeleteId) return;
    try {
      const res = await fetch(`/api/habits/${habitToDeleteId}`, { method: "DELETE" });
      if (res.ok) {
        setHabits(habits.filter((h) => h.id !== habitToDeleteId));
        toast.success("Привычка удалена");
      }
      setHabitToDeleteId(null);
    } catch {
      toast.error("Ошибка при удалении привычки");
    }
  };

  const updateHabit = async () => {
    if (!editingHabitId || !editName.trim()) return;
    try {
      const res = await fetch(`/api/habits/${editingHabitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || undefined }),
      });
      if (res.ok) {
        const updatedHabit = await res.json();
        setHabits(habits.map((h) => (h.id === editingHabitId ? updatedHabit : h)));
        setEditingHabitId(null); setEditName(""); setEditDesc("");
        toast.success("Привычка обновлена");
      } else {
        toast.error("Не удалось обновить привычку");
      }
    } catch {
      toast.error("Ошибка при обновлении привычки");
    }
  };

  const startEditing = (habit: Habit) => {
    setEditingHabitId(habit.id); setEditName(habit.name); setEditDesc(habit.description || "");
  };
  const cancelEditing = () => {
    setEditingHabitId(null); setEditName(""); setEditDesc("");
  };
  const toggleCalendar = (habitId: string) => {
    setShowCalendars((prev) => ({ ...prev, [habitId]: !prev[habitId] }));
  };
  const isCompletedToday = (habit: Habit) => {
    const today = getTodayDate();
    return habit.logs?.some((log) => log.date === today && log.completed) ?? false;
  };
  const getCompletedDates = (habit: Habit) => {
    const dates = new Set<string>();
    habit.logs?.forEach((log) => { if (log.completed) dates.add(log.date); });
    return dates;
  };

  const sortedHabits = [...habits].sort((a, b) => b.currentStreak - a.currentStreak);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-qf-text-secondary">Загрузка...</div>;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#ffc300] flex items-center justify-center">
              <Flame className="w-6 h-6 text-[#0A0908]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-qf-text-primary">Привычки</h1>
              <p className="text-qf-text-secondary">Ежедневные рутины и привычки</p>
            </div>
          </div>
        </header>

        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 mb-6">
            <div className="space-y-3">
              <input type="text" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="Название привычки" className="w-full px-3 py-2 rounded-lg bg-qf-bg-secondary border border-qf-border-primary text-qf-text-primary focus:outline-none focus:border-qf-border-accent" autoFocus />
              <input type="text" value={newHabitDesc} onChange={(e) => setNewHabitDesc(e.target.value)} placeholder="Описание (необязательно)" className="w-full px-3 py-2 rounded-lg bg-qf-bg-secondary border border-qf-border-primary text-qf-text-primary focus:outline-none focus:border-qf-border-accent" />
              <div className="flex gap-2">
                <button onClick={createHabit} disabled={!newHabitName.trim() || isCreating} className="px-4 py-2 rounded-lg bg-[#ffc300] text-[#0A0908] font-medium hover:brightness-105 transition-all disabled:opacity-50">{isCreating ? "Создание..." : "Создать"}</button>
                <button onClick={() => { setShowAdd(false); setNewHabitName(""); setNewHabitDesc(""); }} className="px-4 py-2 rounded-lg bg-qf-bg-secondary text-qf-text-secondary hover:bg-qf-bg-tertiary transition-colors">Отмена</button>
              </div>
            </div>
          </motion.div>
        )}

        <button onClick={() => setShowAdd(true)} className="w-full card p-4 flex items-center justify-center gap-2 mb-6 border-dashed hover:border-qf-text-accent/50 transition-colors">
          <Plus className="w-5 h-5 text-qf-text-muted" />
          <span className="text-qf-text-muted">Добавить привычку</span>
        </button>

        {sortedHabits.length === 0 ? (
          <div className="text-center py-12 card"><p className="text-qf-text-muted">Нет привычек. Создайте первую!</p></div>
        ) : (
          <div className="space-y-4">
            {sortedHabits.map((habit) => {
              const completedToday = isCompletedToday(habit);
              const completedDates = getCompletedDates(habit);
              return (
                <motion.div key={habit.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative" data-testid={`habit-card-${habit.id}`}>
                  {/* Calendar - shown below on mobile, to the left on desktop */}
                  {showCalendars[habit.id] && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="lg:absolute lg:right-full lg:mr-4 lg:top-1/2 lg:-translate-y-1/2 z-20 mb-2 lg:mb-0">
                      <div className="card p-3 shadow-lg">
                        <HabitCalendar habit={habit} completedDates={completedDates} />
                      </div>
                    </motion.div>
                  )}

                  <div className="card p-4 min-h-[80px] flex items-center">
                    <div className="flex w-full items-center gap-3 lg:gap-4">
                      <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => toggleCalendar(habit.id)} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          showCalendars[habit.id] ? "border-[#ffc300] text-[#ffc300] bg-[#ffc300]/10" : "border-qf-border-primary text-qf-text-muted bg-qf-bg-tertiary shadow-inner hover:border-[#ffc300] hover:text-[#ffc300]"
                        }`} title="Показать календарь" aria-pressed={showCalendars[habit.id] ? "true" : "false"}>
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleHabit(habit.id)} aria-label={`Отметить привычку ${habit.name}`} data-testid={`habit-toggle-${habit.id}`} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          completedToday ? "bg-green-500/20 border-green-500 text-green-400" : "bg-qf-bg-secondary border-qf-border-secondary hover:border-[#ffc300]"
                        }`}>
                          {completedToday && <Check className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className={`flex-1 min-w-0 flex flex-col justify-center ${editingHabitId === habit.id ? "gap-2" : "gap-1"}`}>
                        {editingHabitId === habit.id ? (
                          <>
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full text-base font-bold bg-qf-bg-secondary border border-qf-border-primary rounded px-2 py-1 text-qf-text-primary focus:outline-none focus:border-[#ffc300]" placeholder="Название привычки" />
                            <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full text-xs bg-qf-bg-secondary border border-qf-border-primary rounded px-2 py-1 text-qf-text-muted focus:outline-none focus:border-[#ffc300]" placeholder="Описание (необязательно)" />
                            <div className="flex gap-1">
                              <button onClick={updateHabit} disabled={!editName.trim()} className="px-2 py-1 text-xs rounded bg-[#ffc300] text-[#0A0908] font-medium hover:brightness-105 transition-all disabled:opacity-50">Сохранить</button>
                              <button onClick={cancelEditing} className="px-2 py-1 text-xs rounded bg-qf-bg-secondary text-qf-text-secondary hover:bg-qf-bg-tertiary transition-colors">Отмена</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="text-base font-bold text-qf-text-primary leading-tight break-words">{habit.name}</h3>
                            {habit.description && <p className="text-xs text-qf-text-muted leading-tight break-words">{habit.description}</p>}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 lg:gap-3 ml-auto shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-[#ffc300] leading-none" data-testid={`habit-streak-${habit.id}`}>{habit.currentStreak}</span>
                          <span className="text-xs uppercase tracking-wide text-qf-text-muted hidden sm:inline">серия</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-qf-text-secondary leading-none">{habit.bestStreak}</span>
                          <span className="text-xs uppercase tracking-wide text-qf-text-muted hidden sm:inline">рекорд</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditing(habit)} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-blue-500/10 text-qf-text-muted hover:text-blue-400 transition-colors" title="Редактировать">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setHabitToDeleteId(habit.id)} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-qf-text-muted hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmActionModal
        open={Boolean(habitToDeleteId)}
        title="Удалить привычку?"
        description="Привычка и все её записи будут удалены."
        confirmText="Удалить"
        onCancel={() => setHabitToDeleteId(null)}
        onConfirm={deleteHabit}
      />
    </div>
  );
}
