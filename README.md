# Kiosk — Digital Signage

Next.js digital signage app for Raspberry Pi. Displays rotating images, videos, and website pages configured via a local admin UI.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the display and [http://localhost:3000/admin](http://localhost:3000/admin) for configuration.

## Raspberry Pi Kiosk Setup

### Requirements

- Raspberry Pi 4 or 5 (recommended)
- Raspberry Pi OS Desktop (64-bit, Bookworm or newer)
- Network connection (for website pages and initial font load)

### First-time install

Clone the repo on the Pi (default path `/home/pi/kiosk`):

```bash
cd ~
git clone <your-repo-url> kiosk
cd kiosk
bash deploy/install-pi.sh
sudo reboot
```

After reboot, the Pi should:

1. Start the Next.js server via systemd (`kiosk-app`)
2. Autologin to the desktop
3. Launch Chromium in fullscreen kiosk mode at `http://127.0.0.1:3000`

### Updating

From the project directory on the Pi:

```bash
./deploy.sh
```

This pulls the latest code, rebuilds, copies standalone assets, and restarts the `kiosk-app` service. Uploaded media in `data/uploads/` is preserved (gitignored).

### URLs

| Purpose          | URL                                |
| ---------------- | ---------------------------------- |
| Display (on Pi)  | `http://localhost:3000`            |
| Admin (from LAN) | `http://<pi-ip>:3000/admin`        |
| Health check     | `http://localhost:3000/api/health` |

Set `HOSTNAME=127.0.0.1` in `.env` if you only want the server reachable on the Pi itself.

### Environment

Copy `.env.example` to `.env`:

```bash
PORT=3000
HOSTNAME=0.0.0.0
NODE_ENV=production
```

### Troubleshooting

**Service not running**

```bash
sudo systemctl status kiosk-app
journalctl -u kiosk-app -f
```

**App not ready**

```bash
curl http://127.0.0.1:3000/api/health
```

**Chromium did not start**

- Confirm autologin: `sudo raspi-config` → System Options → Boot / Auto Login → Desktop Autologin
- Check labwc autostart: `~/.config/labwc/autostart`
- Run the browser script manually: `~/kiosk/deploy/scripts/start-kiosk-browser.sh`
- On Bookworm, install `chromium` (not `chromium-browser`): `sudo apt-get install -y chromium`

**Older Raspberry Pi OS (LXDE)**

Add to `~/.config/lxsession/LXDE-pi/autostart`:

```
@/home/pi/kiosk/deploy/scripts/start-kiosk-browser.sh
```

### Security note

The admin UI has no authentication. If `HOSTNAME=0.0.0.0`, restrict port 3000 to your LAN with a firewall (e.g. `ufw allow from 192.168.0.0/24 to any port 3000`).

## Project structure

- `src/app/page.tsx` — kiosk display
- `src/app/admin/` — configuration UI
- `data/config.json` — page definitions (gitignored, created on first run)
- `data/uploads/` — uploaded media (gitignored)
- `deploy/` — Pi systemd, browser scripts, and install helpers

## Scripts

| Script                      | Purpose                                 |
| --------------------------- | --------------------------------------- |
| `deploy/install-pi.sh`      | One-time Pi setup                       |
| `deploy.sh`                 | Pull, build, restart service            |
| `deploy/copy-standalone.sh` | Copy static files into standalone build |
