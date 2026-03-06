#!/bin/bash
set -e

echo "=== Kiosk Deploy ==="

# echo ">> Navigating to ~/src/kiosk..."
# cd ~/src/kiosk

echo ">> Pulling latest code (overriding local changes)..."
git fetch origin
git reset --hard origin/$(git rev-parse --abbrev-ref HEAD)
git clean -fd

echo ">> Installing dependencies..."
npm install

echo ">> Building application..."
npm run build

echo ">> Starting kiosk server..."
npm start
