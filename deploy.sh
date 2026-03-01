#!/bin/bash
set -e

echo "=== Rickert Kiosk Deploy ==="

echo ">> Navigating to ~/src/kiosk..."
cd ~/src/kiosk

echo ">> Pulling latest code..."
git pull

echo ">> Building application..."
npm run build

echo ">> Starting kiosk server..."
npm start
