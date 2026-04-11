#!/bin/bash
# PostgreSQL backup script for all databases (except templates)

set -e

BACKUP_DIR="${BACKUP_DIR:-~/backups/postgres}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
CONTAINER_NAME="postgres"
EXCLUDED_DBS="template0 template1"

echo "=== PostgreSQL Backup ==="

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Get list of databases (exclude templates)
DBS=$(docker exec "${CONTAINER_NAME}" psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres';" | tr -d ' ' | grep -v '^$')

if [ -z "${DBS}" ]; then
    echo "Error: No user databases found"
    exit 1
fi

echo "Databases to backup: ${DBS}"
echo ""

for DB in ${DBS}; do
    BACKUP_FILE="${BACKUP_DIR}/${DB}_${DATE}.sql.gz"
    echo "--- Back uping ${DB} ---"
    
    # Create compressed dump
    docker exec "${CONTAINER_NAME}" pg_dump -U postgres -d "${DB}" | gzip > "${BACKUP_FILE}"
    
    echo "✓ ${DB}: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"
    echo ""
done

# Clean up old backups
echo "--- Cleanup ---"
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "✓ Cleaned up backups older than ${RETENTION_DAYS} days"

# List current backups
echo ""
echo "Current backups:"
ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "No backups found"

# Show total backup size
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
echo ""
echo "Total backup size: ${TOTAL_SIZE}"
echo ""
echo "=== PostgreSQL backup complete ==="
