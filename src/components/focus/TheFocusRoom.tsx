"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusStore } from "@/store/useFocusStore";
import { useProjectStore } from "@/store/useProjectStore";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";

export function TheFocusRoom() {
  const {
    currentProjectId,
    currentTaskId,
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

  const handleStop = async () => {
    const sessionNote = prompt("Write a quick note for your next session:");
    if (!sessionNote) return;

    await updateProjectStatus(currentProjectId!, "SNOOZED", sessionNote);
    stopFocus();
  };

  if (!project) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 transition-colors duration-500 ${
        isStuckMode
          ? "bg-gradient-to-br from-emerald-900 to-emerald-800"
          : "bg-gradient-to-br from-slate-900 to-slate-800"
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
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-gray-200 italic border-l-4 border-blue-400">
              "Last time: {project.lastSessionNote}"
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
              className="bg-white rounded-2xl p-8 shadow-2xl mb-6"
            >
              <h2 className="text-2xl font-semibold mb-4">
                {currentTask.title}
              </h2>

              {isSessionTask && (
                <div className="mb-6">
                  <div className="text-5xl font-mono font-bold text-blue-600 mb-2">
                    {formatTime(timerElapsed)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${sessionProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {currentTask.contextSummary && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-600 mb-4">
                  <span className="font-semibold">Context:</span>{" "}
                  {currentTask.contextSummary}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4">
          <Button
            variant={isStuckMode ? "default" : "outline"}
            onClick={() => setStuckMode(!isStuckMode)}
            className={
              isStuckMode
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "text-white border-white"
            }
          >
            {isStuckMode ? "✓ Feeling better" : "I'm stuck → Simplify"}
          </Button>
          <Button onClick={handleStop} className="text-white">
            Stop & Save
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
