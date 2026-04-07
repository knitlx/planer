#!/bin/bash
# SQLite backup script for Planer

set -e

APP_DIR="${APP_DIR:-~/planer}"
BACKUP_DIR="${BACKUP_DIR:-~/backups/planer}"
DB_FILE="${APP_DIR}/dev.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/dev_${DATE}.db"
RETENTION_DAYS=7

echo "=== SQLite Backup ==="
echo "Database: ${DB_FILE}"
echo "Backup: ${BACKUP_FILE}"

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# Check if database exists
if [ ! -f "${DB_FILE}" ]; then
    echo "Error: Database file not found: ${DB_FILE}"
    exit 1
fi

# Create backup using SQLite .backup command (safe, online backup)
if command -v sqlite3 &> /dev/null; then
    sqlite3 "${DB_FILE}" ".backup '${BACKUP_FILE}'"
    echo "✓ Backup created with sqlite3 .backup"
else
    # Fallback: copy file (less safe, but works)
    cp "${DB_FILE}" "${BACKUP_FILE}"
    echo "✓ Backup created with cp (sqlite3 not available)"
fi

# Compress backup
gzip "${BACKUP_FILE}"
echo "✓ Compressed: ${BACKUP_FILE}.gz"

# Clean up old backups (keep last 7 days)
find "${BACKUP_DIR}" -name "dev_*.db.gz" -mtime +${RETENTION_DAYS} -delete
echo "✓ Cleaned up backups older than ${RETENTION_DAYS} days"

# List current backups
echo ""
echo "Current backups:"
ls -lh "${BACKUP_DIR}"/*.db.gz 2>/dev/null || echo "No backups found"

echo ""
echo "=== Backup complete ==="
