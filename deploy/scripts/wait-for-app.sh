#!/bin/bash
set -e

HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-60}"
SLEEP_SECS="${SLEEP_SECS:-2}"

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if curl -sf "$HEALTH_URL" >/dev/null; then
    exit 0
  fi
  echo "Waiting for kiosk app ($attempt/$MAX_ATTEMPTS)..."
  sleep "$SLEEP_SECS"
  attempt=$((attempt + 1))
done

echo "Kiosk app did not become ready in time: $HEALTH_URL" >&2
exit 1
