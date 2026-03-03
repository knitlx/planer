/**
 * Quantum Flow Design System
 *
 * Единый источник истины для темы Quantum Flow.
 * Фиолетовый (#8B5CF6) → голубой (#06B6D4) градиент.
 * Стиль: стеклянные панели, анимации, темный фон.
 *
 * Принципы использования:
 * 1. Все цвета определены здесь и экспортируются
 * 2. CSS переменные генерируются автоматически
 * 3. Tailwind конфиг использует эти значения
 * 4. Компоненты импортируют константы при необходимости
 */

// ============================================================================
// ЦВЕТОВАЯ ПАЛИТРА
// ============================================================================

export const quantumColors = {
  // Основные цвета градиента
  purple: "#8A2BE2",
  blue: "#00E5FF",

  // Фоны
  background: {
    primary: "#000000",
    secondary: "#0F0F14",
    tertiary: "#161623",
    glass: "rgba(15, 15, 20, 0.85)",
  },

  // Текст
  text: {
    primary: "#FFFFFF",
    secondary: "#9EA0B5",
    muted: "#767A93",
    accent: "#00E5FF",
  },

  // Границы
  border: {
    primary: "rgba(138, 43, 226, 0.25)",
    secondary: "rgba(255, 255, 255, 0.08)",
    accent: "rgba(0, 229, 255, 0.4)",
    glass: "rgba(138, 43, 226, 0.3)",
  },

  // Статусы
  status: {
    high: {
      bg: "rgba(0, 229, 255, 0.16)",
      text: "#6EEFFF",
    },
    medium: {
      bg: "rgba(0, 229, 255, 0.13)",
      text: "#52E7FF",
    },
    low: {
      bg: "rgba(0, 229, 255, 0.11)",
      text: "#3DDEFA",
    },
    completed: {
      bg: "rgba(0, 229, 255, 0.18)",
      text: "#00E5FF",
    },
  },

  // Эффекты
  effects: {
    glow: "rgba(138, 43, 226, 0.35)",
    shadow: "rgba(0, 0, 0, 0.25)",
    overlay: "rgba(10, 10, 15, 0.7)",
  },
} as const;

// ============================================================================
// ГРАДИЕНТЫ
// ============================================================================

export const quantumGradients = {
  primary: `linear-gradient(135deg, ${quantumColors.purple} 0%, ${quantumColors.blue} 100%)`,
  subtle: `linear-gradient(135deg, ${quantumColors.purple}10 0%, ${quantumColors.blue}10 100%)`,
  hover: `linear-gradient(135deg, ${quantumColors.purple}20 0%, ${quantumColors.blue}20 100%)`,
  background: `linear-gradient(135deg, ${quantumColors.background.primary} 0%, ${quantumColors.background.secondary} 100%)`,
  card: `linear-gradient(135deg, ${quantumColors.background.secondary} 0%, ${quantumColors.background.tertiary} 100%)`,
  text: `linear-gradient(135deg, ${quantumColors.purple} 0%, ${quantumColors.blue} 100%)`,
} as const;

// ============================================================================
// ТЕНИ
// ============================================================================

export const quantumShadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  glow: `0 0 20px ${quantumColors.effects.glow}`,
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
} as const;

// ============================================================================
// АНИМАЦИИ
// ============================================================================

export const quantumAnimations = {
  durations: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },

  easings: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  keyframes: {
    pulse: {
      "0%, 100%": { opacity: "1" },
      "50%": { opacity: "0.7" },
    },
    glow: {
      "0%": {
        boxShadow: `0 0 5px ${quantumColors.effects.glow}80, 0 0 10px ${quantumColors.effects.glow}50, 0 0 15px ${quantumColors.effects.glow}30`,
      },
      "100%": {
        boxShadow: `0 0 10px ${quantumColors.effects.glow}, 0 0 20px ${quantumColors.effects.glow}80, 0 0 30px ${quantumColors.effects.glow}50`,
      },
    },
    float: {
      "0%, 100%": { transform: "translateY(0px)" },
      "50%": { transform: "translateY(-10px)" },
    },
  },
} as const;

// ============================================================================
// CSS ПЕРЕМЕННЫЕ (единый источник для globals.css)
// ============================================================================

export const quantumCSSVars = {
  // Цвета
  "--qf-color-purple": quantumColors.purple,
  "--qf-color-blue": quantumColors.blue,
  "--qf-color-bg-primary": quantumColors.background.primary,
  "--qf-color-bg-secondary": quantumColors.background.secondary,
  "--qf-color-bg-tertiary": quantumColors.background.tertiary,
  "--qf-color-bg-glass": quantumColors.background.glass,
  "--qf-color-text-primary": quantumColors.text.primary,
  "--qf-color-text-secondary": quantumColors.text.secondary,
  "--qf-color-text-muted": quantumColors.text.muted,
  "--qf-color-text-accent": quantumColors.text.accent,
  "--qf-color-border-primary": quantumColors.border.primary,
  "--qf-color-border-secondary": quantumColors.border.secondary,
  "--qf-color-border-accent": quantumColors.border.accent,
  "--qf-color-border-glass": quantumColors.border.glass,

  // Статусы
  "--qf-color-status-high-bg": quantumColors.status.high.bg,
  "--qf-color-status-high-text": quantumColors.status.high.text,
  "--qf-color-status-medium-bg": quantumColors.status.medium.bg,
  "--qf-color-status-medium-text": quantumColors.status.medium.text,
  "--qf-color-status-low-bg": quantumColors.status.low.bg,
  "--qf-color-status-low-text": quantumColors.status.low.text,
  "--qf-color-status-completed-bg": quantumColors.status.completed.bg,
  "--qf-color-status-completed-text": quantumColors.status.completed.text,

  // Градиенты
  "--qf-gradient-primary": quantumGradients.primary,
  "--qf-gradient-subtle": quantumGradients.subtle,
  "--qf-gradient-hover": quantumGradients.hover,
  "--qf-gradient-background": quantumGradients.background,
  "--qf-gradient-card": quantumGradients.card,
  "--qf-gradient-text": quantumGradients.text,

  // Тени
  "--qf-shadow-glow": quantumShadows.glow,
  "--qf-shadow-inner": quantumShadows.inner,
} as const;

// ============================================================================
// УТИЛИТЫ ДЛЯ КОМПОНЕНТОВ
// ============================================================================

/**
 * Готовые классы для стеклянных эффектов
 */
export const quantumGlass = {
  base: "qf-shell-card",
  light: "backdrop-blur-md bg-white/5 border-white/10",
  dark: "backdrop-blur-xl bg-black/20 border-white/5",
} as const;

/**
 * Готовые классы для градиентов
 */
export const quantumGradientClasses = {
  text: "qf-gradient-text",
  bg: "bg-qf-gradient-primary",
  border: "border border-transparent bg-qf-gradient-primary bg-clip-border",
} as const;

/**
 * Готовые классы для анимаций
 */
export const quantumAnimationClasses = {
  pulse: "animate-quantum-pulse",
  glow: "animate-quantum-glow",
  float: "animate-quantum-float",
} as const;

// ============================================================================
// ТИПЫ
// ============================================================================

export type QuantumColor = keyof typeof quantumColors;
export type QuantumGradient = keyof typeof quantumGradients;
export type QuantumStatus = keyof typeof quantumColors.status;

// ============================================================================
// УТИЛИТЫ ДЛЯ НАВИГАЦИИ
// ============================================================================

/**
 * Готовые классы для навигации
 */
export const quantumNavigationClasses = {
  // Основные стили ссылок
  link: {
    base: "relative flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-all duration-300 rounded-xl border border-transparent",
    active:
      "bg-[linear-gradient(135deg,rgba(138,43,226,0.24),rgba(0,229,255,0.12))] text-white border-qf-border-accent shadow-[0_0_0_1px_rgba(0,229,255,0.18)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-cyan-300",
    inactive: "text-qf-text-secondary hover:text-white hover:bg-white/5 hover:border-qf-border-secondary",
    icon: "w-5 h-5",
  },

  // Стили для проектов в сайдбаре
  project: {
    base: "w-full flex items-center justify-between px-3 py-2 text-sm transition-all rounded-xl border border-transparent hover:bg-white/5 hover:border-qf-border-secondary group",
    dot: "w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]",
    progress: "text-[10px] opacity-60 group-hover:opacity-100 font-mono",
  },

  // Стили для кнопок навигации
  button: {
    primary:
      "bg-qf-gradient-primary text-black hover:opacity-95 transition-opacity shadow-[0_0_20px_rgba(0,229,255,0.25)]",
    secondary:
      "bg-qf-bg-secondary/80 hover:bg-qf-bg-tertiary border border-qf-border-primary",
  },

  // Стили для заголовков секций
  section: {
    title:
      "text-[10px] uppercase tracking-widest text-qf-text-muted font-bold mb-4",
  },

  // Стили для статусных индикаторов
  status: {
    high: "bg-cyan-400",
    medium: "bg-cyan-300",
    low: "bg-cyan-200",
    completed: "bg-cyan-300",
  },
} as const;

// ============================================================================
// УТИЛИТАРНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Генерирует CSS строку с переменными для вставки в :root
 */
export function generateQuantumCSSVars(): string {
  return Object.entries(quantumCSSVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n    ");
}

/**
 * Возвращает цвет статуса по ключу
 */
export function getStatusColor(status: QuantumStatus): {
  bg: string;
  text: string;
} {
  return quantumColors.status[status];
}

/**
 * Возвращает градиент по ключу
 */
export function getGradient(gradient: QuantumGradient): string {
  return quantumGradients[gradient];
}

/**
 * Возвращает статус по прогрессу проекта
 */
export function getStatusByProgress(progress: number): QuantumStatus {
  if (progress >= 100) return "completed";
  if (progress >= 70) return "high";
  if (progress >= 30) return "medium";
  return "low";
}

/**
 * Возвращает классы для статуса по прогрессу
 */
export function getStatusClassesByProgress(progress: number): string {
  const status = getStatusByProgress(progress);
  return quantumNavigationClasses.status[status];
}
