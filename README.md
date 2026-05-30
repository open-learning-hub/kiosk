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

**`status=217/USER` / "Failed to determine user credentials"**

The systemd unit is configured for a user that does not exist on this Pi (e.g. `User=pi` when your account is `kiosk-talisman`). Re-run install from the repo directory so the service is regenerated for the current user:

```bash
bash deploy/install-pi.sh
sudo systemctl status kiosk-app
```

**App not ready**

```bash
curl http://127.0.0.1:3000/api/health
```

**Chromium did not start**

- Confirm autologin: `sudo raspi-config` → System Options → Boot / Auto Login → Desktop Autologin
- Check which compositor is running: `echo $XDG_SESSION_TYPE` and `ps -e | grep -Ei 'labwc|wayfire|lxsession'`
- Verify autostart (re-run `bash deploy/install-pi.sh` to refresh):
  - XDG (primary on Pi 5 labwc): `~/.config/autostart/kiosk-browser.desktop`
  - labwc: `~/.config/labwc/autostart`
  - Wayfire: `~/.config/wayfire.ini` → `[autostart]` section
  - LXDE/X11: `~/.config/lxsession/LXDE-pi/autostart`
- Check launcher log: `tail -30 ~/.local/share/kiosk/browser.log`
- Run the browser script manually from your repo: `<install-dir>/deploy/scripts/start-kiosk-browser.sh`
- On Bookworm, install `chromium` (not `chromium-browser`): `sudo apt-get install -y chromium`

Quick validation after install + reboot:

```bash
systemctl is-active kiosk-app && curl -sf http://127.0.0.1:3000/api/health
cat ~/.config/autostart/kiosk-browser.desktop
pgrep -a chromium
tail -20 ~/.local/share/kiosk/browser.log
```

**"Unlock Keyring / Authentication required" dialog**

On autologin, GNOME Keyring stays locked. Install sets `--password-store=basic` in `~/.config/chromium-flags.conf` and `/etc/chromium.d/99-kiosk-flags` (or `chromium-browser/customizations`) so menu and autostart launches avoid the prompt. Re-run `bash deploy/install-pi.sh` after pulling updates. For kiosk mode, rely on autostart rather than the desktop menu icon.

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
