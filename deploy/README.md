# Deploy diagnostics (Raspberry Pi)

Run from a desktop terminal on the Pi (adjust paths if the repo is not `~/kiosk`).

## A. Compositor / session

```bash
echo "session=$XDG_SESSION_TYPE"
ps -e | grep -Ei 'labwc|wayfire|lxsession|lxqt' | grep -v grep
```

## B. App server

```bash
systemctl status kiosk-app --no-pager | head -n 15
curl -sf http://127.0.0.1:3000/api/health && echo "HEALTH OK" || echo "HEALTH FAIL"
```

## C. Autostart entries

```bash
echo '--- XDG autostart ---'
cat ~/.config/autostart/kiosk-browser.desktop 2>/dev/null
echo '--- labwc ---'
cat ~/.config/labwc/autostart 2>/dev/null
echo '--- wayfire ---'
grep -A5 '^\[autostart\]' ~/.config/wayfire.ini 2>/dev/null
echo '--- lxde ---'
cat ~/.config/lxsession/LXDE-pi/autostart 2>/dev/null
```

## D. Chromium flags (keyring)

```bash
cat ~/.config/chromium-flags.conf 2>/dev/null
ls /etc/chromium.d/99-kiosk-flags 2>/dev/null \
  || ls /etc/chromium-browser/customizations/99-kiosk-flags 2>/dev/null
```

## E. Browser launcher log

```bash
tail -30 ~/.local/share/kiosk/browser.log 2>/dev/null
```

## F. Run launcher manually

```bash
/path/to/your/repo/deploy/scripts/start-kiosk-browser.sh
```

Replace `/path/to/your/repo` with the directory where you cloned the kiosk project.
