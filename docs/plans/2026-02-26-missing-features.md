# Focus Flow OS - Missing Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add Stuck Logic, Mobile Responsive improvements, Optimistic UI, and fix remaining issues

**Architecture:** Next.js 16 + Prisma + Zustand + Tailwind v4

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Zustand

---

## Task 1: Stuck Logic (Я застряла)

**Files:**
- Modify: `src/components/TheFocusRoom.tsx`
- Modify: `src/services/TaskService.ts`
- Modify: `src/app/api/tasks/route.ts`

**Goal:** When user clicks "Я застряла" in Focus Room, create 3 micro-tasks and set first as nextStep

**Step 1: Add simplifyTaskToMicroSteps method to TaskService**

```typescript
// In TaskService.ts, add:
static async simplifyToMicroSteps(taskId: string): Promise<Task[]> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  const microStepTitles = this.generateMicroSteps(task.title);
  
  const result = await prisma.$transaction(async (tx) => {
    // Mark original task as cancelled
    await tx.task.update({
      where: { id: taskId },
      data: { status: 'CANCELLED' }
    });

    // Create 3 micro tasks
    const microTasks = await Promise.all(
      microStepTitles.map((title, index) =>
        tx.task.create({
          data: {
            projectId: task.projectId,
            title: `Микро-шаг: ${title}`,
            type: 'ACTION',
            status: 'TODO',
            isNextStep: index === 0, // First one is next step
            order: index,
            contextSummary: `Из: "${task.title}"`,
          }
        })
      )
    );

    return microTasks;
  });

  return result;
}
```

**Step 2: Add API endpoint for simplify**

```typescript
// src/app/api/tasks/[id]/simplify/route.ts
import { NextResponse } from 'next/server';
import { TaskService } from '@/services/TaskService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const tasks = await TaskService.simplifyToMicroSteps(id);
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Step 3: Update TheFocusRoom.tsx button handler**

```typescript
const handleStuck = async () => {
  if (!currentTask) return;
  
  try {
    const res = await fetch(`/api/tasks/${currentTask.id}/simplify`, {
      method: 'POST',
    });
    
    if (res.ok) {
      const newTasks = await res.json();
      toast.success('Задача разделена на микро-шаги!');
      // Refresh project data
      const projectRes = await fetch(`/api/projects/${currentProjectId}`);
      const projectData = await projectRes.json();
      setProject(projectData);
      // Set first new task as current
      if (newTasks.length > 0) {
        setCurrentTask(newTasks[0]);
      }
    }
  } catch (error) {
    toast.error('Ошибка при разбиении задачи');
  }
};

// Button:
<button onClick={handleStuck} className="hover:text-blue-400 transition-colors">
  Я застряла
</button>
```

**Step 4: Commit**
```bash
git add src/services/TaskService.ts src/app/api/tasks/\[id\]/simplify/route.ts src/components/TheFocusRoom.tsx
git commit -m "feat: add Stuck Logic - split stuck tasks into micro-steps"
```

---

## Task 2: Optimistic UI for Tasks

**Files:**
- Modify: `src/store/useProjectStore.ts`
- Modify: `src/components/TaskList.tsx` (create if not exists)

**Goal:** Tasks disappear instantly when marked as done

**Step 1: Add optimistic update to store**

```typescript
// In useProjectStore.ts, add optimisticTaskUpdate method:
optimisticTaskUpdate: async (taskId: string, status: TaskStatus) => {
  // Optimistically update local state
  set(state => ({
    projects: state.projects.map(p => ({
      ...p,
      tasks: p.tasks?.map(t => 
        t.id === taskId ? { ...t, status } : t
      )
    }))
  }));
  
  // Then make API call
  try {
    await fetch(`/api/tasks/${taskId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    // Refresh to get actual server state
    await get().fetchProjects();
  } catch (error) {
    // Revert on error
    await get().fetchProjects();
    throw error;
  }
}
```

**Step 2: Create TaskList component**

```typescript
// src/components/TaskList.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '@/store/useProjectStore';
import { Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface TaskListProps {
  projectId: string;
}

export function TaskList({ projectId }: TaskListProps) {
  const { projects, optimisticTaskUpdate } = useProjectStore();
  const project = projects.find(p => p.id === projectId);
  const tasks = project?.tasks || [];

  const handleToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    
    // Optimistic update
    await optimisticTaskUpdate(taskId, newStatus as any);
    toast.success(newStatus === 'DONE' ? 'Выполнено!' : 'Вернули в список');
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {tasks.map(task => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={`flex items-center gap-3 p-4 bg-white rounded-xl border ${
              task.status === 'DONE' ? 'border-green-200 bg-green-50' : 'border-slate-200'
            }`}
          >
            <button
              onClick={() => handleToggle(task.id, task.status)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.status === 'DONE' 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-slate-300 hover:border-green-400'
              }`}
            >
              {task.status === 'DONE' && <Check className="w-4 h-4 text-white" />}
            </button>
            
            <div className="flex-1">
              <p className={`font-medium ${task.status === 'DONE' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {task.title}
              </p>
              {task.isNextStep && (
                <span className="text-xs text-blue-600 font-semibold">Следующий шаг</span>
              )}
            </div>
            
            {task.type === 'SESSION' && (
              <Clock className="w-4 h-4 text-slate-400" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

**Step 3: Commit**
```bash
git add src/store/useProjectStore.ts src/components/TaskList.tsx
git commit -m "feat: add Optimistic UI for task completion"
```

---

## Task 3: Mobile Responsive Improvements

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/RadarCard.tsx`
- Modify: `src/app/focus/[projectId]/page.tsx`

**Goal:** Ensure proper mobile layout on all pages

**Step 1: Improve mobile grid in Dashboard**

```typescript
// In page.tsx, update grid:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```

**Step 2: Make RadarCard fully responsive**

```typescript
// In RadarCard.tsx, update container:
// Remove max-w-sm and make it full width on mobile
className="group relative w-full cursor-pointer"
```

**Step 3: Improve Focus Room mobile layout**

```typescript
// In TheFocusRoom.tsx:
// Make text smaller on mobile
<h2 className="text-2xl sm:text-4xl md:text-6xl font-bold">
// Make timer smaller on mobile  
<div className="text-4xl sm:text-7xl font-mono font-bold text-blue-400">
```

**Step 4: Commit**
```bash
git add src/app/page.tsx src/components/RadarCard.tsx src/components/TheFocusRoom.tsx
git commit -m "feat: improve mobile responsive layout"
```

---

## Task 4: Ctrl+K Hotkey for QuickCollect

**Files:**
- Modify: `src/components/QuickCollect.tsx`
- Modify: `src/app/layout.tsx`

**Goal:** Make QuickCollect open with Ctrl+K globally

**Step 1: Add global keyboard listener**

The hotkey is already implemented with `react-hotkeys-hook`. Verify it's working:

```typescript
// In QuickCollect.tsx:
useHotkeys('ctrl+k, meta+k', () => setInputVisible(true));
```

**Step 2: Add visual hint in UI**

```typescript
// Add to Dashboard header or footer:
<div className="text-xs text-slate-400 mt-4">
  Нажмите <kbd className="px-2 py-1 bg-slate-200 rounded">Ctrl+K</kbd> для быстрой заметки
</div>
```

**Step 3: Commit**
```bash
git add src/components/QuickCollect.tsx
git commit -m "feat: add Ctrl+K hotkey hint for QuickCollect"
```

---

## Task 5: Review Page Improvements

**Files:**
- Modify: `src/app/review/page.tsx`

**Goal:** Add filters (All projects, Hot, Low energy) as specified in TD

**Step 1: Add filter state and UI**

```typescript
const [filter, setFilter] = useState<'all' | 'hot' | 'low'>('all');

const filteredProjects = projects.filter(p => {
  if (filter === 'hot') return p.progress >= 50 && p.progress < 100;
  if (filter === 'low') return p.friction > 70;
  return true;
});
```

**Step 2: Add filter buttons**

```tsx
<div className="flex gap-2 mb-6">
  <Button 
    variant={filter === 'all' ? 'default' : 'outline'}
    onClick={() => setFilter('all')}
  >
    Все проекты
  </Button>
  <Button 
    variant={filter === 'hot' ? 'default' : 'outline'}
    onClick={() => setFilter('hot')}
  >
    🔥 Горящие
  </Button>
  <Button 
    variant={filter === 'low' ? 'default' : 'outline'}
    onClick={() => setFilter('low')}
  >
    😴 Мало сил
  </Button>
</div>
```

**Step 3: Commit**
```bash
git add src/app/review/page.tsx
git commit -m "feat: add filters to Review page"
```

---

## Task 6: Better Empty States

**Files:**
- Modify: `src/components/EmptyState.tsx`

**Goal:** Add two empty states - one for no projects, one for no ideas

**Step 1: Update EmptyState to show different content based on context**

```typescript
// Add prop to EmptyState
export function EmptyState({ type = 'projects' }: { type?: 'projects' | 'ideas' }) {
  if (type === 'ideas') {
    return (
      <div className="text-center py-12">
        <Lightbulb className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Инбокс пуст</h3>
        <p className="text-slate-500 mt-2">Добавьте идею через Ctrl+K или Telegram бота</p>
      </div>
    );
  }
  
  // Existing projects empty state
  // ...
}
```

**Step 2: Commit**
```bash
git add src/components/EmptyState.tsx
git commit -m "feat: improve empty states for projects and ideas"
```

---

## Summary

This plan adds:
1. ✅ Stuck Logic (split stuck tasks)
2. ✅ Optimistic UI (instant task updates)
3. ✅ Mobile Responsive fixes
4. ✅ Ctrl+K hotkey hint
5. ✅ Review page filters
6. ✅ Better empty states

**Execute with:** Subagent-Driven Development
