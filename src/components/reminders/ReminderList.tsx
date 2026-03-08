"use client";

import { motion } from "framer-motion";
import { Clock, Edit, Trash2, Bell, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Reminder, User as UserType } from "@prisma/client";

type ReminderWithUser = Reminder & {
  user: Pick<UserType, "id" | "name" | "telegramId">;
  logs: any[];
};

interface ReminderListProps {
  reminders: ReminderWithUser[];
  onEdit: (reminder: ReminderWithUser) => void;
  onDelete: (id: string) => void;
  onCreate?: () => void;
}

export function ReminderList({ reminders, onEdit, onDelete, onCreate }: ReminderListProps) {
  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6 card">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-qf-border-primary flex items-center justify-center mb-6">
          <Bell className="w-7 h-7 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Нет напоминаний</h2>
        <p className="text-text-secondary max-w-md mb-6">
          Создайте первое напоминание, чтобы получать уведомления в Telegram о важных задачах и рутинах.
        </p>
        <Button onClick={onCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Добавить напоминание
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {reminders.map((reminder, index) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
                    <Bell className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary line-clamp-2">
                      {reminder.text}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${
                          reminder.enabled
                            ? "border-accent/40 text-accent"
                            : "border-qf-border-primary text-text-tertiary"
                        }`}
                      >
                        {reminder.enabled ? "Активно" : "Отключено"}
                      </span>
                      {reminder.recurring && (
                        <span className="px-2 py-0.5 text-xs rounded-full border border-qf-border-primary text-text-secondary">
                          {reminder.recurring === "DAILY" ? "Ежедневно" : "Еженедельно"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time and User Info */}
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(reminder.datetime).toLocaleString("ru-RU", {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>
                      {reminder.user.name || `ID: ${reminder.user.telegramId}`}
                    </span>
                  </div>
                  {reminder.lastSentAt && (
                    <div className="text-xs text-text-tertiary">
                      Последняя отправка: {new Date(reminder.lastSentAt).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                </div>

                {/* Logs */}
                {reminder.logs && reminder.logs.length > 0 && (
                  <div className="text-xs text-text-tertiary">
                    Отправлено {reminder.logs.length} раз
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(reminder)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Изменить
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(reminder.id)}
                  className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
