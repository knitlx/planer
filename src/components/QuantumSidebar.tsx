"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/useProjectStore";
import {
  quantumGradientClasses,
  quantumNavigationClasses,
  getStatusByProgress,
} from "@/lib/quantum-theme";

export function QuantumSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, []);

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

  return (
    <aside className="hidden lg:flex h-full w-64 flex-col p-6 shrink-0 z-10 fixed left-0 top-0 bottom-0 backdrop-blur-lg bg-qf-bg-glass border-r border-qf-border-glass">
      {/* Логотип с градиентом */}
      <div
        className="flex items-center gap-3 mb-10 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-qf-gradient-primary">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1
            className={`font-bold text-lg leading-tight ${quantumGradientClasses.text}`}
          >
            Focus Flow
          </h1>
          <p className="text-xs text-qf-text-muted">Quantum Edition</p>
        </div>
      </div>

      {/* Основная навигация */}
      <nav className="flex-1">
        <div className="mb-8">
          <h2 className={quantumNavigationClasses.section.title}>Навигация</h2>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${quantumNavigationClasses.link.base} ${
                      active
                        ? quantumNavigationClasses.link.active
                        : quantumNavigationClasses.link.inactive
                    }`}
                  >
                    <Icon width={18} height={18} strokeWidth={2} />
                    {item.label}
                    {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Быстрые действия */}
        <div className="mb-8">
          <h2 className={quantumNavigationClasses.section.title}>
            Быстрые действия
          </h2>
          <div className="space-y-2">
            <Button
              className={`w-full ${quantumNavigationClasses.button.primary}`}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Новый проект
            </Button>
            <Button
              className={`w-full ${quantumNavigationClasses.button.secondary}`}
              variant="outline"
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Быстрый сбор
            </Button>
          </div>
        </div>

        {/* Проекты */}
        <div>
          <h2 className={quantumNavigationClasses.section.title}>Проекты</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-qf-text-muted" />
            </div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-red-500">
              Ошибка загрузки
            </div>
          ) : (
            <ul className="space-y-1">
              {projects.slice(0, 5).map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/focus/${project.id}`}
                    className={`${quantumNavigationClasses.project.base} text-qf-text-secondary hover:text-white`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`${quantumNavigationClasses.project.dot} ${
                          quantumNavigationClasses.status[getStatusByProgress(project.progress)]
                        }`}
                      ></span>
                      <span className="truncate">{project.name}</span>
                    </span>
                    <span className={quantumNavigationClasses.project.progress}>
                      {project.progress}%
                    </span>
                  </Link>
                </li>
              ))}
              {projects.length === 0 && (
                <li className="px-3 py-2 text-sm text-qf-text-muted">
                  Нет проектов
                </li>
              )}
            </ul>
          )}
        </div>
      </nav>

      {/* Статус пользователя */}
      <div className="mt-auto pt-6 border-t border-qf-border-primary space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-qf-gradient-primary flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Пользователь</p>
              <span className="text-[10px] text-qf-text-muted flex items-center gap-1">
                <Moon className="w-3 h-3" />
                Тёмная тема
              </span>
            </div>
          </div>
          <div className="text-[9px] bg-qf-bg-secondary text-qf-text-muted px-1.5 py-0.5 rounded border border-qf-border-primary font-mono">
            ⌘K
          </div>
        </div>
      </div>
    </aside>
  );
}
