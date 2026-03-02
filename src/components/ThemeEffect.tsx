"use client";

import { useEffect, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";

export function ThemeEffect() {
  const { resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const body = document.body;

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.style.setProperty("--bg", "#0f172a");
      root.style.setProperty("--bg-secondary", "#1e293b");
      root.style.setProperty("--bg-card", "#1e293b");
      root.style.setProperty("--bg-hover", "#334155");
      root.style.setProperty("--text", "#f8fafc");
      root.style.setProperty("--text-secondary", "#cbd5e1");
      root.style.setProperty("--text-muted", "#94a3b8");
      root.style.setProperty("--border", "#334155");
    } else {
      root.classList.remove("dark");
      root.style.setProperty("--bg", "#ffffff");
      root.style.setProperty("--bg-secondary", "#f8fafc");
      root.style.setProperty("--bg-card", "#ffffff");
      root.style.setProperty("--bg-hover", "#f1f5f9");
      root.style.setProperty("--text", "#0f172a");
      root.style.setProperty("--text-secondary", "#475569");
      root.style.setProperty("--text-muted", "#64748b");
      root.style.setProperty("--border", "#e2e8f0");
    }
  }, [resolvedTheme, mounted]);

  return null;
}
