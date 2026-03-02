# Quantum Flow Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Полный редизайн Focus Flow в стиле Quantum Flow с улучшенной структурой и навигацией

**Архитектура:** Обновляем глобальные стили, создаем новые компоненты в стиле Quantum Flow (фиолетовый→голубой градиент, стеклянные панели, анимации), сохраняем существующую функциональность API и базы данных.

**Технологии:** Next.js 16, TypeScript, Tailwind CSS, Prisma 7.4.1, Zustand

---

## Task 1: Обновление глобальных стилей

**Файлы:**
- Modify: `src/app/globals.css`
- Create: `src/lib/quantum-theme.ts`

**Шаг 1: Создаем тему Quantum Flow**

**Шаг 2: Обновляем globals.css с Quantum Flow стилями**

**Шаг 3: Проверяем стили**

```bash
cd /Users/knitlx/projects/Planer && npm run dev
```

**Шаг 4: Коммит**

```bash
git add src/app/globals.css src/lib/quantum-theme.ts
git commit -m "feat: add Quantum Flow theme and global styles"
```

---

## Task 2: Новый компонент Navigation (Quantum Sidebar)

**Файлы:**
- Modify: `src/components/Navigation.tsx`
- Create: `src/components/QuantumSidebar.tsx`

**Шаг 1: Создаем QuantumSidebar компонент**

**Шаг 2: Обновляем основной Navigation компонент**

**Шаг 3: Проверяем компонент**

```bash
cd /Users/knitlx/projects/Planer && npm run dev
```

**Шаг 4: Коммит**

```bash
git add src/components/Navigation.tsx src/components/QuantumSidebar.tsx
git commit -m "feat: add Quantum Flow sidebar navigation"
```

---

## Task 3: Обновление главной страницы

**Файлы:**
- Modify: `src/app/page.tsx`
- Create: `src/components/QuantumWidgets.tsx`
- Create: `src/components/ProjectGrid.tsx`

**Шаг 1: Создаем компонент виджетов**

**Шаг 2: Создаем компонент сетки проектов**

**Шаг 3: Обновляем главную страницу**

**Шаг 4: Проверяем страницу**

```bash
cd /Users/knitlx/projects/Planer && npm run dev
```

**Шаг 5: Коммит**

```bash
git add src/app/page.tsx src/components/QuantumWidgets.tsx src/components/ProjectGrid.tsx
git commit -m "feat: update homepage with Quantum Flow widgets and project grid"
```

---

## Task 4: Обновление страницы проекта

**Файлы:**
- Modify: `src/app/focus/[projectId]/page.tsx`
- Create: `src/components/ProjectHeader.tsx`
- Create: `src/components/TaskBoard.tsx`

**Шаг 1: Создаем хедер проекта**

**Шаг 2: Создаем доску задач (Kanban)**

**Шаг 3: Обновляем страницу проекта**

**Шаг 4: Проверяем страницу**

```bash
cd /Users/knitlx/projects/Planer && npm run dev
```

**Шаг 5: Коммит**

```bash
git add src/app/focus/[projectId]/page.tsx src/components/ProjectHeader.tsx src/components/TaskBoard.tsx
git commit -m "feat: update project page with Quantum Flow design"
```

---

## Task 5: Обновление QuickCollect

**Файлы:**
- Modify: `src/components/QuickCollect.tsx`

**Шаг 1: Обновляем QuickCollect в стиле Quantum Flow**

**Шаг 2: Проверяем компонент**

**Шаг 3: Коммит**

```bash
git add src/components/QuickCollect.tsx
git commit -m "feat: update QuickCollect with Quantum Flow design"
```

---

## Task 6: Исправление TypeScript ошибок

**Файлы:**
- Modify: `src/services/ProjectService.ts`
- Modify: `src/store/useProjectStore.ts`
- Modify: `src/lib/prisma.ts`

**Шаг 1: Исправляем типы в ProjectService**

**Шаг 2: Обновляем store для новой структуры**

**Шаг 3: Проверяем TypeScript**

```bash
cd /Users/knitlx/projects/Planer && npx tsc --noEmit
```

**Шаг 4: Коммит**

```bash
git add src/services/ProjectService.ts src/store/useProjectStore.ts src/lib/prisma.ts
git commit -m "fix: resolve TypeScript errors for Quantum Flow redesign"
```

---

## Task 7: Финальная проверка и тестирование

**Шаг 1: Запускаем сервер**

```bash
cd /Users/knitlx/projects/Planer && npm run dev
```

**Шаг 2: Проверяем все страницы:**
- Главная: http://localhost:3000
- Страница проекта: http://localhost:3000/focus/[projectId]
- Навигация между страницами
- QuickCollect работает

**Шаг 3: Проверяем API endpoints**

```bash
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/debug
```

**Шаг 4: Финальный коммит**

```bash
git add .
git commit -m "feat: complete Quantum Flow redesign implementation"
```

---

**План завершен и сохранен в `docs/plans/2026-03-02-quantum-flow-redesign.md`**

**Два варианта выполнения:**

1. **Subagent-Driven (эта сессия)** — я запускаю свежий subagent для каждой задачи, проверяю между задачами, быстрая итерация

2. **Parallel Session (отдельная)** — открываем новую сессию с executing-plans, пакетное выполнение с контрольными точками

**Какой подход предпочитаете?**