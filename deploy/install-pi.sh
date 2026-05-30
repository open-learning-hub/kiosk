#!/bin/bash
# One-time Raspberry Pi setup for kiosk mode.
set -e

KIOSK_USER="${KIOSK_USER:-pi}"

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this script as the $KIOSK_USER user (not root)." >&2
  echo "Example: bash deploy/install-pi.sh" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="${INSTALL_DIR:-$ROOT_DIR}"
cd "$ROOT_DIR"

echo "=== Kiosk Pi install ==="
echo "Install directory: $INSTALL_DIR"

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

echo ">> Installing systemd service..."
sudo sed "s|/home/pi/kiosk|$INSTALL_DIR|g" deploy/systemd/kiosk-app.service \
  | sudo tee /etc/systemd/system/kiosk-app.service >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable kiosk-app
sudo systemctl restart kiosk-app

echo ">> Configuring desktop autologin..."
sudo raspi-config nonint do_boot_behaviour B4 || true

echo ">> Installing labwc autostart..."
mkdir -p "$HOME/.config/labwc"
AUTOSTART_PATH="$HOME/.config/labwc/autostart"
sed "s|/home/pi/kiosk|$INSTALL_DIR|g" deploy/desktop/labwc-autostart >"$AUTOSTART_PATH"
chmod +x "$INSTALL_DIR/deploy/scripts/start-kiosk-browser.sh"

echo ">> Ensuring data directory exists..."
mkdir -p "$INSTALL_DIR/data/uploads"

echo ""
echo "Install complete."
echo "  Display:  http://127.0.0.1:3000"
echo "  Admin:    http://$(hostname -I | awk '{print $1}'):3000/admin"
echo "  Service:  sudo systemctl status kiosk-app"
echo ""
echo "Reboot to start kiosk mode: sudo reboot"
