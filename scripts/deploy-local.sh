#!/bin/bash
# Быстрый деплой через локальную сборку

set -e

echo "=== Локальная сборка и деплой на VPS ==="

# 1. Сборка локально
echo "→ Сборка проекта..."
npm run build

# 2. Копируем на VPS только необходимое
echo "→ Копирование на VPS..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next/cache' \
  --exclude='*.log' \
  ./ knitlx@45.144.235.234:~/planer/

# 3. Перезапуск на VPS
echo "→ Перезапуск..."
ssh knitlx@45.144.235.234 'source ~/.nvm/nvm.sh && cd ~/planer && pm2 restart planer && pm2 save'

echo "=== Готово! ==="
