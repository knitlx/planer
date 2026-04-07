#!/bin/bash
# Быстрый деплой на VPS с оптимизациями

set -e

echo "=== Быстрый деплой Planer ==="

# Увеличиваем память для Node.js
export NODE_OPTIONS="--max-old-space-size=1536"

cd ~/planer

echo "→ Pull из git..."
git pull origin main

echo "→ Установка зависимостей..."
npm ci --production=false

echo "→ Очистка кэша (если завис)..."
rm -rf .next/cache 2>/dev/null || true

echo "→ Сборка..."
npm run build

echo "→ Перезапуск PM2..."
pm2 restart planer --update-env
pm2 save

echo "=== Готово! ==="
