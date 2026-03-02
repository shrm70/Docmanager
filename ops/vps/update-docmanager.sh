#!/usr/bin/env bash
set -euo pipefail

DOC_HOME="/home/docmanager"
APP_DIR="$DOC_HOME/docmanager"
WEB_DIR="/var/www/docmanager/current"

runuser -u docmanager -- bash -lc 'cd "$HOME/docmanager" && git fetch origin main && git reset --hard origin/main'
runuser -u docmanager -- bash -lc 'cd "$HOME/docmanager" && source "$HOME/.nvm/nvm.sh" && npm ci --no-audit --no-fund'
runuser -u docmanager -- bash -lc 'cd "$HOME/docmanager" && source "$HOME/.nvm/nvm.sh" && export VITE_API_BASE_URL=/docmanager-api && npm run build'

mkdir -p "$WEB_DIR"
rsync -a --delete "$APP_DIR/apps/web/dist/" "$WEB_DIR/"

systemctl restart docmanager-api.service
systemctl restart docmanager-worker.service
systemctl reload apache2

curl -fsS http://127.0.0.1:8787/health
