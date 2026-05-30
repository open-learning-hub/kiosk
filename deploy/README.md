# A. Which compositor/session is actually running?

echo "session=$XDG_SESSION_TYPE"
ps -e | grep -Ei 'labwc|wayfire|lxsession|lxqt|wayfire' | grep -v grep

# B. Is the app server healthy?

systemctl status kiosk-app --no-pager | head -n 15
curl -sf http://127.0.0.1:3000/api/health && echo "HEALTH OK" || echo "HEALTH FAIL"

# C. Are our autostart entries present?

echo '--- labwc ---'; cat ~/.config/labwc/autostart 2>/dev/null
echo '--- wayfire ---'; cat ~/.config/wayfire.ini 2>/dev/null
echo '--- lxde ---'; cat ~/.config/lxsession/LXDE-pi/autostart 2>/dev/null

# D. Run the launcher by hand and watch what it does

~/kiosk/deploy/scripts/start-kiosk-browser.sh
● kiosk-app.service - Kiosk Next.js application
     Loaded: loaded (/etc/systemd/system/kiosk-app.service; enabled; preset: enabled)
     Active: activating (auto-restart) (Result: exit-code) since Sat 2026-05-30 14:37:48 SAST; 586ms ago
 Invocation: 331351dda38a40269ab723eec28b993b
    Process: 2132 ExecStart=/usr/bin/node .next/standalone/server.js (code=exited, status=217/USER)
   Main PID: 2132 (code=exited, status=217/USER)
        CPU: 8ms
HEALTH FAIL
echo '--- wayfire ---'; cat ~/.config/wayfire.ini 2>/dev/null
echo '--- lxde ---'; cat ~/.config/lxsession/LXDE-pi/autostart 2>/dev/null
--- labwc ---
/home/kiosk-talisman/src/kiosk/deploy/scripts/start-kiosk-browser.sh &
--- wayfire ---
[autostart]
kiosk = /home/kiosk-talisman/src/kiosk/deploy/scripts/start-kiosk-browser.sh
--- lxde ---
@/home/kiosk-talisman/src/kiosk/deploy/scripts/start-kiosk-browser.sh

