#!/bin/bash
# Copy static assets into the Next.js standalone output (required after each build).
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d ".next/standalone" ]; then
  echo "Standalone build not found. Run: npm run build" >&2
  exit 1
fi

cp -r .next/static .next/standalone/.next/static

if [ -d "public" ]; then
  cp -r public .next/standalone/public
fi

echo "Standalone assets copied."
