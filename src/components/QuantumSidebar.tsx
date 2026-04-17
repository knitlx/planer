"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Folder,
  Archive,
  CheckSquare,
  Lightbulb,
  Bot,
  Plus,
  Menu,
  Timer,
  Repeat,
  Bell,
  LogOut,
  Activity,
  Target,
  ChevronDown,
} from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";

const MAIN_NAV_ITEMS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/agent", label: "AI Агент", icon: Bot },
  { href: "/projects", label: "Проекты", icon: Folder },
  { href: "/tasks", label: "Задачи", icon: CheckSquare },
  { href: "/routines", label: "Привычки", icon: Repeat },
];

const EXTRA_NAV_ITEMS = [
  { href: "/radar", label: "Радар", icon: Activity },
  { href: "/review", label: "Обзор", icon: Target },
  { href: "/reminders", label: "Напоминания", icon: Bell },
  { href: "/ideas", label: "Идеи", icon: Lightbulb },
  { href: "/archive", label: "Архив", icon: Archive },
];

function isActive(path: string, pathname: string) {
  if (path === "/") return pathname === "/";
  return pathname.startsWith(path);
}

export function QuantumSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCollectOpen, setQuickCollectOpen] = useState(false);
  const [quickCollectContent, setQuickCollectContent] = useState("");
  const [isSubmittingQuickCollect, setIsSubmittingQuickCollect] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);

  if (pathname === "/login") return null;

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
    if (pathname === "/") {
      window.dispatchEvent(new Event("quick-focus:open"));
      return;
    }
    router.push("/?quickFocus=1");
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch {
      // Silent fail
    }
  };

  const mobileLinkClass = (active: boolean) =>
    `w-full flex items-center gap-3 text-left p-3 px-4 text-sm rounded-xl transition-all ${
      active
        ? "text-qf-text-primary bg-white/6 border-l-2 border-qf-text-accent rounded-r-xl rounded-l-none -ml-4 pl-[30px]"
        : "text-qf-text-muted hover:text-qf-text-primary hover:bg-white/5"
    }`;

  const desktopLinkClass = (active: boolean) =>
    `flex items-center p-3 px-4 text-sm transition-all ${
      active
        ? "text-qf-text-primary bg-white/6 font-semibold border-l-2 border-qf-text-accent rounded-r-xl rounded-l-none -ml-4 pl-[30px]"
        : "text-qf-text-muted hover:text-qf-text-primary hover:bg-white/5 rounded-xl"
    }`;

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-20 px-4 py-3 pt-[max(12px,env(safe-area-inset-top))] border-b border-qf-border-secondary bg-[#0A0908]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#ffc300] border border-[#ffc300]/70">
              <span className="text-2xl font-black text-[#0A0908] font-[var(--font-unbounded)] leading-none">P</span>
            </div>
            <span className="font-semibold text-base tracking-tight font-[var(--font-unbounded)] text-qf-text-primary">
              Planer
            </span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 rounded-lg border border-qf-border-primary bg-qf-bg-secondary text-qf-text-secondary hover:text-qf-text-primary transition-colors flex items-center justify-center"
            aria-label="Открыть меню"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile menu modal */}
      <AppModal open={mobileMenuOpen} title="Меню" onClose={() => setMobileMenuOpen(false)} footer={null}>
        <div className="space-y-4">
          <div className="space-y-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, pathname);
              return (
                <button key={item.href} onClick={() => { setMobileMenuOpen(false); router.push(item.href); }} className={mobileLinkClass(active)}>
                  <Icon width={18} height={18} strokeWidth={2} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div>
            <button onClick={() => setExtraOpen(!extraOpen)} className="w-full flex items-center justify-between p-3 px-4 text-sm text-qf-text-muted hover:text-qf-text-primary transition-colors">
              <span className="flex items-center">
                <ChevronDown className={`w-3.5 h-3.5 mr-2 transition-transform ${extraOpen ? "rotate-180" : ""}`} />
                Ещё
              </span>
            </button>
            {extraOpen && (
              <div className="space-y-1 pt-1">
                {EXTRA_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, pathname);
                  return (
                    <button key={item.href} onClick={() => { setMobileMenuOpen(false); router.push(item.href); }} className={mobileLinkClass(active)}>
                      <Icon width={18} height={18} strokeWidth={2} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-qf-border-secondary">
            <button className="w-full px-4 py-2.5 rounded-xl border border-qf-border-primary text-qf-text-secondary hover:text-qf-text-primary hover:bg-white/5 transition-colors text-sm" onClick={handleNewProject}>
              <Plus className="w-4 h-4 mr-2 inline-block" />
              Новый проект
            </button>
            <button className="w-full px-4 py-2.5 rounded-xl border border-qf-border-primary text-qf-text-secondary hover:text-qf-text-primary hover:bg-white/5 transition-colors text-sm" onClick={handleQuickCollect}>
              Быстрый сбор
            </button>
            <button className="w-full px-4 py-3 rounded-xl bg-[#ffc300] text-[#0A0908] font-semibold text-sm hover:brightness-105 transition-all" onClick={handleQuickFocus}>
              Старт фокуса
            </button>
          </div>
        </div>
      </AppModal>

      {/* Quick collect modal */}
      <AppModal
        open={quickCollectOpen}
        title="Быстрый сбор"
        onClose={() => setQuickCollectOpen(false)}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setQuickCollectOpen(false)} variant="secondary" className="w-full">Отмена</Button>
            <Button onClick={() => void submitQuickCollect()} disabled={isSubmittingQuickCollect || !quickCollectContent.trim()} className="w-full">
              {isSubmittingQuickCollect ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        }
      >
        <label htmlFor="sidebar-quick-collect-textarea" className="sr-only">Текст быстрой заметки</label>
        <textarea
          id="sidebar-quick-collect-textarea"
          value={quickCollectContent}
          onChange={(event) => setQuickCollectContent(event.target.value)}
          rows={4}
          placeholder="Запишите идею, мысль или задачу..."
          className="w-full rounded-lg border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-qf-text-primary focus:outline-none focus:border-qf-border-accent resize-none"
        />
      </AppModal>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 h-screen flex-col fixed left-0 top-0 z-10 bg-[#0A0908] border-r border-qf-border-secondary pt-8 pb-4 px-4 overflow-hidden">
        <div className="px-3 mb-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-9 h-9 rounded-lg bg-[#ffc300] border border-[#ffc300]/70 flex items-center justify-center">
              <span className="text-2xl font-black text-[#0A0908] font-[var(--font-unbounded)] leading-none">P</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-qf-text-primary">Planer</h1>
          </div>
          <p className="text-[11px] text-qf-text-muted mt-2 font-medium tracking-wide px-0.5">Система управления</p>
        </div>

        <nav className="flex-1 flex flex-col overflow-y-auto min-h-0">
          <div className="space-y-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, pathname);
              return (
                <Link key={item.href} href={item.href} className={desktopLinkClass(active)}>
                  <Icon className="w-4 h-4 mr-3" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-2">
            <button onClick={() => setExtraOpen(!extraOpen)} className="w-full flex items-center justify-between p-3 px-4 text-sm text-qf-text-muted hover:text-qf-text-primary transition-colors">
              <span className="flex items-center">
                <ChevronDown className={`w-3.5 h-3.5 mr-2 transition-transform ${extraOpen ? "rotate-180" : ""}`} />
                Ещё
              </span>
            </button>
            {extraOpen && (
              <div className="space-y-1 pt-1 pb-2">
                {EXTRA_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, pathname);
                  return (
                    <Link key={item.href} href={item.href} className={desktopLinkClass(active)}>
                      <Icon className="w-4 h-4 mr-3" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 flex flex-col gap-2">
            <button onClick={handleQuickFocus} className="w-auto px-3.5 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-tight bg-[#ffc300] text-[#0A0908] hover:brightness-105 transition-all">
              <Timer className="w-4 h-4 text-[#0A0908]" strokeWidth={2.8} />
              Старт фокуса
            </button>
            <button onClick={handleLogout} className="w-auto px-3.5 py-2 flex items-center justify-center gap-2 rounded-xl text-xs tracking-tight text-qf-text-muted hover:text-qf-text-primary hover:bg-white/5 transition-colors" aria-label="Выйти">
              <LogOut className="w-4 h-4" strokeWidth={2} />
              Выйти
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
