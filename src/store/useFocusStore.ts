import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FocusState {
  currentProjectId: string | null;
  currentTaskId: string | null;
  sessionStartTime: number | null;
  timerElapsed: number;
  sessionDuration: number;

  startFocus: (projectId: string) => void;
  startTask: (taskId: string) => void;
  stopFocus: () => void;
  updateTimer: (elapsed: number) => void;
  setSessionDuration: (duration: number) => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set) => ({
      currentProjectId: null,
      currentTaskId: null,
      sessionStartTime: null,
      timerElapsed: 0,
      sessionDuration: 0,

      startFocus: (projectId) =>
        set({
          currentProjectId: projectId,
          sessionStartTime: Date.now(),
        }),

      startTask: (taskId) => set({ currentTaskId: taskId }),

      stopFocus: () =>
        set({
          currentProjectId: null,
          currentTaskId: null,
          sessionStartTime: null,
          timerElapsed: 0,
          sessionDuration: 0,
        }),

      updateTimer: (elapsed) => set({ timerElapsed: elapsed }),
      setSessionDuration: (duration) => set({ sessionDuration: duration }),
    }),
    {
      name: "focus-flow-storage",
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        currentTaskId: state.currentTaskId,
        sessionStartTime: state.sessionStartTime,
        timerElapsed: state.timerElapsed,
        sessionDuration: state.sessionDuration,
      }),
    },
  ),
);
