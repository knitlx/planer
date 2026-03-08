"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Reminder } from "@prisma/client";

const RECURRING_NONE_VALUE = "__none";

type ReminderWithUser = Reminder & {
  user: {
    id: string;
    name: string | null;
    telegramId: number;
  };
  logs: any[];
};

interface ReminderFormProps {
  reminder?: ReminderWithUser;
  onSubmit: (data: ReminderFormData) => Promise<void> | void;
  onCancel: () => void;
}

export interface ReminderFormData {
  text: string;
  datetime: string;
  recurring?: "DAILY" | "WEEKLY";
  enabled: boolean;
}

export function ReminderForm({ reminder, onSubmit, onCancel }: ReminderFormProps) {
  const [formData, setFormData] = useState<ReminderFormData>({
    text: reminder?.text || "",
    datetime: reminder ? new Date(reminder.datetime).toISOString().slice(0, 16) : "",
    recurring: reminder?.recurring || undefined,
    enabled: reminder?.enabled ?? true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.text.trim() && formData.datetime;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Text */}
      <div className="space-y-2">
        <label htmlFor="text" className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <MessageSquare className="w-4 h-4" />
          Текст напоминания
        </label>
        <textarea
          id="text"
          value={formData.text}
          onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
          placeholder="Введите текст напоминания..."
          rows={3}
          className="resize-none rounded-lg border border-qf-border-primary bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* DateTime */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="datetime" className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Calendar className="w-4 h-4" />
            Дата и время
          </label>
          <Input
            id="datetime"
            type="datetime-local"
            value={formData.datetime}
            onChange={(e) => setFormData(prev => ({ ...prev, datetime: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="recurring" className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Clock className="w-4 h-4" />
            Повторение
          </label>
          <Select
            value={formData.recurring ?? RECURRING_NONE_VALUE}
            onValueChange={(value) =>
              setFormData(prev => ({
                ...prev,
                recurring:
                  value === RECURRING_NONE_VALUE
                    ? undefined
                    : (value as "DAILY" | "WEEKLY"),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Без повторения" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={RECURRING_NONE_VALUE}>Без повторения</SelectItem>
              <SelectItem value="DAILY">Ежедневно</SelectItem>
              <SelectItem value="WEEKLY">Еженедельно</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enabled */}
      <label htmlFor="enabled" className="flex items-center gap-2 text-sm font-medium text-text-secondary">
        <input
          id="enabled"
          type="checkbox"
          checked={formData.enabled}
          onChange={(e) =>
            setFormData(prev => ({ ...prev, enabled: e.target.checked }))
          }
          className="h-4 w-4 rounded border-qf-border-primary bg-transparent"
        />
        Напоминание активно
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Сохранение...
            </div>
          ) : (
            reminder ? "Сохранить" : "Создать"
          )}
        </Button>
      </div>
    </motion.form>
  );
}
