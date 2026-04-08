"use client";

import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type FocusSession = {
  id: string;
  projectId: string;
  taskId?: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  note?: string;
  project: { name: string };
};

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}с`;
  if (sec < 3600) return `${Math.floor(sec / 60)}м`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}ч ${m}м`;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="card p-4 flex flex-col">
      <span className="text-xs text-qf-text-muted uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold mt-1 ${accent || "text-qf-text-primary"}`}>{value}</span>
      {sub && <span className="text-xs text-qf-text-secondary mt-0.5">{sub}</span>}
    </div>
  );
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function ReviewPage() {
  const { projects, fetchProjects, isLoading } = useProjectStore();
  const [initialized, setInitialized] = useState(false);
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  useEffect(() => {
    const init = async () => {
      await fetchProjects();
      const res = await fetch("/api/focus-sessions?days=7");
      if (res.ok) setSessions(await res.json());
      setInitialized(true);
    };
    void init();
  }, [fetchProjects]);

  if (isLoading || !initialized)
    return <div className="min-h-screen flex items-center justify-center text-qf-text-secondary">Загрузка...</div>;

  // --- Stats ---
  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const doneProjects = projects.filter((p) => p.progress >= 100);
  const inProgressProjects = projects.filter((p) => p.progress > 0 && p.progress < 100);
  const notStartedProjects = projects.filter((p) => p.progress === 0 && p.status !== "DONE");
  const staleProjects = projects.filter((p) => {
    if (p.status === "DONE" || p.status === "INCUBATOR") return false;
    const days = p.lastActive ? daysAgo(new Date(p.lastActive).toISOString()) : 999;
    return days >= 3;
  });
  const totalFocusSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);
  const totalFocusSessions = sessions.length;
  const avgSessionSec = totalFocusSessions > 0 ? Math.round(totalFocusSec / totalFocusSessions) : 0;

  // --- Recommendations ---
  const recommendations: { type: "warning" | "success" | "info"; text: string; href?: string }[] = [];

  for (const p of staleProjects) {
    const days = p.lastActive ? daysAgo(new Date(p.lastActive).toISOString()) : 0;
    recommendations.push({
      type: "warning",
      text: `«${p.name}» — без активности ${days} дн. Завершить или на паузу?`,
      href: `/focus/${p.id}`,
    });
  }

  for (const p of activeProjects) {
    if (p.status === "FINAL_STRETCH") {
      recommendations.push({
        type: "success",
        text: `«${p.name}» — на финишной прямой. Добить!`,
        href: `/focus/${p.id}`,
      });
    }
    if (p.deadline) {
      const daysLeft = Math.floor((new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3 && daysLeft >= 0) {
        recommendations.push({
          type: "warning",
          text: `«${p.name}» — дедлайн через ${daysLeft} дн.`,
          href: `/focus/${p.id}`,
        });
      }
    }
  }

  for (const p of notStartedProjects) {
    recommendations.push({
      type: "info",
      text: `«${p.name}» — ещё не начат. Когда планируете начать?`,
      href: `/focus/${p.id}`,
    });
  }

  // --- Habits this week ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  // --- Focus sessions this week by project ---
  const sessionsByProject: Record<string, { totalSec: number; count: number; name: string }> = {};
  for (const s of sessions) {
    if (!sessionsByProject[s.projectId]) {
      sessionsByProject[s.projectId] = { totalSec: 0, count: 0, name: s.project.name };
    }
    sessionsByProject[s.projectId].totalSec += s.durationSec;
    sessionsByProject[s.projectId].count += 1;
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-qf-text-primary">Обзор прогресса</h1>
          <p className="text-qf-text-secondary mt-1">Статистика и рекомендации</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Активных" value={activeProjects.length} sub={`из ${projects.length} всего`} />
          <StatCard label="Фокус за неделю" value={formatDuration(totalFocusSec)} sub={`${totalFocusSessions} сессий`} accent="text-qf-text-accent" />
          <StatCard label="Ср. сессия" value={formatDuration(avgSessionSec)} />
          <StatCard label="Завершённые" value={doneProjects.length} sub="проектов" />
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="card p-4 md:p-6">
            <h2 className="text-lg font-semibold text-qf-text-primary mb-3">Рекомендации</h2>
            <div className="space-y-2">
              {recommendations.map((r, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm ${
                  r.type === "warning" ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-200" :
                  r.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-200" :
                  "bg-qf-bg-secondary border border-qf-border-secondary text-qf-text-secondary"
                }`}>
                  {r.href ? (
                    <Link href={r.href} className="hover:underline">{r.text}</Link>
                  ) : (
                    <span>{r.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active projects with progress */}
        {inProgressProjects.length > 0 && (
          <div className="card p-4 md:p-6">
            <h2 className="text-lg font-semibold text-qf-text-primary mb-3">В работе</h2>
            <div className="space-y-3">
              {inProgressProjects.map((project) => (
                <div key={project.id} className="flex items-center gap-4 p-3 bg-qf-bg-secondary/70 border border-qf-border-secondary rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-qf-text-primary break-words">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-2 rounded-full bg-qf-bg-tertiary overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#ffc300] to-[#ff5f33]" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-sm font-medium text-qf-text-secondary shrink-0">{project.progress}%</span>
                    </div>
                  </div>
                  <Link href={`/focus/${project.id}`}>
                    <Button size="sm" variant="outline" className="shrink-0">Открыть</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not started */}
        {notStartedProjects.length > 0 && (
          <div className="card p-4 md:p-6">
            <h2 className="text-lg font-semibold text-qf-text-primary mb-3">Не начатые</h2>
            <div className="space-y-2">
              {notStartedProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 text-qf-text-muted">
                  <span>{project.name}</span>
                  <Link href={`/focus/${project.id}`}>
                    <Button size="sm" variant="ghost" className="text-xs">Начать</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Focus sessions by project */}
        {Object.keys(sessionsByProject).length > 0 && (
          <div className="card p-4 md:p-6">
            <h2 className="text-lg font-semibold text-qf-text-primary mb-3">Фокус-сессии за неделю</h2>
            <div className="space-y-2">
              {Object.entries(sessionsByProject)
                .sort(([, a], [, b]) => b.totalSec - a.totalSec)
                .map(([id, data]) => (
                  <div key={id} className="flex items-center justify-between p-3 bg-qf-bg-secondary/50 rounded-lg">
                    <div>
                      <span className="text-sm text-qf-text-primary">{data.name}</span>
                      <span className="text-xs text-qf-text-muted ml-2">{data.count} × {formatDuration(data.totalSec)}</span>
                    </div>
                    <Link href={`/focus/${id}`}>
                      <Button size="sm" variant="ghost" className="text-xs">Открыть</Button>
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Stale projects */}
        {staleProjects.length > 0 && (
          <div className="card p-4 md:p-6 border border-qf-border-primary">
            <h2 className="text-lg font-semibold text-qf-text-accent mb-3">Без активности</h2>
            <div className="space-y-2">
              {staleProjects.map((project) => {
                const days = project.lastActive ? daysAgo(new Date(project.lastActive).toISOString()) : 0;
                return (
                  <div key={project.id} className="flex items-center justify-between p-3 text-qf-text-muted">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <svg className="w-4 h-4 text-qf-text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="break-words min-w-0">{project.name}</span>
                      <span className="text-xs shrink-0">{days} дн.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {projects.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-qf-text-muted">Нет проектов для обзора</p>
          </div>
        )}

        <Link href="/" className="block">
          <Button variant="outline" className="w-full">На главную</Button>
        </Link>
      </div>
    </div>
  );
}
