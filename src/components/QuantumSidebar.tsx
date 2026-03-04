"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Folder,
  CheckSquare,
  Lightbulb,
  Plus,
  Zap,
  User,
  Moon,
  Sparkles,
  ChevronRight,
  Loader2,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/useProjectStore";
import {
  quantumGradientClasses,
  quantumNavigationClasses,
  getStatusByProgress,
} from "@/lib/quantum-theme";
import { AppModal } from "@/components/AppModal";

export function QuantumSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCollectOpen, setQuickCollectOpen] = useState(false);
  const [quickCollectContent, setQuickCollectContent] = useState("");
  const [isSubmittingQuickCollect, setIsSubmittingQuickCollect] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const handler = () => setQuickCollectOpen(true);
    window.addEventListener("quick-collect:open", handler);
    return () => window.removeEventListener("quick-collect:open", handler);
  }, []);

  const handleNewProject = () => {
    setMobileMenuOpen(false);
    router.push("/focus/new");
  };

  const handleQuickCollect = () => {
    setMobileMenuOpen(false);
    setQuickCollectOpen(true);
  };

  const submitQuickCollect = async () => {
    if (!quickCollectContent.trim()) return;
    setIsSubmittingQuickCollect(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: quickCollectContent.trim(), source: "Web" }),
      });
      if (!response.ok) throw new Error("Не удалось сохранить");
      setQuickCollectContent("");
      setQuickCollectOpen(false);
    } finally {
      setIsSubmittingQuickCollect(false);
    }
  };

  const handleQuickFocus = () => {
    setMobileMenuOpen(false);
    router.push("/focus");
  };

  const navItems = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/projects", label: "Проекты", icon: Folder },
    { href: "/tasks", label: "Задачи", icon: CheckSquare },
    { href: "/ideas", label: "Идеи", icon: Lightbulb },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const getProjectDotColor = (progress: number) => {
    if (progress >= 75) return "bg-cyan-400";
    if (progress >= 45) return "bg-purple-400";
    if (progress >= 15) return "bg-green-400";
    return "bg-qf-text-muted";
  };

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-20 px-4 py-3 border-b border-quantum bg-qf-bg-glass backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-qf-gradient-primary">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className={`font-semibold text-base ${quantumGradientClasses.text}`}>
              Focus Flow
            </span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 rounded-lg border border-qf-border-primary bg-qf-bg-secondary text-qf-text-secondary hover:text-white transition-colors flex items-center justify-center"
            aria-label="Открыть меню"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <AppModal
        open={mobileMenuOpen}
        title="Меню"
        onClose={() => setMobileMenuOpen(false)}
        footer={null}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push(item.href);
                  }}
                  className={`w-full ${quantumNavigationClasses.link.base} ${
                    active
                      ? quantumNavigationClasses.link.active
                      : quantumNavigationClasses.link.inactive
                  }`}
                >
                  <Icon width={18} height={18} strokeWidth={2} />
                  {item.label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-qf-border-secondary">
            <Button
              className={`w-full ${quantumNavigationClasses.button.primary}`}
              size="sm"
              onClick={handleNewProject}
            >
              <Plus className="w-4 h-4 mr-2" />
              Новый проект
            </Button>
            <Button
              className={`w-full ${quantumNavigationClasses.button.secondary}`}
              variant="outline"
              size="sm"
              onClick={handleQuickCollect}
            >
              <Zap className="w-4 h-4 mr-2" />
              Быстрый сбор
            </Button>
          </div>
        </div>
      </AppModal>

      <AppModal
        open={quickCollectOpen}
        title="Быстрый сбор"
        onClose={() => setQuickCollectOpen(false)}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setQuickCollectOpen(false)}
              className="px-4 py-2 rounded-lg border border-qf-border-primary text-qf-text-secondary hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={() => void submitQuickCollect()}
              disabled={isSubmittingQuickCollect || !quickCollectContent.trim()}
              className="px-4 py-2 rounded-lg bg-qf-gradient-primary text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {isSubmittingQuickCollect ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        }
      >
        <textarea
          value={quickCollectContent}
          onChange={(event) => setQuickCollectContent(event.target.value)}
          rows={4}
          placeholder="Запишите идею, мысль или задачу..."
          className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-white focus:outline-none focus:border-qf-border-accent resize-none"
        />
      </AppModal>

      <aside className="hidden lg:flex w-64 h-screen flex-col fixed left-0 top-0 z-10 quantum-glass border-r border-quantum">
        <div className="p-6 border-b border-[rgba(138,43,226,0.35)]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-10 h-10 rounded-xl bg-qf-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">FOCUS FLOW</h1>
              <p className="text-xs text-qf-text-muted">QUANTUM EDITION</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="mb-8">
              <h3 className="text-xs uppercase tracking-wider text-[rgba(255,255,255,0.42)] font-bold mb-3 px-2">НАВИГАЦИЯ</h3>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-item text-base ${active ? "quantum-active text-white font-medium bg-[rgba(138,43,226,0.2)]" : "text-[rgba(255,255,255,0.82)] hover:bg-[rgba(138,43,226,0.1)] hover:text-white"}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs uppercase tracking-wider text-[rgba(255,255,255,0.42)] font-bold">ПРОЕКТЫ</h3>
              <button onClick={handleNewProject} className="text-xs text-cyan-400 hover:text-cyan-300">+ Новый</button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-qf-text-muted" />
              </div>
            ) : error ? (
              <div className="px-3 py-2 text-sm text-red-500">Ошибка загрузки</div>
            ) : (
              <div className="space-y-1">
                {projects.slice(0, 5).map((project) => (
                  <Link key={project.id} href={`/focus/${project.id}`} className="sidebar-item text-[rgba(255,255,255,0.84)] hover:bg-[rgba(138,43,226,0.1)] hover:text-white">
                    <span
                      className={`w-2 h-2 rounded-full ${getProjectDotColor(project.progress)}`}
                    />
                    <span className="truncate flex-1">{project.name}</span>
                    <span className="text-xs text-[rgba(255,255,255,0.5)]">{project.progress}%</span>
                  </Link>
                ))}
                {projects.length === 0 && <div className="px-3 py-2 text-sm text-qf-text-muted">Нет проектов</div>}
              </div>
            )}
          </div>

          <div className="p-2 mt-auto">
            <button
              onClick={handleQuickCollect}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-black font-bold text-sm hover:opacity-90 transition-all mb-3"
            >
              Быстрый сбор
            </button>
            <button
              onClick={handleQuickFocus}
              className="w-full py-2 rounded-lg border border-[rgba(138,43,226,0.35)] text-sm hover:bg-[rgba(138,43,226,0.1)] transition-colors text-[rgba(255,255,255,0.86)] hover:text-white"
            >
              Старт фокус-сессии
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-[rgba(138,43,226,0.35)]">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(138,43,226,0.1)] transition-colors">
            <div className="w-8 h-8 rounded-full bg-qf-gradient-primary flex items-center justify-center text-xs font-bold">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-white">Пользователь</div>
              <div className="text-xs text-qf-text-muted flex items-center gap-1">
                <Moon className="w-3 h-3" />
                Активный режим
              </div>
            </div>
            <div className="text-xs bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded">⌘K</div>
          </div>
        </div>
      </aside>
    </>
  );
}
