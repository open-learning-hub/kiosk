#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIOSK_URL="${KIOSK_URL:-http://127.0.0.1:3000}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-90}"
SLEEP_SECS="${SLEEP_SECS:-2}"

LOG_DIR="${HOME}/.local/share/kiosk"
mkdir -p "$LOG_DIR"
exec >>"$LOG_DIR/browser.log" 2>&1
echo "=== $(date -Iseconds) start-kiosk-browser ==="

if command -v xset >/dev/null 2>&1; then
  xset s off || true
  xset -dpms || true
  xset s noblank || true
fi

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if curl -sf "$HEALTH_URL" >/dev/null; then
    echo "Kiosk app ready (attempt $attempt)"
    break
  fi
  echo "Waiting for kiosk app ($attempt/$MAX_ATTEMPTS)..."
  sleep "$SLEEP_SECS"
  attempt=$((attempt + 1))
done

if [ "$attempt" -gt "$MAX_ATTEMPTS" ]; then
  echo "Kiosk app did not become ready: $HEALTH_URL" >&2
  exit 1
fi

CHROMIUM_BIN=""
for candidate in chromium chromium-browser google-chrome; do
  if command -v "$candidate" >/dev/null 2>&1; then
    CHROMIUM_BIN="$candidate"
    break
  fi
done

if [ -z "$CHROMIUM_BIN" ]; then
  echo "Chromium not found. Install chromium." >&2
  exit 1
fi

CHROMIUM_ARGS=(
  --kiosk
  --noerrdialogs
  --disable-infobars
  --password-store=basic
  --check-for-update-interval=31536000
  --autoplay-policy=no-user-gesture-required
)

if [ "${XDG_SESSION_TYPE:-}" = "wayland" ]; then
  CHROMIUM_ARGS+=(--ozone-platform=wayland)
fi

echo "Launching $CHROMIUM_BIN -> $KIOSK_URL"
exec "$CHROMIUM_BIN" "${CHROMIUM_ARGS[@]}" "$KIOSK_URL"
