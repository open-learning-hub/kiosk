#!/bin/bash
# One-time Raspberry Pi setup for kiosk mode.
set -e

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this script as your kiosk user (not root)." >&2
  echo "Example: bash deploy/install-pi.sh" >&2
  exit 1
fi

KIOSK_USER="${KIOSK_USER:-$(id -un)}"
KIOSK_GROUP="${KIOSK_GROUP:-$(id -gn)}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="${INSTALL_DIR:-$ROOT_DIR}"
cd "$ROOT_DIR"

echo "=== Kiosk Pi install ==="
echo "Install directory: $INSTALL_DIR"
echo "Service user:      $KIOSK_USER ($KIOSK_GROUP)"

echo ">> Installing system packages..."
sudo apt-get update

# Package name differs by OS: chromium (Bookworm+) vs chromium-browser (Bullseye)
if apt-cache show chromium >/dev/null 2>&1; then
  CHROMIUM_PKG="chromium"
else
  CHROMIUM_PKG="chromium-browser"
fi

sudo apt-get install -y curl git "$CHROMIUM_PKG"

if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  echo ">> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo ">> Installing npm dependencies..."
npm ci

echo ">> Building application..."
npm run build

echo ">> Copying standalone assets..."
bash deploy/copy-standalone.sh

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    cat > .env <<'EOF'
PORT=3000
HOSTNAME=0.0.0.0
NODE_ENV=production
EOF
  fi
  echo ">> Created .env"
else
  echo ">> Keeping existing .env"
fi

echo ">> Making deploy scripts executable..."
chmod +x deploy/scripts/wait-for-app.sh
chmod +x deploy/scripts/start-kiosk-browser.sh
chmod +x deploy/copy-standalone.sh

KIOSK_LAUNCHER="$INSTALL_DIR/deploy/scripts/start-kiosk-browser.sh"
chmod +x "$KIOSK_LAUNCHER"

echo ">> Configuring desktop autologin..."
sudo raspi-config nonint do_boot_behaviour B4 || true

echo ">> Installing desktop autostart (labwc, Wayfire, LXDE)..."
mkdir -p "$HOME/.config/labwc"
LABWC_AUTOSTART="$HOME/.config/labwc/autostart"
if ! grep -qF "$KIOSK_LAUNCHER" "$LABWC_AUTOSTART" 2>/dev/null; then
  echo "\"$KIOSK_LAUNCHER\" &" >>"$LABWC_AUTOSTART"
fi

mkdir -p "$HOME/.config/lxsession/LXDE-pi"
LXDE_AUTOSTART="$HOME/.config/lxsession/LXDE-pi/autostart"
if ! grep -qF "$KIOSK_LAUNCHER" "$LXDE_AUTOSTART" 2>/dev/null; then
  echo "@$KIOSK_LAUNCHER" >>"$LXDE_AUTOSTART"
fi

WAYFIRE_INI="$HOME/.config/wayfire.ini"
mkdir -p "$HOME/.config"
if ! grep -qF "$KIOSK_LAUNCHER" "$WAYFIRE_INI" 2>/dev/null; then
  if [ -f "$WAYFIRE_INI" ] && grep -q '^\[autostart\]' "$WAYFIRE_INI"; then
    sed -i "/^\[autostart\]/a kiosk = $KIOSK_LAUNCHER" "$WAYFIRE_INI"
  elif [ -f "$WAYFIRE_INI" ]; then
    printf '\n[autostart]\nkiosk = %s\n' "$KIOSK_LAUNCHER" >>"$WAYFIRE_INI"
  else
    cat >"$WAYFIRE_INI" <<EOF
[autostart]
kiosk = $KIOSK_LAUNCHER
EOF
  fi
fi

echo ">> Installing systemd service..."
sudo sed \
  -e "s|__INSTALL_DIR__|$INSTALL_DIR|g" \
  -e "s|__KIOSK_USER__|$KIOSK_USER|g" \
  -e "s|__KIOSK_GROUP__|$KIOSK_GROUP|g" \
  deploy/systemd/kiosk-app.service \
  | sudo tee /etc/systemd/system/kiosk-app.service >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable kiosk-app
sudo systemctl restart kiosk-app || true
if ! sudo systemctl is-active --quiet kiosk-app; then
  echo "WARN: kiosk-app is not active. Check: journalctl -u kiosk-app -n 30" >&2
fi

echo ">> Ensuring data directory exists..."
mkdir -p "$INSTALL_DIR/data/uploads"

echo ""
echo "Install complete."
echo "  Display:  http://127.0.0.1:3000"
echo "  Admin:    http://$(hostname -I | awk '{print $1}'):3000/admin"
echo "  Service:  sudo systemctl status kiosk-app"
echo ""
echo "Reboot to start kiosk mode: sudo reboot"
