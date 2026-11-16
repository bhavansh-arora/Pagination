#!/usr/bin/env bash
# Upload ./public to the VPS. Usage:
#   DEPLOY_HOST=user@your-vps-ip ./deploy/deploy.sh
# Optional: DEPLOY_PATH (default /var/www/codebunny)
set -euo pipefail
: "${DEPLOY_HOST:?Set DEPLOY_HOST, e.g. DEPLOY_HOST=root@203.0.113.10}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/codebunny}"
cd "$(dirname "$0")/.."
python3 tools/build.py
rsync -avz --delete --exclude '.DS_Store' public/ "$DEPLOY_HOST:$DEPLOY_PATH/"
echo "Deployed to $DEPLOY_HOST:$DEPLOY_PATH. Reload Caddy if you changed the Caddyfile: ssh $DEPLOY_HOST 'sudo systemctl reload caddy'"
