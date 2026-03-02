# Focus Flow OS - Design Document

## Project Overview

Focus Flow OS is a personal productivity system that fights chaos through on-demand information, dopamine loops for finishing tasks, and separation between quick actions (Bricks) and deep work (Sessions).

## Technology Stack

### Frontend
- Next.js 14+ (App Router)
- Tailwind CSS
- Shadcn/ui
- Framer Motion (animations)
- Zustand (state management)
- NextAuth.js (authentication)

### Backend
- Next.js API Routes
- Prisma ORM
- SQLite (local) → PostgreSQL (production)
- Telegram Bot API (notifications)

## Data Model

### Prisma Schema

```prisma
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
  id        String   @id @default(cuid())
  content   String
  source    String   @default("Web")
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  processed Boolean  @default(false)
  createdAt DateTime  @default(now())
}

model NotificationLog {
  id        String   @id @default(cuid())
  type      String
  projectId String?
  sentAt    DateTime @default(now())
  
  @@unique([type, projectId])
  @@index([type, projectId])
}

model User {
  id         String   @id @default(cuid())
  telegramId Int      @unique
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

## Focus Score Algorithm

```typescript
function calculateFocusScore(params: FocusScoreParams): number {
  const { weight, friction, progress, daysSinceActive } = params;
  
  let score = (weight * 10) + (progress * 0.3);
  
  if (progress >= 70) score += 25;
  
  if (daysSinceActive >= 3) {
    score -= daysSinceActive * 5;
  }
  
  score -= friction * 3;
  
  return Math.max(0, score);
}
```

## UI Components

### Pages Structure

```
/app
├── layout.tsx
├── page.tsx (Radar Dashboard)
├── focus/[projectId]/ (Focus Room)
├── review/ (Decision Dashboard)
└── api/ (API Routes)
```

### Key Components

**RadarCard**
- Progress circle with Focus Score
- Visual indicators for near-finish (70%+) and stale projects (3+ days)
- Hover animation with Framer Motion
- "Enter Focus" button

**TheFocusRoom**
- Full-screen focus mode with background gradient
- Project name + lastSessionNote (hook for re-entry)
- Current task card with timer for SESSION tasks
- Session progress bar
- Context summary field
- "I'm stuck" button (triggers mood shift + simplification)
- "Done" button

**QuickCollect**
- Floating Action Button (FAB) with Ctrl+I hotkey
- Slide-up input with animation
- Toast feedback on capture

**DecisionDashboard**
- Drag-and-drop interface for Ideas → Projects/Tasks
- Two columns: Unprocessed Ideas | Active Projects
- Uses @dnd-kit for drag-and-drop

### Animation Patterns

**Card expansion (Radar → Focus)**
```typescript
const cardVariants = {
  radar: { scale: 1, borderRadius: '1rem' },
  focus: { scale: 1, borderRadius: '0.5rem', y: 0 },
};
```

**Task completion**
```typescript
const taskCompleteVariants = {
  initial: { scale: 1, opacity: 1 },
  exit: { scale: 0.5, opacity: 0, filter: 'blur(10px)' },
};
```

**Stale project pulse**
```typescript
const pulseVariants = {
  active: { opacity: 1 },
  stale: { 
    opacity: [0.6, 1, 0.6],
    transition: { repeat: Infinity, duration: 2 }
  },
};
```

## API Routes

### Projects

```
GET  /api/projects              # List projects with Focus Score
POST /api/projects              # Create project
GET  /api/projects/[id]        # Get project details
PUT  /api/projects/[id]         # Update project
PUT  /api/projects/[id]/status  # Change status (WIP enforcement)
```

### Tasks

```
GET  /api/tasks                 # List tasks
POST /api/tasks                 # Create task
PUT  /api/tasks/[id]            # Update task
PUT  /api/tasks/[id]/complete   # Mark done (transactional progress update)
```

### Ideas

```
GET  /api/ideas                 # List ideas
POST /api/ideas                 # Create idea
PUT  /api/ideas/[id]/process    # Convert to task/project
```

### Focus

```
POST /api/focus                 # Start focus session
PUT  /api/focus/[sessionId]     # Update timer
DELETE /api/focus/[sessionId]   # End session
```

### Telegram

```
POST /api/telegram/webhook      # Receive bot messages (verified)
```

### Notifications

```
GET  /api/notifications/cron     # Process notification events (cron job)
```

## Business Logic Services

### ProjectService
- calculateFocusScore()
- getDaysSinceActive()
- countActiveProjects()

### TaskService
- calculateProjectProgress()
- getNextStepTask()
- simplifyTask() (with isSimplified flag)
- generateMicroSteps() (pattern-based + future AI support)

### NotificationService
- processAll() (cron job)
- processEvent() (deduplication via NotificationLog)
- wasNotificationRecentlySent() (24h window)

## State Management (Zustand)

### useProjectStore
```typescript
{
  projects: Project[]
  filter: string
  sortBy: 'score' | 'progress' | 'recent'
  fetchProjects: () => void
  updateProjectStatus: (id, status) => void
}
```

### useFocusStore (persisted)
```typescript
{
  currentProjectId: string | null
  currentTaskId: string | null
  sessionStartTime: number | null
  timerElapsed: number
  startFocus: (projectId) => void
  startTask: (taskId) => void
  stopFocus: () => void
  updateTimer: (elapsed) => void
}
```

### useUIStore
```typescript
{
  currentView: 'radar' | 'focus' | 'review'
  setCurrentView: (view) => void
}
```

## Notification Events

| Type | Condition | Message |
|------|-----------|---------|
| CLOSER | project.status === 'FINAL_STRETCH' + 24h inactivity | "В проекте {name} осталось всего чуть-чуть до 100%. Заскочим на 15 минут, чтобы закрыть его навсегда?" |
| GUARD | Attempting to add 4th active project | "У тебя уже 3 проекта в фокусе. Чтобы добавить этот, давай выберем, какой мы 'заморозим' или доделаем?" |
| PIVOT | SESSION task > 90 min without pause | "Ты в глубоком потоке уже 1.5 часа. Как ты? Если чувствуешь, что вязнешь — нажми 'Stop' и запиши зацепку на завтра." |

## Security

### Telegram Webhook
- Verify X-Telegram-Bot-Api-Secret-Token header
- Map Telegram user ID to internal user ID

### API Routes
- NextAuth.js for authentication
- CORS configuration for production

### Error Handling
```typescript
class AppError extends Error {
  constructor(message: string, statusCode = 500, code?: string)
}

class WIPLimitExceededError extends AppError
class HookRequiredError extends AppError
```

## WIP Limit Enforcement

```typescript
const WIP_LIMIT = 3;

// When activating project:
const activeCount = await prisma.project.count({
  where: { userId, status: 'ACTIVE', id: { not: projectId } }
});

if (activeCount >= WIP_LIMIT) {
  throw new WIPLimitExceededError(activeProjects);
}
```

## Hook Constraint

```typescript
// When stopping focus (status: ACTIVE → !ACTIVE):
if (!lastSessionNote) {
  throw new HookRequiredError();
}
```

## Transactional Operations

### Task Completion
```typescript
await prisma.$transaction(async (tx) => {
  await tx.task.update({ id: taskId, status: 'DONE' });
  const newProgress = await calculateProjectProgress(tx, projectId);
  await tx.project.update({ 
    id: projectId, 
    progress: newProgress,
    updatedAt: new Date()
  });
});
```

### Idea Processing
```typescript
await prisma.$transaction(async (tx) => {
  const task = await tx.task.create({...});
  await tx.idea.update({ id: ideaId, processed: true });
});
```

## Deployment (Local First)

1. Local development with SQLite
2. Prisma for migrations
3. Next.js dev server
4. Test all functionality locally
5. Migrate to PostgreSQL + VPS when ready

## Success Criteria

- Rapid thought capture in < 5 seconds
- Focus mode provides single-task isolation
- Progress updates instant and transactional
- WIP limit prevents context switching
- Notifications are helpful, not spammy
- Re-entry hooks reduce resistance to returning to paused work
