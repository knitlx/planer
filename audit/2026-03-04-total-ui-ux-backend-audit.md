# Total UI/UX + Backend Audit (2026-03-04)

## 1) Scan: project map and stack

### Stack
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion
- UI primitives: Radix UI
- State: Zustand (`useProjectStore`, `useFocusStore`)
- Notifications: Sonner
- DnD: `@dnd-kit/*`
- Backend: Next.js Route Handlers (`src/app/api/**`)
- DB: Prisma 7 + better-sqlite3 (SQLite)
- QA: Playwright e2e + ESLint 9

### Component map
- App shell and navigation
  - `src/app/layout.tsx`
  - `src/components/QuantumSidebar.tsx`
- Main pages
  - `src/app/page.tsx` (dashboard)
  - `src/app/projects/page.tsx`
  - `src/app/tasks/page.tsx`
  - `src/app/ideas/page.tsx`
  - `src/app/focus/**`
  - `src/app/review/page.tsx`, `src/app/radar/page.tsx`
- Domain UI components
  - `src/components/ProjectGrid.tsx`, `TaskBoard.tsx`, `TheFocusRoom.tsx`, `QuickCollect.tsx`, `AppModal.tsx`
- Backend/API
  - `src/app/api/projects/**`
  - `src/app/api/tasks/**`
  - `src/app/api/ideas/**`
  - `src/app/api/notifications/cron/route.ts`
  - `src/app/api/telegram/webhook/route.ts`
- Shared libs
  - `src/lib/api-validation.ts`
  - `src/lib/api-errors.ts`
  - `src/lib/project-utils.ts`

## 2) Research: dashboard design best practices (relevant in 2026)

Sources checked:
- W3C WCAG 2.2 (labels/instructions): https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html
- W3C WCAG 2.2 quick reference: https://www.w3.org/WAI/WCAG22/quickref/
- WAI-ARIA Authoring Practices (modal dialog): https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Microsoft Learn dashboard/report design tips: https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips
- Microsoft Well-Architected UX visual design guidance: https://learn.microsoft.com/en-us/power-platform/well-architected/experience-optimization/visual-design
- Dynamics 365 UI/UX principles: https://learn.microsoft.com/en-us/dynamics365/guidance/develop/ui-ux-design-principles

Applied principles:
- Every actionable form control must have a programmatic accessible name.
- Keyboard/focus paths must stay predictable and visible.
- Dashboard density should use progressive disclosure to reduce cognitive load.
- Information architecture should preserve heading hierarchy and single primary page heading.
- Error feedback should stay in-app (non-blocking toasts/modals) over browser-native blocking dialogs.

## 3) Analyze: findings and status

### What was fixed in this wave
- Accessibility and interaction:
  - Keyboard-operable project cards and visible focus states.
  - Modal close button labeled (`aria-label`).
  - Native `alert/confirm` replaced with in-app feedback in focus room flow.
  - Labeled quick-collect controls and task-form controls (`/tasks`).
  - Sidebar heading semantics adjusted to remove extra global `h1` and heading-level jumps.
- Information overload:
  - Dashboard stats switched to summary-first with expandable extended block.
- Technical/SEO baseline:
  - Added `src/app/robots.ts` and `src/app/sitemap.ts`.
  - Expanded root metadata in `src/app/layout.tsx` (description/OG/twitter/canonical).
- API UX consistency:
  - Added `src/lib/api-errors.ts`; reused in key pages/store for uniform error extraction.

### Automated audit evidence
- `squirrel audit` before improvements:
  - overall: 30, accessibility: 89
- `squirrel audit` after improvements:
  - overall: 55, accessibility: 98
- Important caveat:
  - overall score is dominated by local-dev constraints (HTTP/no CSP/no legal pages/duplicate metadata), so it is not a pure UI usability score.

### Remaining critical/major gaps
- Metadata uniqueness per page:
  - titles still duplicate on key routes; page-specific metadata layer still missing.
- Security headers in web responses:
  - no CSP and clickjacking protection header.
- Visual contrast in some secondary text/button states (warnings remain).
- Backend quality debt:
  - multiple `error: any` catches and partial validation coverage in API routes.
- Lint debt:
  - warnings are still high (impure render calls, hook deps, `any`, refs warnings in DnD component).

## 4) Usability score target (95/100)

Current practical estimate for UI usability (excluding legal/SEO/security transport items): ~86-90/100.

To reach 95/100:
- Introduce page-level metadata strategy (unique route titles/descriptions).
- Resolve remaining contrast warnings by token adjustments.
- Complete backend error/validation normalization across all route handlers.
- Reduce lint debt in interactive components (`TaskBoard`, review/radar cards, focus flows).
- Add targeted e2e coverage for:
  - full keyboard tab order across dashboard + tasks forms
  - contrast checks (automated + manual checkpoints)
  - API error display consistency on every CRUD flow

## Verification snapshot
- `npm run lint`: passes (0 errors, warnings remain)
- `npm run e2e`: 11/11 passed

