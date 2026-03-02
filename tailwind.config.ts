import type { Config } from "tailwindcss";

/**
 * Tailwind CSS конфигурация для Quantum Flow Design System
 * 
 * Использует переменные из src/lib/quantum-theme.ts
 * Все цвета и градиенты синхронизированы с единым источником истины
 */

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ============================================================================
      // ЦВЕТА QUANTUM FLOW
      // ============================================================================
      colors: {
        // Основные цвета Quantum Flow
        "qf": {
          // Основные цвета
          purple: "var(--color-qf-purple)",
          blue: "var(--color-qf-blue)",
          
          // Фоны
          "bg-primary": "var(--color-qf-bg-primary)",
          "bg-secondary": "var(--color-qf-bg-secondary)",
          "bg-tertiary": "var(--color-qf-bg-tertiary)",
          "bg-glass": "var(--color-qf-bg-glass)",
          
          // Текст
          "text-primary": "var(--color-qf-text-primary)",
          "text-secondary": "var(--color-qf-text-secondary)",
          "text-muted": "var(--color-qf-text-muted)",
          "text-accent": "var(--color-qf-text-accent)",
          
          // Границы
          "border-primary": "var(--color-qf-border-primary)",
          "border-secondary": "var(--color-qf-border-secondary)",
          "border-accent": "var(--color-qf-border-accent)",
          "border-glass": "var(--color-qf-border-glass)",
          
          // Статусы
          "status-high-bg": "var(--color-qf-status-high-bg)",
          "status-high-text": "var(--color-qf-status-high-text)",
          "status-medium-bg": "var(--color-qf-status-medium-bg)",
          "status-medium-text": "var(--color-qf-status-medium-text)",
          "status-low-bg": "var(--color-qf-status-low-bg)",
          "status-low-text": "var(--color-qf-status-low-text)",
          "status-completed-bg": "var(--color-qf-status-completed-bg)",
          "status-completed-text": "var(--color-qf-status-completed-text)",
        },
        
        // Legacy shadcn/ui colors (только для обратной совместимости)
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
      
      // ============================================================================
      // ГРАДИЕНТЫ QUANTUM FLOW
      // ============================================================================
      backgroundImage: {
        "qf-gradient-primary": "var(--gradient-qf-primary)",
        "qf-gradient-subtle": "var(--gradient-qf-subtle)",
        "qf-gradient-hover": "var(--gradient-qf-hover)",
        "qf-gradient-background": "var(--gradient-qf-background)",
        "qf-gradient-card": "var(--gradient-qf-card)",
        "qf-gradient-text": "var(--gradient-qf-text)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      
      // ============================================================================
      // ТЕНИ QUANTUM FLOW
      // ============================================================================
      boxShadow: {
        "qf-glow": "var(--shadow-qf-glow)",
        "qf-inner": "var(--shadow-qf-inner)",
      },
      
      // ============================================================================
      // СКРУГЛЕНИЯ
      // ============================================================================
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      // ============================================================================
      // АНИМАЦИИ QUANTUM FLOW
      // ============================================================================
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "quantum-pulse": "quantum-pulse 2s ease-in-out infinite",
        "quantum-glow": "quantum-glow 3s ease-in-out infinite alternate",
        "quantum-float": "quantum-float 6s ease-in-out infinite",
      },
      
      keyframes: {
        // Legacy glow animation
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(255, 255, 0, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(255, 255, 0, 0.8)" },
        },
        
        // Quantum Flow animations (определены в globals.css)
        "quantum-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "quantum-glow": {
          "0%": { 
            boxShadow: "0 0 5px rgba(139, 92, 246, 0.3), 0 0 10px rgba(139, 92, 246, 0.2), 0 0 15px rgba(139, 92, 246, 0.1)" 
          },
          "100%": { 
            boxShadow: "0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3), 0 0 30px rgba(139, 92, 246, 0.2)" 
          },
        },
        "quantum-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      
      // ============================================================================
      // BLUR ЭФФЕКТЫ ДЛЯ СТЕКЛЯННЫХ ПАНЕЛЕЙ
      // ============================================================================
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;