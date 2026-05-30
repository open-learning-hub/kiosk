#!/bin/bash
# Enforce daily on-window power schedule (Pi 5 RTC wake). Run as root via kiosk-power.timer.
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/home/pi/kiosk}"
CONFIG_FILE="${INSTALL_DIR}/data/config.json"
RTC_WAKE="/sys/class/rtc/rtc0/wakealarm"
LOG_TAG="kiosk-power"

log() {
  echo "[$LOG_TAG] $*"
}

if ! command -v jq >/dev/null 2>&1; then
  log "jq not installed; skipping"
  exit 0
fi

if [ ! -f "$CONFIG_FILE" ]; then
  log "config not found at $CONFIG_FILE; skipping"
  exit 0
fi

ENABLED=$(jq -r '.schedule.enabled // false' "$CONFIG_FILE")
if [ "$ENABLED" != "true" ]; then
  exit 0
fi

ON_TIME=$(jq -r '.schedule.onTime // "09:00"' "$CONFIG_FILE")
OFF_TIME=$(jq -r '.schedule.offTime // "17:00"' "$CONFIG_FILE")
WAKE_LEAD=$(jq -r '.schedule.wakeLeadMinutes // 1' "$CONFIG_FILE")
mapfile -t DAYS_OF_WEEK < <(jq -r '.schedule.daysOfWeek // [1,2,3,4,5,6,7] | .[]' "$CONFIG_FILE")

time_to_minutes() {
  local t="$1"
  local h="${t%%:*}"
  local m="${t##*:}"
  echo $((10#$h * 60 + 10#$m))
}

day_enabled() {
  local dow="$1"
  local d
  for d in "${DAYS_OF_WEEK[@]}"; do
    if [ "$d" = "$dow" ]; then
      return 0
    fi
  done
  return 1
}

ON_MIN=$(time_to_minutes "$ON_TIME")
OFF_MIN=$(time_to_minutes "$OFF_TIME")
NOW_MIN=$(time_to_minutes "$(date +%H:%M)")
TODAY_DOW=$(date +%u)
NOW_EPOCH=$(date +%s)

inside_window=0
if [ "$ON_MIN" -lt "$OFF_MIN" ]; then
  if [ "$NOW_MIN" -ge "$ON_MIN" ] && [ "$NOW_MIN" -lt "$OFF_MIN" ]; then
    inside_window=1
  fi
else
  if [ "$NOW_MIN" -ge "$ON_MIN" ] || [ "$NOW_MIN" -lt "$OFF_MIN" ]; then
    inside_window=1
  fi
fi

if day_enabled "$TODAY_DOW" && [ "$inside_window" -eq 1 ]; then
  exit 0
fi

if [ ! -w "$RTC_WAKE" ] 2>/dev/null && [ "$(id -u)" -ne 0 ]; then
  log "RTC wakealarm not writable; run as root"
  exit 1
fi

WAKE_AT=""
for offset in $(seq 0 13); do
  CAND_DATE=$(date -d "+${offset} days" +%Y-%m-%d)
  CAND_DOW=$(date -d "$CAND_DATE" +%u)
  if ! day_enabled "$CAND_DOW"; then
    continue
  fi
  CAND_WAKE=$(date -d "${CAND_DATE} ${ON_TIME}:00 - ${WAKE_LEAD} minutes" +%s)
  if [ "$CAND_WAKE" -gt "$NOW_EPOCH" ]; then
    WAKE_AT="$CAND_WAKE"
    break
  fi
done

if [ -z "$WAKE_AT" ]; then
  log "No enabled day found in the next 14 days; skipping poweroff"
  exit 1
fi

if day_enabled "$TODAY_DOW"; then
  log "Outside window (${ON_TIME}-${OFF_TIME}) on enabled day; wake at $(date -d "@${WAKE_AT}" +%Y-%m-%d\ %H:%M:%S), powering off"
else
  log "Today (dow ${TODAY_DOW}) disabled; wake at $(date -d "@${WAKE_AT}" +%Y-%m-%d\ %H:%M:%S), powering off"
fi

echo 0 >"$RTC_WAKE"
echo "$WAKE_AT" >"$RTC_WAKE"

systemctl poweroff
