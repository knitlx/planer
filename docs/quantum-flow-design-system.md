# Quantum Flow Design System

## Обзор

Quantum Flow — дизайн-система для Focus Flow с фиолетово-голубым градиентом (#8B5CF6 → #06B6D4), стеклянными панелями и анимациями.

**Основные принципы:**
- Единый источник истины в `src/lib/quantum-theme.ts`
- Синхронизированные CSS переменные
- Готовые компоненты и утилиты
- Темная тема с акцентами

## Структура файлов

```
src/
├── lib/
│   └── quantum-theme.ts          # Единый источник истины
├── app/
│   └── globals.css              # CSS переменные и компоненты
└── components/                  # React компоненты
```

## Использование

### 1. Импорт констант в компонентах

```typescript
import { 
  quantumColors, 
  quantumGradients,
  quantumGlass,
  quantumGradientClasses 
} from '@/lib/quantum-theme';

// Использование цветов
const primaryColor = quantumColors.purple;
const backgroundColor = quantumColors.background.primary;

// Использование градиентов
const gradient = quantumGradients.primary;

// Использование готовых классов
const glassClass = quantumGlass.base;
const gradientTextClass = quantumGradientClasses.text;
```

### 2. Использование CSS классов

```tsx
// Стеклянные эффекты
<div className="glass">Стеклянная панель</div>
<div className="glass-light">Светлая стеклянная панель</div>
<div className="glass-dark">Темная стеклянная панель</div>

// Карточки
<div className="card">Карточка с градиентом</div>
<div className="card-glass">Стеклянная карточка</div>

// Кнопки
<button className="btn-primary">Основная кнопка</button>
<button className="btn-secondary">Вторичная кнопка</button>
<button className="btn-ghost">Призрачная кнопка</button>

// Бейджи
<span className="badge-high">Высокий приоритет</span>
<span className="badge-medium">Средний приоритет</span>
<span className="badge-low">Низкий приоритет</span>
<span className="badge-completed">Завершено</span>

// Градиентный текст
<h1 className="gradient-text">Заголовок с градиентом</h1>

// Анимации
<div className="animate-quantum-pulse">Пульсация</div>
<div className="animate-quantum-glow">Свечение</div>
<div className="animate-quantum-float">Парение</div>
```

### 3. Использование Tailwind классов

```tsx
// Цвета
<div className="bg-qf-bg-primary text-qf-text-primary">
  Основной фон и текст
</div>

<div className="border-qf-border-accent">
  Акцентная граница
</div>

// Градиенты
<div className="bg-qf-gradient-primary">
  Основной градиент
</div>

<div className="bg-qf-gradient-text bg-clip-text text-transparent">
  Градиентный текст
</div>

// Тени
<div className="shadow-qf-glow">
  Элемент со свечением
</div>
```

### 4. Утилитарные функции

```typescript
import { 
  generateQuantumCSSVars,
  getStatusColor,
  getGradient 
} from '@/lib/quantum-theme';

// Генерация CSS переменных (для кастомных стилей)
const cssVars = generateQuantumCSSVars();

// Получение цветов статуса
const highPriority = getStatusColor('high');
// { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' }

// Получение градиента
const primaryGradient = getGradient('primary');
// 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)'
```

## Цветовая палитра

### Основные цвета
- **Фиолетовый**: `#8B5CF6` (`qf-purple`)
- **Голубой**: `#06B6D4` (`qf-blue`)

### Фоны
- **Основной**: `#0A0A0F` (`qf-bg-primary`)
- **Вторичный**: `#121218` (`qf-bg-secondary`)
- **Третичный**: `#1A1A22` (`qf-bg-tertiary`)
- **Стеклянный**: `rgba(18, 18, 24, 0.8)` (`qf-bg-glass`)

### Текст
- **Основной**: `#FFFFFF` (`qf-text-primary`)
- **Вторичный**: `#A0A0B0` (`qf-text-secondary`)
- **Приглушенный**: `#6B6B7A` (`qf-text-muted`)
- **Акцентный**: `#8B5CF6` (`qf-text-accent`)

### Границы
- **Основная**: `rgba(255, 255, 255, 0.1)` (`qf-border-primary`)
- **Вторичная**: `rgba(255, 255, 255, 0.05)` (`qf-border-secondary`)
- **Акцентная**: `rgba(139, 92, 246, 0.3)` (`qf-border-accent`)
- **Стеклянная**: `rgba(255, 255, 255, 0.15)` (`qf-border-glass`)

## Градиенты

### Основные
- **primary**: `linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)`
- **subtle**: `linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)`
- **hover**: `linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)`

### Фоновые
- **background**: `linear-gradient(135deg, #0A0A0F 0%, #121218 100%)`
- **card**: `linear-gradient(135deg, #121218 0%, #1A1A22 100%)`
- **text**: `linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)`

## Анимации

### Готовые классы
- `animate-quantum-pulse` - плавная пульсация (2s)
- `animate-quantum-glow` - пульсирующее свечение (3s)
- `animate-quantum-float` - плавное парение (6s)

### Длительности
- **fast**: 150ms
- **normal**: 300ms
- **slow**: 500ms

### Кривые Безье
- **default**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **bounce**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`

## Статусы

### Приоритеты задач
- **high**: Красный (`#EF4444`) с прозрачным фоном
- **medium**: Оранжевый (`#F59E0B`) с прозрачным фоном
- **low**: Зеленый (`#22C55E`) с прозрачным фоном
- **completed**: Фиолетовый (`#8B5CF6`) с прозрачным фоном

## Стеклянные эффекты

### Готовые классы
- `glass` - стандартный стеклянный эффект
- `glass-light` - светлый стеклянный эффект
- `glass-dark` - темный стеклянный эффект

### Tailwind утилиты
```tsx
<div className="backdrop-blur-lg bg-qf-bg-glass border-qf-border-glass">
  Кастомный стеклянный эффект
</div>
```

## Обновление темы

### 1. Изменение в `quantum-theme.ts`
```typescript
// Измените значение цвета
export const quantumColors = {
  purple: '#НовыйФиолетовый',
  // ...
};
```

### 2. Обновление CSS переменных
```typescript
// Используйте generateQuantumCSSVars() для получения новых значений
import { generateQuantumCSSVars } from '@/lib/quantum-theme';
console.log(generateQuantumCSSVars());
```

### 3. Вставка в `globals.css`
Замените значения в блоке `:root` в `globals.css` на сгенерированные.

## Best Practices

1. **Всегда импортируйте из `quantum-theme.ts`** - не дублируйте значения
2. **Используйте готовые классы** когда возможно
3. **Для кастомных стилей** используйте Tailwind классы с префиксом `qf-`
4. **Проверяйте синхронизацию** при изменении цветов
5. **Документируйте изменения** в теме

## Troubleshooting

### Проблема: Цвета не обновляются
**Решение:** Убедитесь, что обновили:
1. `quantum-theme.ts`
2. CSS переменные в `globals.css`
3. Перезапустили dev сервер

### Проблема: Tailwind классы не работают
**Решение:** Проверьте:
1. Импортирован ли `globals.css` в `layout.tsx`
2. Корректность конфигурации в `tailwind.config.ts`
3. Перезапустили dev сервер

### Проблема: Стеклянные эффекты не отображаются
**Решение:** Убедитесь, что:
1. Браузер поддерживает `backdrop-filter`
2. Используете правильные классы (`glass`, `glass-light`, `glass-dark`)
3. Фон имеет достаточную прозрачность