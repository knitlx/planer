"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFocusStore } from "@/store/useFocusStore";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import { formatDurationHms, parseDurationMs } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-client";

const TIMER_STEP_SECOND_MS = 10 * 1000;
const TIMER_STEP_MINUTE_MS = 60 * 1000;

const parseHmsInputToMs = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  if (parts.length !== 3) return null;
  const [hRaw, mRaw, sRaw] = parts;
  const h = Number(hRaw);
  const m = Number(mRaw);
  const s = Number(sRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) return null;
  if (h < 0 || m < 0 || s < 0 || m > 59 || s > 59) return null;
  return Math.floor((h * 3600 + m * 60 + s) * 1000);
};

export function TheFocusRoom() {
  const {
    currentProjectId,
    currentTaskId,
    sessionStartTime,
    timerElapsed,
    updateTimer,
    stopFocus,
  } =
    useFocusStore();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [taskNote, setTaskNote] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [manualHmsInput, setManualHmsInput] = useState("00:00:00");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const [leavePromptMessage, setLeavePromptMessage] = useState("");
  const displayElapsedMs = Math.max(0, elapsedMs);

  const persistElapsedTimeToTask = async () => {
    if (!currentTaskId) return;
    if (displayElapsedMs < 1000) return;
    const currentLogged = parseDurationMs(currentTask?.timerLog);
    const nextLogged = currentLogged + displayElapsedMs;
    await fetch(`/api/tasks/${currentTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timerLog: String(nextLogged) }),
    });
  };

  const saveNotes = async () => {
    if (!currentProjectId) return;
    setIsSavingNotes(true);
    try {
      const requests: Promise<Response>[] = [];

      if (currentTaskId) {
        requests.push(
          fetch(`/api/tasks/${currentTaskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contextSummary: taskNote.trim() || null }),
          }),
        );
      }

      requests.push(fetch(`/api/projects/${currentProjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastSessionNote: sessionNote.trim() || null }),
      }));

      const responses = await Promise.all(requests);
      const hasErrors = responses.some((response) => !response.ok);
      if (currentTaskId) {
        setCurrentTask((prev: any) => (
          prev ? { ...prev, contextSummary: taskNote.trim() || null } : prev
        ));
      }
      setProject((prev: any) => (
        prev ? { ...prev, lastSessionNote: sessionNote.trim() || null } : prev
      ));
      if (hasErrors) {
        throw new Error("Не удалось сохранить часть заметок");
      }
    } finally {
      setIsSavingNotes(false);
    }
  };

  const leaveFocusRoom = async (projectId?: string | null, persistTime = true) => {
    if (persistTime) {
      try {
        await persistElapsedTimeToTask();
      } catch (error) {
        console.error("Error persisting task timer:", error);
      }
    }
    stopFocus();
    if (projectId) {
      router.push(`/focus/${projectId}`);
      return;
    }
    router.push("/projects");
  };

  useEffect(() => {
    if (currentProjectId) {
      fetch(`/api/projects/${currentProjectId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch project");
          return res.json();
        })
        .then(setProject)
        .catch((err) => console.error("Error fetching project:", err));
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (project?.tasks && currentTaskId) {
      const task = project.tasks.find((t: any) => t.id === currentTaskId);
      setCurrentTask(task);
      setTaskNote(task?.contextSummary || "");
    }
  }, [project, currentTaskId]);

  useEffect(() => {
    setSessionNote(project?.lastSessionNote || "");
  }, [project?.lastSessionNote]);

  useEffect(() => {
    if (!sessionStartTime) return;
    setElapsedMs((prev) => (prev > 0 ? prev : Math.max(timerElapsed, 0)));
  }, [sessionStartTime, timerElapsed]);

  useEffect(() => {
    setManualHmsInput(formatDurationHms(displayElapsedMs));
  }, [displayElapsedMs]);

  useEffect(() => {
    if (!isTimerRunning) return;
    let lastTickAt = Date.now();
    const tick = () => {
      const now = Date.now();
      const delta = Math.max(0, now - lastTickAt);
      lastTickAt = now;
      setElapsedMs((prev) => prev + delta);
    };
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [isTimerRunning]);

  useEffect(() => {
    updateTimer(Math.max(0, elapsedMs));
  }, [elapsedMs, updateTimer]);

  const applyManualTimer = () => {
    const parsed = parseHmsInputToMs(manualHmsInput);
    if (parsed === null) {
      toast.error("Введите время в формате HH:MM:SS");
      return;
    }
    setElapsedMs(parsed);
  };

  const adjustTimer = (deltaMs: number) => {
    setElapsedMs((prev) => Math.max(0, prev + deltaMs));
  };

  const resetTimer = () => {
    setElapsedMs(0);
    updateTimer(0);
  };

  useEffect(() => {
    setElapsedMs(0);
    setIsTimerRunning(true);
  }, [currentTaskId]);

  const handleStop = async () => {
    const note = sessionNote.trim();
    if (!note) {
      toast.error("Добавьте заметку сессии перед остановкой.");
      return;
    }

    try {
      await saveNotes().catch((error) => {
        console.error("Failed to save notes before stop:", error);
      });
      await persistElapsedTimeToTask().catch((error) => {
        console.error("Failed to persist timer before stop:", error);
      });
      const response = await fetch(`/api/projects/${currentProjectId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SNOOZED", lastSessionNote: note }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as unknown;
        throw new Error(getApiErrorMessage(payload) || "Не удалось обновить статус проекта");
      }
      await leaveFocusRoom(currentProjectId, false);
    } catch (error) {
      console.error("Error stopping focus:", error);
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";
      setLeavePromptMessage(message);
      setLeavePromptOpen(true);
    }
  };

  if (!project) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
        <div className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass p-6 text-center max-w-md">
          <p className="text-qf-text-secondary mb-4">
            Не удалось загрузить сессию фокуса.
          </p>
          <Button onClick={() => void leaveFocusRoom(currentProjectId)}>
            Вернуться к проектам
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto transition-colors duration-500 bg-[radial-gradient(circle_at_20%_30%,rgba(138,43,226,0.08)_0%,transparent_40%),radial-gradient(circle_at_80%_70%,rgba(0,229,255,0.06)_0%,transparent_40%),#000000]"
    >
      <div className="max-w-2xl mx-auto pt-16 pb-28 px-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">{project.name}</h1>
          <div className="mb-4 rounded-xl border border-qf-border-secondary bg-qf-bg-glass px-4 py-3">
            <p className="text-xs tracking-wide text-qf-text-muted mb-1">Идет фокус-сессия</p>
            <p className="text-4xl font-mono font-bold gradient-text">{formatDurationHms(displayElapsedMs)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => adjustTimer(-TIMER_STEP_MINUTE_MS)}
                className="px-2 py-1 rounded-md border border-qf-border-secondary text-xs text-qf-text-secondary hover:text-white"
              >
                -1 мин
              </button>
              <button
                onClick={() => adjustTimer(TIMER_STEP_MINUTE_MS)}
                className="px-2 py-1 rounded-md border border-qf-border-secondary text-xs text-qf-text-secondary hover:text-white"
              >
                +1 мин
              </button>
              <button
                onClick={() => adjustTimer(-TIMER_STEP_SECOND_MS)}
                className="px-2 py-1 rounded-md border border-qf-border-secondary text-xs text-qf-text-secondary hover:text-white"
              >
                -10 сек
              </button>
              <button
                onClick={() => adjustTimer(TIMER_STEP_SECOND_MS)}
                className="px-2 py-1 rounded-md border border-qf-border-secondary text-xs text-qf-text-secondary hover:text-white"
              >
                +10 сек
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2">
              <input
                value={manualHmsInput}
                onChange={(event) => setManualHmsInput(event.target.value)}
                placeholder="HH:MM:SS"
                className="rounded-md border border-qf-border-primary bg-qf-bg-secondary px-2 py-1.5 text-sm text-white focus:outline-none focus:border-qf-border-accent"
              />
              <button
                onClick={applyManualTimer}
                className="px-2 py-1.5 rounded-md border border-qf-border-secondary text-xs text-qf-text-secondary hover:text-white"
              >
                Применить
              </button>
              <button
                onClick={() => setIsTimerRunning((prev) => !prev)}
                className="px-2 py-1.5 rounded-md border border-qf-border-secondary text-xs text-qf-text-secondary hover:text-white"
              >
                {isTimerRunning ? "Пауза" : "Старт"}
              </button>
              <button
                onClick={resetTimer}
                className="px-2 py-1.5 rounded-md border border-qf-border-secondary text-xs text-qf-text-secondary hover:text-white"
              >
                Сброс
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-qf-border-secondary bg-qf-bg-glass px-4 py-3">
            <p className="text-xs tracking-wide text-qf-text-muted mb-2">
              Заметка сессии проекта
            </p>
            <textarea
              value={sessionNote}
              onChange={(event) => setSessionNote(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-white focus:outline-none focus:border-qf-border-accent resize-none"
              placeholder="Что важно помнить перед следующей сессией..."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={saveNotes}
                disabled={isSavingNotes}
                className="text-white border-qf-border-primary hover:border-qf-border-accent"
              >
                {isSavingNotes ? "Сохранение..." : "Сохранить заметку"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSessionNote("")}
                className="text-white border-qf-border-primary hover:border-qf-border-accent"
              >
                Очистить
              </Button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentTask && (
            <motion.div
              key={currentTask.id}
              layoutId={`task-${currentTask.id}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="qf-shell-card rounded-2xl p-8 shadow-2xl mb-6 text-white"
            >
              <h2 className="text-2xl font-semibold mb-4">
                {currentTask.title}
              </h2>
              <p className="mb-4 text-xs tracking-wide text-qf-text-muted">Задача в фокусе</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs tracking-wide text-qf-text-muted mb-2">
                    Заметка задачи
                  </p>
                  <textarea
                    value={taskNote}
                    onChange={(event) => setTaskNote(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-white focus:outline-none focus:border-qf-border-accent resize-none"
                    placeholder="Контекст и заметки по текущей задаче..."
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={saveNotes}
                  disabled={isSavingNotes}
                  className="text-white border-qf-border-primary hover:border-qf-border-accent"
                >
                  {isSavingNotes ? "Сохранение..." : "Сохранить заметки"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sticky bottom-4 z-10 flex flex-wrap gap-4 rounded-xl border border-qf-border-secondary bg-black/60 p-3 backdrop-blur">
          <Button
            onClick={handleStop}
            className="text-white border border-qf-border-primary bg-qf-bg-secondary/80 hover:border-qf-border-accent"
          >
            Остановить и сохранить
          </Button>
          <Button
            variant="outline"
            onClick={() => void leaveFocusRoom(currentProjectId)}
            className="text-white border-qf-border-primary hover:border-qf-border-accent"
          >
            Выйти без сохранения
          </Button>
        </div>
      </div>
      <AppModal
        open={leavePromptOpen}
        title="Ошибка остановки сессии"
        description={`${leavePromptMessage}. Выйти из Focus Room без сохранения статуса?`}
        onClose={() => setLeavePromptOpen(false)}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setLeavePromptOpen(false)}
              variant="secondary"
              className="w-full"
            >
              Остаться
            </Button>
            <Button
              onClick={() => {
                setLeavePromptOpen(false);
                void leaveFocusRoom(currentProjectId, false);
              }}
              variant="destructive"
              className="w-full"
            >
              Выйти без сохранения
            </Button>
          </div>
        }
      >
        {null}
      </AppModal>
    </motion.div>
  );
}
