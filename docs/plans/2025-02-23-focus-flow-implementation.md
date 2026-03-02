# Focus Flow OS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal productivity system with focus mode, dopamine loops for finishing tasks, and anti-chaos design.

**Architecture:** Next.js 14 (App Router) + Prisma ORM + SQLite (local) + Zustand state management + Telegram bot integration.

**Tech Stack:** Next.js, Tailwind CSS, Shadcn/ui, Framer Motion, Zustand, Prisma, NextAuth.js, Telegram Bot API.

---

## Phase 1: Project Setup & Infrastructure

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Initialize Next.js with TypeScript**

Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`

**Step 2: Install additional dependencies**

Run: `npm install framer-motion zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns prisma @prisma/client next-auth sonner react-hotkeys-hook`

Run: `npm install -D @types/node`

**Step 3: Initialize Prisma**

Run: `npx prisma init --datasource-provider sqlite`

**Step 4: Create .env.example**

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"
```

**Step 5: Update .gitignore**

```gitignore
node_modules
.next
.env.local
.env
dist
prisma/migrations
*.db
*.db-journal
```

**Step 6: Commit**

```bash
git add package.json tsconfig.json next.config.mjs .env.example .gitignore prisma
git commit -m "feat: initialize Next.js project with dependencies"
```

---

### Task 2: Setup Tailwind CSS

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

**Step 1: Configure Tailwind**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

**Step 2: Add Tailwind config package**

Run: `npm install tailwindcss-animate`

**Step 3: Update globals.css**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}
```

**Step 4: Commit**

```bash
git add tailwind.config.ts src/app/globals.css package.json
git commit -m "style: configure Tailwind CSS with design tokens"
```

---

### Task 3: Setup Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Write complete Prisma schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Project {
  id              String        @id @default(cuid())
  userId          String?
  user            User?         @relation(fields: [userId], references: [id])
  name            String
  weight          Int           @default(5)
  friction        Int           @default(5)
  progress        Float         @default(0)
  status          ProjectStatus @default(INCUBATOR)
  lastActive      DateTime      @default(now())
  lastSessionNote String?
  tasks           Task[]
  ideas           Idea[]
  notificationLogs NotificationLog[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model Task {
  id              String    @id @default(cuid())
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title           String
  type            TaskType  @default(ACTION)
  status          TaskStatus @default(TODO)
  isNextStep      Boolean   @default(false)
  order           Int
  timerLog        String?
  contextSummary  String?
  isSimplified    Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Idea {
  id        String          @id @default(cuid())
  content   String
  source    String         @default("Web")
  projectId String?
  project   Project?       @relation(fields: [projectId], references: [id], onDelete: SetNull)
  userId    String?
  user      User?          @relation(fields: [userId], references: [id])
  processed Boolean        @default(false)
  createdAt DateTime       @default(now())
}

model NotificationLog {
  id        String   @id @default(cuid())
  type      String
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sentAt    DateTime @default(now())
  
  @@unique([type, projectId])
  @@index([type, projectId])
}

model User {
  id         String   @id @default(cuid())
  telegramId Int      @unique
  name       String?
  projects   Project[]
  ideas      Idea[]
}

enum ProjectStatus {
  INCUBATOR
  ACTIVE
  SNOOZED
  FINAL_STRETCH
}

enum TaskType {
  ACTION
  SESSION
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
  CANCELLED
}
```

**Step 2: Generate Prisma client**

Run: `npx prisma generate`

**Step 3: Create database**

Run: `npx prisma db push`

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add complete Prisma schema with all models"
```

---

### Task 4: Setup Prisma client

**Files:**
- Create: `src/lib/prisma.ts`

**Step 1: Create Prisma client singleton**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Step 2: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat: add Prisma client singleton"
```

---

## Phase 2: Core Services

### Task 5: Create ProjectService

**Files:**
- Create: `src/services/ProjectService.ts`

**Step 1: Write ProjectService with all methods**

```typescript
import { differenceInDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import type { Project, Task } from '@prisma/client';

interface FocusScoreParams {
  weight: number;
  friction: number;
  progress: number;
  daysSinceActive: number;
}

export class ProjectService {
  static calculateFocusScore(params: FocusScoreParams): number {
    const { weight, friction, progress, daysSinceActive } = params;
    
    let score = (weight * 10) + (progress * 0.3);
    
    if (progress >= 70) score += 25;
    
    if (daysSinceActive >= 3) {
      score -= daysSinceActive * 5;
    }
    
    score -= friction * 3;
    
    return Math.max(0, score);
  }

  static getDaysSinceActive(project: { updatedAt: Date }): number {
    return differenceInDays(new Date(), new Date(project.updatedAt));
  }

  static async countActiveProjects(userId?: string): Promise<number> {
    return prisma.project.count({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });
  }

  static async getClosestToFinish(userId?: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: {
        userId,
        status: 'FINAL_STRETCH',
      },
      orderBy: { progress: 'desc' },
    });
  }

  static async enrichProjects(projects: (Project & { tasks?: Task[] })[]) {
    return projects.map(project => ({
      ...project,
      focusScore: this.calculateFocusScore({
        weight: project.weight,
        friction: project.friction,
        progress: project.progress,
        daysSinceActive: this.getDaysSinceActive(project),
      }),
      daysStale: this.getDaysSinceActive(project),
    }));
  }
}
```

**Step 2: Write test for calculateFocusScore**

Create: `src/services/__tests__/ProjectService.test.ts`:

```typescript
import { ProjectService } from '../ProjectService';

describe('ProjectService', () => {
  describe('calculateFocusScore', () => {
    it('calculates base score', () => {
      const score = ProjectService.calculateFocusScore({
        weight: 5,
        friction: 5,
        progress: 50,
        daysSinceActive: 0,
      });
      expect(score).toBeGreaterThan(0);
    });

    it('adds bonus for progress >= 70%', () => {
      const score70 = ProjectService.calculateFocusScore({
        weight: 5,
        friction: 5,
        progress: 70,
        daysSinceActive: 0,
      });
      const score69 = ProjectService.calculateFocusScore({
        weight: 5,
        friction: 5,
        progress: 69,
        daysSinceActive: 0,
      });
      expect(score70).toBeGreaterThan(score69 + 20);
    });

    it('penalizes for stagnation', () => {
      const scoreStale = ProjectService.calculateFocusScore({
        weight: 5,
        friction: 5,
        progress: 50,
        daysSinceActive: 5,
      });
      const scoreFresh = ProjectService.calculateFocusScore({
        weight: 5,
        friction: 5,
        progress: 50,
        daysSinceActive: 0,
      });
      expect(scoreStale).toBeLessThan(scoreFresh);
    });

    it('never goes negative', () => {
      const score = ProjectService.calculateFocusScore({
        weight: 1,
        friction: 10,
        progress: 0,
        daysSinceActive: 100,
      });
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDaysSinceActive', () => {
    it('calculates days correctly', () => {
      const result = ProjectService.getDaysSinceActive({
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });
      expect(result).toBe(2);
    });
  });
});
```

**Step 3: Run tests**

Run: `npm test -- src/services/__tests__/ProjectService.test.ts`

**Step 4: Commit**

```bash
git add src/services/ProjectService.ts src/services/__tests__/ProjectService.test.ts
git commit -m "feat: add ProjectService with Focus Score calculation and tests"
```

---

### Task 6: Create TaskService

**Files:**
- Create: `src/services/TaskService.ts`

**Step 1: Write TaskService**

```typescript
import { prisma } from '@/lib/prisma';
import type { Task } from '@prisma/client';

export class TaskService {
  static async calculateProjectProgress(
    projectId: string
  ): Promise<number> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
    });

    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    return Math.round((completedTasks / tasks.length) * 100);
  }

  static async getNextStepTask(projectId: string): Promise<Task | null> {
    return prisma.task.findFirst({
      where: { projectId, status: 'TODO', isNextStep: true },
      orderBy: { order: 'asc' },
    });
  }

  static async simplifyTask(taskId: string): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new Error('Task not found');

    const microSteps = this.generateMicroSteps(task.title);

    const simplified = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: microSteps[0],
        contextSummary: `Original: "${task.title}" - simplified from ${task.type}`,
        type: 'ACTION',
        isSimplified: true,
      },
    });

    return simplified;
  }

  private static generateMicroSteps(originalTitle: string): string[] {
    const patterns = [
      { 
        regex: /^Разработать|Implement|Build/i, 
        steps: ['Создать файл', 'Добавить базовую структуру', 'Дописать детали'] 
      },
      { 
        regex: /^Исследовать|Research|Explore/i, 
        steps: ['Открыть источник', 'Прочитать первые 5 строк', 'Заметить ключевые моменты'] 
      },
      { 
        regex: /^Разобрать|Analyze|Parse/i, 
        steps: ['Открыть документ', 'Посмотреть оглавление', 'Прочитать раздел 1'] 
      },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(originalTitle)) {
        return pattern.steps;
      }
    }

    return [
      'Просто открой файл', 
      'Посмотри на него 1 минуту', 
      'Реши, что делать дальше'
    ];
  }

  static async completeTaskWithProgress(
    taskId: string,
    contextSummary?: string,
    timerLog?: string
  ): Promise<{ task: Task; progress: number }> {
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) throw new Error('Task not found');

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'DONE',
          contextSummary,
          timerLog,
        },
      });

      const newProgress = await this.calculateProjectProgress(tx, task.projectId);

      const updatedProject = await tx.project.update({
        where: { id: task.projectId },
        data: { 
          progress: newProgress,
          updatedAt: new Date() 
        },
      });

      if (newProgress >= 70 && task.project.status !== 'FINAL_STRETCH') {
        await tx.project.update({
          where: { id: task.projectId },
          data: { status: 'FINAL_STRETCH' },
        });
      }

      return { task: updatedTask, progress: newProgress };
    });

    return result;
  }
}
```

**Step 2: Write tests**

Create: `src/services/__tests__/TaskService.test.ts`:

```typescript
import { TaskService } from '../TaskService';
import { prisma } from '@/lib/prisma';

describe('TaskService', () => {
  describe('generateMicroSteps', () => {
    it('generates steps for development tasks', () => {
      const result = TaskService['generateMicroSteps']('Разработать API');
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Создать файл');
    });

    it('generates steps for research tasks', () => {
      const result = TaskService['generateMicroSteps']('Исследовать базу данных');
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Открыть источник');
    });

    it('generates default steps for unknown patterns', () => {
      const result = TaskService['generateMicroSteps']('Random task');
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Просто открой файл');
    });
  });

  describe('calculateProjectProgress', () => {
    it('returns 0 for no tasks', async () => {
      const progress = await TaskService.calculateProjectProgress('non-existent');
      expect(progress).toBe(0);
    });
  });
});
```

**Step 3: Run tests**

Run: `npm test -- src/services/__tests__/TaskService.test.ts`

**Step 4: Commit**

```bash
git add src/services/TaskService.ts src/services/__tests__/TaskService.test.ts
git commit -m "feat: add TaskService with progress calculation and tests"
```

---

### Task 7: Create NotificationService

**Files:**
- Create: `src/services/NotificationService.ts`
- Create: `src/services/TelegramService.ts`

**Step 1: Write TelegramService**

```typescript
export class TelegramService {
  static async sendMessage(chatId: number, message: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Telegram send failed:', error);
      return false;
    }
  }
}
```

**Step 2: Write NotificationService**

```typescript
import { differenceInHours } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { ProjectService } from './ProjectService';
import { TelegramService } from './TelegramService';

interface NotificationEvent {
  type: string;
  condition: (payload: any) => Promise<boolean>;
  message: (payload: any) => string;
}

const NOTIFICATION_EVENTS: NotificationEvent[] = [
  {
    type: 'CLOSER',
    condition: async (payload: { project: any }) => {
      const { project } = payload;
      if (project.status !== 'FINAL_STRETCH') return false;
      const hoursSinceActive = differenceInHours(new Date(), new Date(project.updatedAt));
      return hoursSinceActive >= 24;
    },
    message: (payload) => 
      `🏁 В проекте "${payload.project.name}" осталось всего чуть-чуть до 100%. Заскочим на 15 минут, чтобы закрыть его навсегда?`,
  },
  {
    type: 'GUARD',
    condition: async (payload: { activeProjectsCount: number }) => {
      return payload.activeProjectsCount >= 3;
    },
    message: () => 
      `🛡️ У тебя уже 3 проекта в фокусе. Чтобы добавить этот, давай выберем, какой мы 'заморозим' или доделаем?`,
  },
];

export class NotificationService {
  static async processAll() {
    for (const event of NOTIFICATION_EVENTS) {
      try {
        await this.processEvent(event);
      } catch (error) {
        console.error(`Failed to process notification event ${event.type}:`, error);
      }
    }
  }

  private static async processEvent(event: NotificationEvent) {
    const payload = await this.getPayloadForEvent(event.type);
    if (!payload) return;

    const shouldNotify = await event.condition(payload);
    if (!shouldNotify) return;

    const wasRecentlySent = await this.wasNotificationRecentlySent(event.type, payload);
    if (wasRecentlySent) return;

    const message = event.message(payload);
    
    await TelegramService.sendMessage(
      parseInt(process.env.TELEGRAM_CHAT_ID || '0'),
      message
    );
    
    await this.logNotificationSent(event.type, payload);
  }

  private static async getPayloadForEvent(type: string): Promise<any> {
    switch (type) {
      case 'CLOSER':
        const project = await ProjectService.getClosestToFinish();
        return project ? { project } : null;
      case 'GUARD':
        return { count: await ProjectService.countActiveProjects() };
      default:
        return null;
    }
  }

  private static async wasNotificationRecentlySent(
    type: string,
    payload: any
  ): Promise<boolean> {
    const projectId = payload.project?.id;

    const recentNotification = await prisma.notificationLog.findFirst({
      where: {
        type,
        projectId,
        sentAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return !!recentNotification;
  }

  private static async logNotificationSent(
    type: string,
    payload: any
  ): Promise<void> {
    const projectId = payload.project?.id;

    await prisma.notificationLog.create({
      data: { type, projectId },
    });
  }
}
```

**Step 3: Write tests**

Create: `src/services/__tests__/NotificationService.test.ts`:

```typescript
import { NotificationService } from '../NotificationService';

describe('NotificationService', () => {
  describe('processAll', () => {
    it('processes all notification events without throwing', async () => {
      await expect(NotificationService.processAll()).resolves.not.toThrow();
    });
  });
});
```

**Step 4: Run tests**

Run: `npm test -- src/services/__tests__/NotificationService.test.ts`

**Step 5: Commit**

```bash
git add src/services/NotificationService.ts src/services/TelegramService.ts src/services/__tests__/NotificationService.test.ts
git commit -m "feat: add NotificationService with Telegram integration and tests"
```

---

## Phase 3: State Management

### Task 8: Create Project Store

**Files:**
- Create: `src/store/useProjectStore.ts`

**Step 1: Write Zustand store**

```typescript
import { create } from 'zustand';
import type { Project } from '@prisma/client';

interface ProjectState {
  projects: (Project & { focusScore?: number; daysStale?: number })[];
  filter: string;
  sortBy: 'score' | 'progress' | 'recent';
  isLoading: boolean;
  error: string | null;
  
  fetchProjects: () => Promise<void>;
  createProject: (name: string, weight?: number, friction?: number) => Promise<void>;
  updateProjectStatus: (id: string, status: string, lastSessionNote?: string) => Promise<void>;
  setFilter: (filter: string) => void;
  setSortBy: (sortBy: 'score' | 'progress' | 'recent') => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  filter: '',
  sortBy: 'score',
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const projects = await response.json();
      set({ projects, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
    }
  },

  createProject: async (name, weight = 5, friction = 5) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, weight, friction }),
    });
    if (!response.ok) throw new Error('Failed to create project');
    await get().fetchProjects();
  },

  updateProjectStatus: async (id, status, lastSessionNote) => {
    const response = await fetch(`/api/projects/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, lastSessionNote }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update status');
    }
    await get().fetchProjects();
  },

  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),
}));
```

**Step 2: Commit**

```bash
git add src/store/useProjectStore.ts
git commit -m "feat: add Project Zustand store"
```

---

### Task 9: Create Focus Store

**Files:**
- Create: `src/store/useFocusStore.ts`

**Step 1: Write persisted focus store**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

      startFocus: (projectId) => set({ 
        currentProjectId: projectId, 
        sessionStartTime: Date.now() 
      }),

      startTask: (taskId) => set({ currentTaskId: taskId }),

      stopFocus: () => set({ 
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
      name: 'focus-flow-storage',
      partialize: (state) => ({ 
        currentProjectId, 
        currentTaskId, 
        sessionStartTime, 
        timerElapsed,
        sessionDuration,
      }),
    }
  )
);
```

**Step 2: Commit**

```bash
git add src/store/useFocusStore.ts
git commit -m "feat: add persisted Focus Zustand store"
```

---

## Phase 4: API Routes

### Task 10: Create Projects API Routes

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/app/api/projects/[id]/status/route.ts`

**Step 1: Write projects list/create route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/services/ProjectService';

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { tasks: true },
    orderBy: { updatedAt: 'desc' },
  });

  const enrichedProjects = await ProjectService.enrichProjects(projects);

  return NextResponse.json(enrichedProjects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, weight = 5, friction = 5 } = body;

  const project = await prisma.project.create({
    data: { name, weight, friction },
  });

  return NextResponse.json(project, { status: 201 });
}
```

**Step 2: Write project detail route**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { tasks: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { name, weight, friction } = body;

  const project = await prisma.project.update({
    where: { id: params.id },
    data: { name, weight, friction },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.project.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
```

**Step 3: Write project status route (WIP enforcement)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const WIP_LIMIT = 3;

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { status, lastSessionNote } = body;

  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (status === 'ACTIVE' && project.status !== 'ACTIVE') {
    const activeCount = await prisma.project.count({
      where: {
        status: 'ACTIVE',
        id: { not: params.id },
      },
    });

    if (activeCount >= WIP_LIMIT) {
      const activeProjects = await prisma.project.findMany({
        where: {
          status: 'ACTIVE',
          id: { not: params.id },
        },
        select: { id: true, name: true },
      });

      return NextResponse.json(
        {
          error: 'WIP_LIMIT_EXCEEDED',
          message: `Cannot activate more than ${WIP_LIMIT} projects`,
          activeProjects,
        },
        { status: 409 }
      );
    }
  }

  if (project.status === 'ACTIVE' && status !== 'ACTIVE' && !lastSessionNote) {
    return NextResponse.json(
      {
        error: 'HOOK_REQUIRED',
        message: 'Please provide a session note before stopping focus',
      },
      { status: 400 }
    );
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: { status, lastSessionNote },
  });

  return NextResponse.json(updated);
}
```

**Step 4: Commit**

```bash
git add src/app/api/projects/route.ts src/app/api/projects/[id]/route.ts src/app/api/projects/[id]/status/route.ts
git commit -m "feat: add Projects API routes with WIP limit enforcement"
```

---

### Task 11: Create Tasks API Routes

**Files:**
- Create: `src/app/api/tasks/route.ts`
- Create: `src/app/api/tasks/[id]/complete/route.ts`

**Step 1: Write tasks list/create route**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const tasks = await prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectId, title, type = 'ACTION', order } = body;

  const task = await prisma.task.create({
    data: { projectId, title, type, order: order ?? 0 },
  });

  return NextResponse.json(task, { status: 201 });
}
```

**Step 2: Write task complete route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/services/TaskService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { contextSummary, timerLog } = body;

  try {
    const result = await TaskService.completeTaskWithProgress(
      params.id,
      contextSummary,
      timerLog
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/tasks/route.ts src/app/api/tasks/[id]/complete/route.ts
git commit -m "feat: add Tasks API routes with progress updates"
```

---

### Task 12: Create Ideas API Routes

**Files:**
- Create: `src/app/api/ideas/route.ts`
- Create: `src/app/api/ideas/[id]/process/route.ts`

**Step 1: Write ideas list/create route**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const ideas = await prisma.idea.findMany({
    where: { processed: false },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(ideas);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { content, source = 'Web', projectId } = body;

  const idea = await prisma.idea.create({
    data: { content, source, projectId },
  });

  return NextResponse.json(idea, { status: 201 });
}
```

**Step 2: Write idea process route**

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { action, targetProjectId, title } = body;

  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
  });

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  let result;

  if (action === 'convert_to_task') {
    if (!targetProjectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          projectId: targetProjectId,
          title: title || idea.content,
          type: 'ACTION',
        },
      });

      await tx.idea.update({
        where: { id: params.id },
        data: { processed: true, projectId: targetProjectId },
      });

      return task;
    });
  } else if (action === 'convert_to_project') {
    result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: title || 'New Project from Idea',
        },
      });

      const task = await tx.task.create({
        data: {
          projectId: project.id,
          title: idea.content,
          type: 'ACTION',
        },
      });

      await tx.idea.update({
        where: { id: params.id },
        data: { processed: true, projectId: project.id },
      });

      return { project, task };
    });
  }

  return NextResponse.json(result);
}
```

**Step 3: Commit**

```bash
git add src/app/api/ideas/route.ts src/app/api/ideas/[id]/process/route.ts
git commit -m "feat: add Ideas API routes with conversion logic"
```

---

### Task 13: Create Telegram Webhook

**Files:**
- Create: `src/app/api/telegram/webhook/route.ts`

**Step 1: Write webhook route**

```typescript
import { NextRequest, NextResponse } from 'next/server';

interface TelegramMessage {
  message: {
    chat: { id: number };
    text: string;
    from: { id: number; username?: string };
  };
}

export async function POST(request: NextRequest) {
  const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.error('Invalid webhook secret');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: TelegramMessage = await request.json();
  const { text, from } = body.message;

  const idea = await prisma.idea.create({
    data: {
      content: text,
      source: 'Telegram',
    },
  });

  return NextResponse.json({ success: true, ideaId: idea.id });
}
```

**Step 2: Commit**

```bash
git add src/app/api/telegram/webhook/route.ts
git commit -m "feat: add Telegram webhook endpoint"
```

---

### Task 14: Create Notifications Cron Route

**Files:**
- Create: `src/app/api/notifications/cron/route.ts`

**Step 1: Write cron route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await NotificationService.processAll();

  return Response.json({ success: true });
}
```

**Step 2: Commit**

```bash
git add src/app/api/notifications/cron/route.ts
git commit -m "feat: add notifications cron endpoint"
```

---

## Phase 5: UI Components

### Task 15: Setup Shadcn/ui Components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/progress.tsx`
- Create: `src/components/ui/sonner.tsx`
- Create: `src/lib/utils.ts`

**Step 1: Install Shadcn/ui CLI**

Run: `npx shadcn@latest init -y -d`

**Step 2: Add required components**

Run: `npx shadcn@latest add button card dialog input select progress`

**Step 3: Create utils**

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
```

**Step 4: Commit**

```bash
git add src/components/ui src/lib/utils.ts components.json
git commit -m "feat: setup Shadcn/ui components"
```

---

### Task 16: Create RadarCard Component

**Files:**
- Create: `src/components/ui/RadarCard.tsx`

**Step 1: Write RadarCard component**

```typescript
'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Project } from '@prisma/client';

interface RadarCardProps {
  project: Project & { focusScore?: number; daysStale?: number };
  onSelect: () => void;
}

export function RadarCard({ project, onSelect }: RadarCardProps) {
  const isNearFinish = project.progress >= 70;
  const isStale = (project.daysStale ?? 0) >= 3;

  return (
    <motion.div
      layoutId={`project-${project.id}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="p-6 cursor-pointer hover:shadow-lg" onClick={onSelect}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">{project.name}</h3>
          
          {isNearFinish && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="text-green-500">🏁 Finish Line</span>
            </motion.div>
          )}
          
          {isStale && (
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity }}>
              <span className="text-amber-500">⏰ Stale</span>
            </motion.div>
          )}
        </div>

        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle 
              cx="64" cy="64" r="56" 
              stroke="currentColor" strokeWidth="8" fill="none" 
              className="text-gray-200" 
            />
            <circle
              cx="64" cy="64" r="56"
              stroke="currentColor" strokeWidth="8" fill="none"
              strokeDasharray={`${project.progress * 3.52} 352`}
              className={isNearFinish ? 'text-green-500' : 'text-blue-500'}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">{project.focusScore ?? 0}</span>
          </div>
        </div>

        <Button className="w-full">Enter Focus</Button>
      </Card>
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ui/RadarCard.tsx
git commit -m "feat: add RadarCard component with animations"
```

---

### Task 17: Create TheFocusRoom Component

**Files:**
- Create: `src/components/focus/TheFocusRoom.tsx`

**Step 1: Write TheFocusRoom component**

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusStore } from '@/store/useFocusStore';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';

export function TheFocusRoom() {
  const { currentProjectId, currentTaskId, timerElapsed, sessionDuration, updateTimer, stopFocus } = useFocusStore();
  const [isStuckMode, setStuckMode] = useState(false);

  const project = useProjectStore(s => s.projects.find(p => p.id === currentProjectId));
  const currentTask = project?.tasks.find(t => t.id === currentTaskId);

  const isSessionTask = currentTask?.type === 'SESSION';
  const sessionProgress = sessionDuration > 0 ? (timerElapsed / sessionDuration) * 100 : 0;

  const handleStop = async () => {
    const note = prompt('Write a quick note for your next session:');
    if (!note) return;
    
    await fetch(`/api/projects/${currentProjectId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SNOOZED', lastSessionNote: note }),
    });

    stopFocus();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 transition-colors duration-500 ${
        isStuckMode 
          ? 'bg-gradient-to-br from-emerald-900 to-emerald-800' 
          : 'bg-gradient-to-br from-slate-900 to-slate-800'
      }`}
    >
      <div className="max-w-2xl mx-auto pt-16 px-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">{project?.name}</h1>
          {project?.lastSessionNote && (
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
              <h2 className="text-2xl font-semibold mb-4">{currentTask.title}</h2>
              
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
                  <span className="font-semibold">Context:</span> {currentTask.contextSummary}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4">
          <Button 
            variant={isStuckMode ? "default" : "outline"}
            onClick={() => setStuckMode(!isStuckMode)}
            className={isStuckMode ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {isStuckMode ? "✓ Feeling better" : "I'm stuck → Simplify"}
          </Button>
          <Button onClick={handleStop}>
            Stop & Save
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/focus/TheFocusRoom.tsx
git commit -m "feat: add TheFocusRoom component with mood shift"
```

---

### Task 18: Create QuickCollect Component

**Files:**
- Create: `src/components/inbox/QuickCollect.tsx`

**Step 1: Write QuickCollect component**

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function QuickCollect() {
  const [isInputVisible, setInputVisible] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useHotkeys('ctrl+i, cmd+i', () => setInputVisible(true));

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        body: JSON.stringify({ content, source: 'Web' }),
      });

      if (response.ok) {
        toast.success('💭 Мысль сохранена в инкубатор');
        setContent('');
        setInputVisible(false);
      } else {
        toast.error('Не удалось сохранить мысль');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isInputVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Card className="p-4 shadow-2xl w-96">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Quick capture thought..."
              autoFocus
              disabled={isSubmitting}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" onClick={() => setInputVisible(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
                {isSubmitting ? 'Saving...' : 'Capture'}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
      
      {!isInputVisible && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setInputVisible(true)}
          className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-2xl"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/inbox/QuickCollect.tsx
git commit -m "feat: add QuickCollect component with hotkey"
```

---

## Phase 6: Pages

### Task 19: Create Radar Dashboard Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Write radar dashboard**

```typescript
'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useRouter } from 'next/navigation';
import { RadarCard } from '@/components/ui/RadarCard';
import { QuickCollect } from '@/components/inbox/QuickCollect';
import { TheFocusRoom } from '@/components/focus/TheFocusRoom';
import { useProjectStore } from '@/store/useProjectStore';

export default function Dashboard() {
  const router = useRouter();
  const { projects, fetchProjects, isLoading, error } = useProjectStore();
  const { currentProjectId, startFocus } = useFocusStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSelectProject = (projectId: string) => {
    startFocus(projectId);
    router.push(`/focus/${projectId}`);
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const sortedProjects = [...projects].sort((a, b) => {
    return (b.focusScore ?? 0) - (a.focusScore ?? 0);
  });

  return (
    <>
      {currentProjectId && <TheFocusRoom />}
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Focus Flow OS</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map(project => (
              <RadarCard
                key={project.id}
                project={project}
                onSelect={() => handleSelectProject(project.id)}
              />
            ))}
            
            <button
              onClick={() => {}}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex items-center justify-center hover:border-blue-500 transition-colors"
            >
              <span className="text-gray-400">+ New Project</span>
            </button>
          </div>
        </div>
      </div>
      
      <QuickCollect />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add Radar dashboard page"
```

---

### Task 19.5: Add Toaster for notifications

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Add Toaster to layout**

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Focus Flow OS",
  description: "Personal productivity system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Toaster for notifications"
```

---

### Task 20: Create Focus Mode Page

**Files:**
- Create: `src/app/focus/[projectId]/page.tsx`

**Step 1: Write focus page**

```typescript
'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { useFocusStore } from '@/store/useFocusStore';
import { TheFocusRoom } from '@/components/focus/TheFocusRoom';

export default function FocusPage() {
  const params = useParams();
  const { currentProjectId, startFocus } = useFocusStore();
  const { projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    if (params.projectId && currentProjectId !== params.projectId) {
      startFocus(params.projectId as string);
    }
    fetchProjects();
  }, [params.projectId, currentProjectId, startFocus, fetchProjects]);

  return <TheFocusRoom />;
}
```

**Step 2: Commit**

```bash
git add src/app/focus/[projectId]/page.tsx
git commit -m "feat: add Focus Mode page"
```

---

## Phase 7: Testing & Integration

### Task 21: Add E2E Test Setup

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`

**Step 1: Install Playwright**

Run: `npm install -D @playwright/test`

**Step 2: Create Playwright config**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 3: Add test script**

Modify `package.json` - add scripts:
```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

**Step 4: Create E2E test**

Create: `e2e/dashboard.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('dashboard loads and displays projects', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Focus Flow OS');
});

test('QuickCollect opens with Ctrl+I', async ({ page }) => {
  await page.goto('/');
  
  await page.keyboard.press('Control+KeyI');
  
  await expect(page.locator('input[placeholder*="Quick capture"]')).toBeVisible();
});

test('can create new project', async ({ page }) => {
  await page.goto('/');
  
  await page.click('text=+ New Project');
  
  const projectName = 'Test Project ' + Date.now();
  await page.fill('input[name="name"]', projectName);
  await page.click('button:has-text("Create")');
  
  await expect(page.locator(`text=${projectName}`)).toBeVisible();
});
```

**Step 5: Commit**

```bash
git add package.json playwright.config.ts e2e/dashboard.spec.ts
git commit -m "test: add Playwright E2E test setup"
```

---

### Task 22: Final Integration Test

**Files:**
- Create: `src/services/__tests__/integration.test.ts`

**Step 1: Write integration test**

```typescript
import { prisma } from '@/lib/prisma';
import { ProjectService } from '../ProjectService';
import { TaskService } from '../TaskService';

describe('Integration Tests', () => {
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    const project = await prisma.project.create({
      data: {
        name: 'Integration Test Project',
        weight: 5,
        friction: 5,
      },
    });
    projectId = project.id;

    const task = await prisma.task.create({
      data: {
        projectId,
        title: 'Test Task',
        type: 'ACTION',
      },
    });
    taskId = task.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
  });

  it('calculates Focus Score for project', () => {
    const project = {
      weight: 5,
      friction: 5,
      progress: 0,
      updatedAt: new Date(),
    };

    const score = ProjectService.calculateFocusScore({
      weight: project.weight,
      friction: project.friction,
      progress: project.progress,
      daysSinceActive: ProjectService.getDaysSinceActive(project),
    });

    expect(score).toBeGreaterThan(0);
  });

  it('updates project progress when task is completed', async () => {
    const result = await TaskService.completeTaskWithProgress(taskId);
    
    expect(result.progress).toBe(100);
  });

  it('project status changes to FINAL_STRETCH at 70% progress', async () => {
    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 70 },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    expect(project?.status).toBe('FINAL_STRETCH');
  });
});
```

**Step 2: Run integration test**

Run: `npm test -- src/services/__tests__/integration.test.ts`

**Step 3: Commit**

```bash
git add src/services/__tests__/integration.test.ts
git commit -m "test: add integration tests"
```

---

## Phase 8: Final Setup

### Task 23: Add Environment Variables

**Files:**
- Modify: `.env.local`

**Step 1: Create .env.local**

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="development-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_WEBHOOK_SECRET="development-webhook-secret"
TELEGRAM_CHAT_ID=""
CRON_SECRET="development-cron-secret"
```

**Step 2: Add .env.local to .gitignore**

Modify `.gitignore`:
```gitignore
.env.local
```

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: update .gitignore for .env.local"
```

---

### Task 24: Final Verification

**Step 1: Generate Prisma client**

Run: `npx prisma generate`

**Step 2: Push database schema**

Run: `npx prisma db push`

**Step 3: Run development server**

Run: `npm run dev`

**Step 4: Test in browser**

Open `http://localhost:3000` and verify:
- Dashboard loads
- Radar cards display
- QuickCollect FAB visible
- Ctrl+I opens QuickCollect

**Step 5: Run unit tests**

Run: `npm test`

**Step 6: Run E2E tests**

Run: `npm run test:e2e`

**Step 7: Commit final version**

```bash
git add .
git commit -m "chore: final verification complete"
```

---

## Summary

This implementation plan builds Focus Flow OS in 24 bite-sized tasks:

1. **Setup** (Tasks 1-4): Next.js, Tailwind, Prisma, SQLite
2. **Services** (Tasks 5-7): Project, Task, Notification, Telegram
3. **State** (Tasks 8-9): Zustand stores for projects and focus
4. **API** (Tasks 10-14): All RESTful endpoints
5. **UI** (Tasks 15-18): Shadcn/ui components + custom components
6. **Pages** (Tasks 19-20): Dashboard and Focus Mode
7. **Testing** (Tasks 21-22): E2E and integration tests
8. **Final** (Tasks 23-24): Environment setup and verification

Each task follows TDD: write test → verify fail → implement → verify pass → commit.

**Total estimated time:** 8-12 hours for full implementation
