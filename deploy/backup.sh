#!/usr/bin/env bash
# Snapshot all Sagely data (accounts, minds, knowledge, conversations) into ./backups.
# Works for both the Docker and the systemd install. Keeps the newest $KEEP archives.
set -euo pipefail

cd "$(dirname "$0")/.."
KEEP="${KEEP:-14}"
OUT_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/sagely-$STAMP.tar.gz"

if command -v docker >/dev/null && docker compose ps --status running app 2>/dev/null | grep -q app; then
  docker compose exec -T app tar czf - -C /app data > "$FILE"
else
  DATA_DIR="${DATA_DIR:-./data}"
  tar czf "$FILE" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"
fi

echo "Backup written to $FILE ($(du -h "$FILE" | cut -f1))"
ls -1t "$OUT_DIR"/sagely-*.tar.gz | tail -n +"$((KEEP + 1))" | xargs -r rm --
