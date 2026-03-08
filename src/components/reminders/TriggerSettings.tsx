"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ReminderTriggerConfig, ReminderTriggerType } from "@prisma/client";

const TRIGGER_COPY: Record<ReminderTriggerType, { title: string; description: string }> = {
  MANDATORY_STALE: {
    title: "Проекты простаивают",
    description: "Напоминаем, если обязательный проект не трогали несколько дней",
  },
  MANDATORY_IGNORED: {
    title: "Игнорируются обязательные",
    description: "Появились активности в обычных проектах, но обязательные простаивают",
  },
  MANDATORY_NO_ACTIVE_TASKS: {
    title: "Нет активных задач",
    description: "В обязательном проекте закончились задачи в работе",
  },
};

export function TriggerSettings() {
  const [triggers, setTriggers] = useState<ReminderTriggerConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const sortedTriggers = useMemo(
    () =>
      [...triggers].sort((a, b) => a.type.localeCompare(b.type)),
    [triggers],
  );

  useEffect(() => {
    void loadTriggers();
  }, []);

  async function loadTriggers() {
    try {
      setLoading(true);
      const response = await fetch("/api/reminders/triggers");
      if (!response.ok) {
        throw new Error("Не удалось загрузить триггеры");
      }
      const data = (await response.json()) as ReminderTriggerConfig[];
      setTriggers(data);
    } catch (error) {
      console.error(error);
      toast.error("Не удалось загрузить триггеры");
    } finally {
      setLoading(false);
    }
  }

  async function updateTrigger(id: string, payload: Partial<ReminderTriggerConfig>) {
    try {
      setSavingId(id);
      const response = await fetch("/api/reminders/triggers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error?.message || "Не удалось сохранить");
      }
      const updated = (await response.json()) as ReminderTriggerConfig;
      setTriggers((prev) => prev.map((trigger) => (trigger.id === id ? updated : trigger)));
      toast.success("Настройки сохранены");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить");
    } finally {
      setSavingId(null);
    }
  }

  function renderCard(trigger: ReminderTriggerConfig) {
    const copy = TRIGGER_COPY[trigger.type];
    return (
      <motion.div
        key={trigger.id}
        layout
        className="rounded-2xl border border-qf-border-primary bg-qf-bg-secondary/60 backdrop-blur-sm p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{copy.title}</h3>
            <p className="text-sm text-text-secondary">{copy.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={trigger.enabled}
              onCheckedChange={(checked: boolean) => updateTrigger(trigger.id, { enabled: checked })}
              aria-label={`Триггер ${copy.title}`}
              data-testid={`trigger-${trigger.type.toLowerCase()}`}
            />
            <span className="text-sm text-text-secondary">{trigger.enabled ? "Вкл" : "Выкл"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`threshold-${trigger.id}`}>Порог, дней</Label>
            <Input
              id={`threshold-${trigger.id}`}
              type="number"
              min={1}
              max={30}
              value={trigger.thresholdDays ?? ""}
              onChange={(event) =>
                setTriggers((prev) =>
                  prev.map((item) => (item.id === trigger.id ? { ...item, thresholdDays: Number(event.target.value) } : item)),
                )
              }
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value)) {
                  void updateTrigger(trigger.id, { thresholdDays: value });
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`cooldown-${trigger.id}`}>Кулдаун, часов</Label>
            <Input
              id={`cooldown-${trigger.id}`}
              type="number"
              min={1}
              max={168}
              value={trigger.cooldownHours}
              onChange={(event) =>
                setTriggers((prev) =>
                  prev.map((item) => (item.id === trigger.id ? { ...item, cooldownHours: Number(event.target.value) } : item)),
                )
              }
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value)) {
                  void updateTrigger(trigger.id, { cooldownHours: value });
                }
              }}
            />
          </div>
        </div>
        {savingId === trigger.id && (
          <p className="text-xs text-text-tertiary">Сохраняем…</p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Обязательные триггеры</h2>
          <p className="text-sm text-text-secondary">Настройки интервалов и условий Mandatory-проектов</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadTriggers()} disabled={loading}>
          Обновить
        </Button>
      </div>
      {loading ? (
        <div className="py-8 text-center text-sm text-text-secondary">Загружаем…</div>
      ) : (
        <div className="space-y-3">
          {sortedTriggers.map(renderCard)}
          {sortedTriggers.length === 0 && (
            <p className="text-sm text-text-secondary">Нет конфигов триггеров</p>
          )}
        </div>
      )}
    </div>
  );
}
