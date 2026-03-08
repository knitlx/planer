# 🤖 Telegram Reminder Bot - Инструкция

## Быстрый старт

### 1. Проверить что всё работает

```bash
cd /Users/knitlx/projects/Новая\ папка/reminders
python3 reminder_bot.py --list
```

## 🧠 Smart Reminders (Planer app)

Cron-скрипт приложения вызывает orchestrator `/api/reminders/check` и отдаёт JSON summary.

### Переменные окружения (AI news digest)

- `AI_NEWS_LLM_API_URL` — URL LLM API.
- `AI_NEWS_LLM_API_KEY` — ключ доступа (не храните в коде).
- `AI_NEWS_LLM_MODEL` — модель для классификации.
- `AI_NEWS_INTERESTS` — интересы (через запятую или перенос строки).
- `SMART_REMINDERS_BASE_URL` — базовый URL приложения (по умолчанию `http://localhost:3000`).

### Cron пример (каждые 10 минут)

```bash
*/10 * * * * cd "/Users/knitlx/projects/Planer/.worktrees/smart-reminders-phase2" && node scripts/check-reminders.mjs full >> /tmp/reminders-cron.log 2>&1
```

### 2. Добавить новую задачу

```bash
# Одноразовая задача
python3 reminder_bot.py --add "Позвонить маме" --time "19:00"

# Ежедневная задача
python3 reminder_bot.py --add "Проверить почту" --time "09:00" --recurring daily

# Еженедельная задача  
python3 reminder_bot.py --add "Обновить бэкапы" --time "20:00" --recurring weekly
```

### 3. Проверить задачи

```bash
python3 reminder_bot.py --list
```

### 4. Отправить напоминания вручную

```bash
python3 reminder_bot.py --check
```

## 🕐 Настройка автоматического запуска (cron)

### Вариант 1: Проверка каждую минуту (точные напоминания)

```bash
# Открываем cron
export EDITOR=nano && crontab -e

# Добавляем строку:
* * * * * cd "/Users/knitlx/projects/Новая папка/reminders" && /usr/local/bin/python3 reminder_bot.py --check >> /tmp/reminder.log 2>&1
```

### Вариант 2: Проверка каждые 5 минут (экономнее)

```bash
*/5 * * * * cd "/Users/knitlx/projects/Новая папка/reminders" && /usr/local/bin/python3 reminder_bot.py --check >> /tmp/reminder.log 2>&1
```

### Вариант 3: Только в рабочие часы (9:00-18:00)

```bash
*/5 9-18 * * 1-5 cd "/Users/knitlx/projects/Новая папка/reminders" && /usr/local/bin/python3 reminder_bot.py --check >> /tmp/reminder.log 2>&1
```

## 📋 Формат tasks.json

```json
{
  "tasks": [
    {
      "id": 1,
      "text": "Текст напоминания",
      "datetime": "2025-02-18T15:00:00",
      "recurring": "daily|weekly|null",
      "enabled": true|false
    }
  ]
}
```

## 🔧 Команды

| Команда | Описание |
|---------|----------|
| `--check` | Проверить и отправить напоминания |
| `--list` | Показать все предстоящие задачи |
| `--add "текст" --time "HH:MM"` | Добавить задачу |
| `--recurring daily` | Сделать задачу ежедневной |

## 📁 Файлы

- `tasks.json` - хранилище задач
- `.sent_tasks` - история отправленных (автоматически)
- `reminder_bot.py` - сам скрипт

## 💡 Примеры использования

### Ежедневная рутина
```bash
python3 reminder_bot.py --add "Утренняя зарядка" --time "08:00" --recurring daily
python3 reminder_bot.py --add "Проверить почту" --time "09:30" --recurring daily
python3 reminder_bot.py --add "Обеденный перерыв" --time "13:00" --recurring daily
```

### Рабочие задачи
```bash
python3 reminder_bot.py --add "Standup встреча" --time "10:00" --recurring daily
python3 reminder_bot.py --add "Code review" --time "16:00" --recurring daily
```

### Важные события
```bash
python3 reminder_bot.py --add "Позвонить клиенту" --time "15:00"
python3 reminder_bot.py --add "Оплатить хостинг" --time "09:00"
```

## ❌ Остановка

```bash
# Удалить из cron
crontab -e
# Удалить строку с reminder_bot.py
```

## 🐛 Отладка

```bash
# Посмотреть логи
tail -f /tmp/reminder.log

# Проверить работу cron
grep CRON /var/log/syslog  # Linux
```
