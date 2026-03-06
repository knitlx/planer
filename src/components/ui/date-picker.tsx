"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
}

const weekdayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function DatePicker({ value, onChange, disabled, className }: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = useMemo(() => {
    if (!value) return null;
    try {
      return parseISO(`${value}T00:00:00`);
    } catch {
      return null;
    }
  }, [value]);

  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate ?? new Date());

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (selectedDate) setVisibleMonth(selectedDate);
  }, [selectedDate]);

  const gridDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const from = startOfWeek(monthStart, { weekStartsOn: 1 });
    const to = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: from, end: to });
  }, [visibleMonth]);

  const label = selectedDate ? format(selectedDate, "dd.MM.yyyy") : "Выберите дату";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-qf-text-primary transition-all focus-visible:outline-none focus-visible:border-qf-border-accent focus-visible:ring-1 focus-visible:ring-qf-border-accent/35 disabled:cursor-not-allowed disabled:opacity-50",
          !selectedDate && "text-qf-text-muted",
          className,
        )}
      >
        <span>{label}</span>
        <CalendarDays className="w-4 h-4 text-qf-text-secondary" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-[280px] rounded-xl border border-qf-border-secondary bg-[#131110] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((prev) => subMonths(prev, 1))}
              className="rounded-lg p-1.5 text-qf-text-secondary hover:bg-white/5 hover:text-qf-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-medium text-qf-text-primary">
              {format(visibleMonth, "LLLL yyyy")}
            </div>
            <button
              type="button"
              onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
              className="rounded-lg p-1.5 text-qf-text-secondary hover:bg-white/5 hover:text-qf-text-primary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdayLabels.map((day) => (
              <div key={day} className="text-center text-[11px] text-qf-text-muted py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const inMonth = isSameMonth(day, visibleMonth);
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const today = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(format(day, "yyyy-MM-dd"));
                    setOpen(false);
                  }}
                  className={cn(
                    "h-8 rounded-md text-xs transition-colors",
                    selected
                      ? "bg-[#FFC300] text-[#0A0908] font-bold"
                      : inMonth
                        ? "text-qf-text-primary hover:bg-white/6"
                        : "text-qf-text-muted/60 hover:bg-white/3",
                    today && !selected && "border border-qf-border-accent",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs text-qf-text-secondary hover:text-qf-text-primary transition-colors"
            >
              Очистить
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-qf-text-secondary hover:text-qf-text-primary transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
