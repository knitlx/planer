# AI Remediation Playbook (UI/UX + Backend)

## Goal
Bring product to stable 95/100 usability readiness with measurable checkpoints.

## Execution order

### Phase 1: Metadata and navigation semantics
- Scope
  - Add route-specific metadata for `/`, `/projects`, `/tasks`, `/ideas`, `/focus`, `/review`, `/radar`.
  - Keep one primary heading (`h1`) per route render path (including loading/skeleton state).
- Files
  - `src/app/*/page.tsx` (or route layout wrappers)
  - `src/app/layout.tsx`
- Done criteria
  - No duplicate-title warning in crawl for those pages.
  - No heading-order warning in crawl.

### Phase 2: Contrast and visual accessibility
- Scope
  - Tune low-contrast token combos in muted text and secondary controls.
  - Validate light/dark states where applicable.
- Files
  - `src/app/globals.css`
  - `src/lib/quantum-theme.ts`
  - page/component files with flagged classes
- Done criteria
  - a11y color-contrast warnings reduced to 0 on main routes.

### Phase 3: Backend response normalization
- Scope
  - Remove `any` from API catch blocks.
  - Standardize validation and error responses through shared helpers.
  - Enforce consistent error JSON shape for frontend parsing.
- Files
  - `src/app/api/**/route.ts`
  - `src/lib/api-validation.ts`
  - `src/lib/api-errors.ts`
- Done criteria
  - API routes return consistent `{ error: string }` for known failures.
  - Lint warnings related to `no-explicit-any` in API handlers reduced to 0.

### Phase 4: Interaction robustness and debt cleanup
- Scope
  - Eliminate impure render-time computations (`Date.now`, `Math.random`) where feasible.
  - Address hook dependency and refs warnings that affect predictability.
- Files
  - `src/components/TaskBoard.tsx`
  - `src/components/Celebration.tsx`
  - `src/components/ProjectCard.tsx`
  - `src/components/RadarCard.tsx`
  - `src/app/review/page.tsx`
- Done criteria
  - Lint warning count < 10, no warnings in high-traffic UI surfaces.

### Phase 5: Verification and quality gates
- Commands
  - `npm run lint`
  - `npm run e2e`
  - `squirrel audit http://127.0.0.1:3000 --format llm --max-pages 40`
- Accept threshold
  - E2E pass rate 100%
  - Accessibility category >= 98
  - No high-severity form-label/keyboard/modal issues

## Non-goals (for this cycle)
- Marketing/legal pages (about/contact/privacy) beyond minimal technical placeholders.
- Production infra hardening not represented in local env (TLS termination, CDN policy).

## Notes for next AI agent
- Existing branch already includes substantial a11y and UX fixes; continue incrementally.
- Prefer preserving current visual language; optimize semantics and flow clarity over redesign.
- Validate every batch with both e2e and crawl diff to avoid regressions.
