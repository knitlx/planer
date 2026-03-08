"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Settings, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderList } from "@/components/reminders/ReminderList";
import { ReminderForm, ReminderFormData } from "@/components/reminders/ReminderForm";
import { AppModal } from "@/components/AppModal";
import { toast } from "sonner";
import type { Reminder, User } from "@prisma/client";

type ReminderWithUser = Reminder & {
  user: Pick<User, "id" | "name" | "telegramId">;
  logs: any[];
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderWithUser | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<{
    user?: ReminderWithUser["user"];
    botTokenConfigured: boolean;
    defaultChatId: string | null;
  } | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const response = await fetch("/api/reminders");
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (error) {
      console.error("Failed to load reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTelegramSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch("/api/telegram/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        const error = await response.json();
        toast.error(error?.error?.message || "Не удалось получить настройки");
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Не удалось получить настройки");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
    loadTelegramSettings();
  };

  const handleTestMessage = async () => {
    if (!settings?.user?.id) return;
    setTestSending(true);
    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: settings.user.id }),
      });
      if (response.ok) {
        toast.success("Тестовое сообщение отправлено");
      } else {
        const error = await response.json();
        toast.error(error?.error?.message || "Telegram не принял сообщение");
      }
    } catch (error) {
      console.error("Failed to send test message:", error);
      toast.error("Не удалось отправить тестовое сообщение");
    } finally {
      setTestSending(false);
    }
  };

  const handleAddReminder = async (reminderData: ReminderFormData) => {
    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminderData),
      });

      if (response.ok) {
        const newReminder = await response.json();
        setReminders(prev => [newReminder, ...prev]);
        setShowAddModal(false);
        toast.success("Напоминание создано");
      } else {
        const error = await response.json();
        toast.error(error?.error?.message || "Не удалось создать напоминание");
      }
    } catch (error) {
      console.error("Failed to add reminder:", error);
      toast.error("Не удалось создать напоминание");
    }
  };

  const handleUpdateReminder = async (id: string, reminderData: ReminderFormData) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminderData),
      });

      if (response.ok) {
        const updatedReminder = await response.json();
        setReminders(prev =>
          prev.map(r => r.id === id ? updatedReminder : r)
        );
        setEditingReminder(null);
        toast.success("Напоминание обновлено");
      } else {
        const error = await response.json();
        toast.error(error?.error?.message || "Не удалось обновить напоминание");
      }
    } catch (error) {
      console.error("Failed to update reminder:", error);
      toast.error("Не удалось обновить напоминание");
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
        toast.success("Напоминание удалено");
      } else {
        const error = await response.json();
        toast.error(error?.error?.message || "Не удалось удалить напоминание");
      }
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      toast.error("Не удалось удалить напоминание");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Bell className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Напоминания Telegram
              </h1>
              <p className="text-text-secondary">
                Управляйте автоматическими напоминаниями в Telegram
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleOpenSettings}
            >
              <Settings className="w-4 h-4" />
              Настройки
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить напоминание
            </Button>
          </div>
        </div>

        {/* Reminders List */}
        <ReminderList
          reminders={reminders}
          onEdit={setEditingReminder}
          onDelete={handleDeleteReminder}
          onCreate={() => setShowAddModal(true)}
        />

        {/* Add Reminder Modal */}
        <AppModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Новое напоминание"
        >
          <ReminderForm
            onSubmit={handleAddReminder}
            onCancel={() => setShowAddModal(false)}
          />
        </AppModal>

        {/* Edit Reminder Modal */}
        <AppModal
          open={!!editingReminder}
          onClose={() => setEditingReminder(null)}
          title="Редактировать напоминание"
        >
          {editingReminder && (
            <ReminderForm
              reminder={editingReminder}
              onSubmit={(data) => handleUpdateReminder(editingReminder.id, data)}
              onCancel={() => setEditingReminder(null)}
            />
          )}
        </AppModal>

        {/* Settings Modal */}
        <AppModal
          open={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="Настройки Telegram"
        >
          {settingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
            </div>
          ) : settings ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-qf-border-primary p-4">
                <div className="flex items-center gap-3 mb-3">
                  {settings.botTokenConfigured ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {settings.botTokenConfigured ? "Bot token настроен" : "Bot token не найден"}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      TELEGRAM_BOT_TOKEN {settings.botTokenConfigured ? "задан" : "отсутствует"}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-text-secondary">
                  <p>
                    Telegram ID: <span className="font-medium">{settings.user?.telegramId}</span>
                  </p>
                  <p>
                    Имя: <span className="font-medium">{settings.user?.name || "—"}</span>
                  </p>
                  {settings.defaultChatId && (
                    <p className="text-xs text-text-tertiary mt-1">
                      TELEGRAM_DEFAULT_CHAT_ID: {settings.defaultChatId}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => loadTelegramSettings()}
                  disabled={settingsLoading || testSending}
                >
                  Обновить статус
                </Button>
                <Button
                  onClick={handleTestMessage}
                  disabled={!settings.botTokenConfigured || testSending}
                  className="flex items-center gap-2"
                >
                  {testSending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Отправить тест
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-text-secondary py-6">
              Не удалось загрузить настройки.
            </div>
          )}
        </AppModal>
      </motion.div>
    </div>
  );
}
