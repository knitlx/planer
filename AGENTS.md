# AGENTS.md — краткая сводка по состоянию проекта (2026-03-04)

## Что было сделано

### 1) Git и ветки
- Подтверждено, что изменения из `codex/ui-ux-wave1` уже были в истории `main`.
- Найден и разобран отдельный `worktree`, который блокировал удаление ветки.
- Создан архивный snapshot незакоммиченных изменений Cursor/Codex:
  - ветка: `wip/cursor-ui-ux-snapshot-2026-03-04`
  - коммит: `c14a00d`
- Выполнен cleanup:
  - удален worktree `/.worktrees/ui-ux-wave1`
  - удалена локальная ветка `codex/ui-ux-wave1`
- `main` запушен в `origin/main`.

### 2) Локальный запуск / localhost
- Исправлена проблема, когда открывался `127.0.0.1`, но не `localhost`.
- В `package.json` убран жесткий bind к `127.0.0.1` для `dev/start`.
- После перезапуска dev-сервера `localhost` работает корректно (при занятом порту может использоваться 3004).

### 3) Выборочный перенос полезных изменений из Cursor/Codex в `main`
Перенесены безопасные и ценные изменения без глобального рискованного рефактора:
- A11y/UX улучшения:
  - `src/components/AppModal.tsx`
  - `src/components/ProjectGrid.tsx`
  - `src/components/QuantumSidebar.tsx`
  - `src/components/QuickCollect.tsx`
  - `src/components/TheFocusRoom.tsx` (native `alert/confirm` заменены на toast/modal)
- Добавлен helper для чтения API-ошибок:
  - `src/lib/api-errors.ts`
- Добавлены/обновлены e2e и артефакты аудита:
  - `e2e/accessibility-wave2.spec.ts`
  - `e2e/focus-no-native-dialog.spec.ts`
  - правки существующих e2e
  - `audit/2026-03-04-ai-remediation-playbook.md`
  - `audit/2026-03-04-total-ui-ux-backend-audit.md`

## Что сознательно НЕ переносилось
- Массовый архитектурный рефактор страниц (`page.client.tsx` -> большой `"use client"` в `page.tsx`).
- Широкая пакетная переделка API-роутов и контракта ошибок во всех местах за один проход.

Причина: высокий риск регрессий и большой объем изменений. Это лучше делать отдельной фазой с изолированными проверками.

## Проверки
- `npm run lint`: проходит (без errors; warnings допустимы).
- `npm run e2e`: проходит (11/11).

## Текущий итог
- Проект в рабочем состоянии.
- Нужные изменения в `main` и на `origin/main`.
- Лишнее по веткам/worktree прибрано.
- Архивная ветка snapshot сохранена на случай возврата к экспериментальным изменениям.

## Если продолжать дальше
Делать отдельной фазой (по желанию):
1. Единая нормализация API error contract во всех route handlers.
2. Дополнительный metadata/SEO-polish по страницам.
3. Только после этого — решение о более крупном server/client архитектурном рефакторе.

## Agent-oriented docs
- Точка входа для AI-агентов: `docs/agents/README.md`
- Внутри — маршрутизация по доменам (API/UI/AI/Data/Workflows) и ссылки на целевые файлы.
