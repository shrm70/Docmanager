#!/usr/bin/env bash
set -euo pipefail

DOC_ROOT="/home/docmanager/docmanager"
BACKUP_ROOT="/home/docmanager/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET_DIR="$BACKUP_ROOT/$STAMP"

mkdir -p "$TARGET_DIR"

tar -czf "$TARGET_DIR/runtime-data.tar.gz" -C "$DOC_ROOT" data/runtime
cp "$DOC_ROOT/.env" "$TARGET_DIR/.env"
cp /etc/systemd/system/docmanager-api.service "$TARGET_DIR/docmanager-api.service"
cp /etc/systemd/system/docmanager-worker.service "$TARGET_DIR/docmanager-worker.service"
cp /etc/apache2/sites-available/sunsolutions.com.np.conf "$TARGET_DIR/sunsolutions.com.np.conf"
cp /etc/apache2/sites-available/sunsolutions.com.np-le-ssl.conf "$TARGET_DIR/sunsolutions.com.np-le-ssl.conf"

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +

echo "Backup completed at $TARGET_DIR"
