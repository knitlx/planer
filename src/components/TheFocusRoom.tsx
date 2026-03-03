"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusStore } from "@/store/useFocusStore";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";

export function TheFocusRoom() {
  const { currentProjectId, currentTaskId, timerElapsed, stopFocus } =
    useFocusStore();
  const [isStuckMode, setStuckMode] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [currentTask, setCurrentTask] = useState<any>(null);

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
      setCurrentTask(project.tasks.find((t: any) => t.id === currentTaskId));
    }
  }, [project, currentTaskId]);

  const handleStop = async () => {
    const note = prompt("Write a quick note for your next session:");
    if (!note) return;

    try {
      const response = await fetch(`/api/projects/${currentProjectId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SNOOZED", lastSessionNote: note }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      stopFocus();
    } catch (error) {
      console.error("Error stopping focus:", error);
      alert("Failed to save session. Please try again.");
    }
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
              className="qf-shell-card rounded-2xl p-8 shadow-2xl mb-6 text-white"
            >
              <h2 className="text-2xl font-semibold mb-4">
                {currentTask.title}
              </h2>

              {currentTask.type === "SESSION" && (
                <div className="mb-6">
                  <div className="text-5xl font-mono font-bold gradient-text mb-2">
                    {formatTime(timerElapsed)}
                  </div>
                </div>
              )}

              {currentTask.contextSummary && (
                <div className="bg-qf-bg-secondary/80 rounded-lg p-3 text-sm text-qf-text-secondary mb-4 border border-qf-border-secondary">
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
                ? "bg-qf-gradient-primary text-white"
                : "text-white border-qf-border-primary hover:border-qf-border-accent"
            }
          >
            {isStuckMode ? "✓ Feeling better" : "I'm stuck → Simplify"}
          </Button>
          <Button onClick={handleStop} className="text-white border border-qf-border-primary bg-qf-bg-secondary/80 hover:border-qf-border-accent">
            Stop & Save
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
