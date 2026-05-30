#!/bin/bash
set -e

echo "=== Kiosk Deploy ==="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo ">> Pulling latest code (overriding local changes)..."
git fetch origin
git reset --hard "origin/$(git rev-parse --abbrev-ref HEAD)"
git clean -fd

echo ">> Installing dependencies..."
npm ci

echo ">> Building application..."
npm run build

echo ">> Copying standalone assets..."
bash deploy/copy-standalone.sh

if systemctl is-active --quiet kiosk-app 2>/dev/null; then
  echo ">> Restarting kiosk-app service..."
  sudo systemctl restart kiosk-app
else
  echo ">> kiosk-app service not found or inactive."
  echo "   Run deploy/install-pi.sh for first-time setup, or start manually with: npm start"
fi

echo "Deploy complete."
