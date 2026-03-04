"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useFocusStore } from "@/store/useFocusStore";
import { useProjectStore } from "@/store/useProjectStore";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";

export function TheFocusRoom() {
  const router = useRouter();
  const {
    currentProjectId,
    currentTaskId,
    sessionStartTime,
    timerElapsed,
    sessionDuration,
    updateTimer,
    stopFocus,
  } = useFocusStore();
  const { projects, updateProjectStatus } = useProjectStore();
  const [isStuckMode, setStuckMode] = useState(false);
  const [note, setNote] = useState("");

  const project = projects.find((p) => p.id === currentProjectId);
  const currentTask = project?.tasks?.find((t) => t.id === currentTaskId);

  const isSessionTask = currentTask?.type === "SESSION";
  const sessionProgress =
    sessionDuration > 0 ? (timerElapsed / sessionDuration) * 100 : 0;

  useEffect(() => {
    if (!sessionStartTime) return;
    const tick = () => updateTimer(Date.now() - sessionStartTime);
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [sessionStartTime, updateTimer]);

  const leaveFocusRoom = (projectId?: string | null) => {
    stopFocus();
    if (projectId) {
      router.push(`/focus/${projectId}`);
      return;
    }
    router.push("/projects");
  };

  const handleStop = async () => {
    const sessionNote = prompt("Короткая заметка для следующей сессии:");
    if (!sessionNote) return;

    await updateProjectStatus(currentProjectId!, "SNOOZED", sessionNote);
    leaveFocusRoom(currentProjectId);
  };

  if (!project) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 transition-colors duration-500 ${
        isStuckMode
          ? "bg-[radial-gradient(circle_at_20%_30%,rgba(138,43,226,0.14)_0%,transparent_40%),radial-gradient(circle_at_80%_70%,rgba(0,229,255,0.1)_0%,transparent_40%),#050509]"
          : "bg-[radial-gradient(circle_at_20%_30%,rgba(138,43,226,0.08)_0%,transparent_40%),radial-gradient(circle_at_80%_70%,rgba(0,229,255,0.06)_0%,transparent_40%),#000000]"
      }`}
    >
      <div className="max-w-2xl mx-auto pt-16 px-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">{project.name}</h1>
          {project.lastSessionNote && (
            <div className="bg-qf-bg-glass backdrop-blur-xl rounded-xl p-4 text-qf-text-secondary italic border-l-4 border-cyan-400 border border-qf-border-secondary">
              «Прошлая заметка: {project.lastSessionNote}»
            </div>
          )}
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

              {isSessionTask && (
                <div className="mb-6">
                  <div className="text-5xl font-mono font-bold gradient-text mb-2">
                    {formatTime(timerElapsed)}
                  </div>
                  <div className="w-full quantum-progress mb-4">
                    <motion.div
                      className="quantum-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${sessionProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {currentTask.contextSummary && (
                <div className="bg-qf-bg-secondary/80 rounded-lg p-3 text-sm text-qf-text-secondary mb-4 border border-qf-border-secondary">
                  <span className="font-semibold">Контекст:</span>{" "}
                  {currentTask.contextSummary}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-4">
          <Button
            variant={isStuckMode ? "default" : "outline"}
            onClick={() => setStuckMode(!isStuckMode)}
            className={
              isStuckMode
                ? "bg-qf-gradient-primary text-white"
                : "text-white border-qf-border-primary hover:border-qf-border-accent"
            }
          >
            {isStuckMode ? "Стало лучше" : "Застрял(а) -> Упростить"}
          </Button>
          <Button onClick={handleStop} className="text-white border border-qf-border-primary bg-qf-bg-secondary/80 hover:border-qf-border-accent">
            Остановить и сохранить
          </Button>
          <Button
            variant="outline"
            onClick={() => leaveFocusRoom(currentProjectId)}
            className="text-white border-qf-border-primary hover:border-qf-border-accent"
          >
            Выйти без сохранения
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
