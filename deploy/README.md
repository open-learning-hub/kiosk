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

===============

systemctl status kiosk-app --no-pager
echo '=== logs ==='
journalctl -u kiosk-app -n 40 --no-pager
echo '=== files ==='
ls -la ~/kiosk/.env 2>&1
ls -la ~/kiosk/.next/standalone/server.js 2>&1




systemctl status kiosk-app --no-pager
echo '=== logs ==='
journalctl -u kiosk-app -n 40 --no-pager
echo '=== files ==='
ls -la ~/kiosk/.env 2>&1
ls -la ~/kiosk/.next/standalone/server.js 2>&1
● kiosk-app.service - Kiosk Next.js application
     Loaded: loaded (/etc/systemd/system/kiosk-app.service; enabled; preset: enabled)
     Active: activating (auto-restart) (Result: exit-code) since Sat 2026-05-30 14:48:02 SAST; 2s ago
 Invocation: fef714a9ea4d40f5934465a3ab546bac
    Process: 2408 ExecStart=/usr/bin/node .next/standalone/server.js (code=exited, status=217/USER)
   Main PID: 2408 (code=exited, status=217/USER)
        CPU: 8ms
=== logs ===
May 30 14:47:31 kiosk-talisman (node)[2389]: kiosk-app.service: Failed to determine user credentials: No such process
May 30 14:47:31 kiosk-talisman (node)[2389]: kiosk-app.service: Failed at step USER spawning /usr/bin/node: No such process
May 30 14:47:31 kiosk-talisman systemd[1]: kiosk-app.service: Main process exited, code=exited, status=217/USER
May 30 14:47:31 kiosk-talisman systemd[1]: kiosk-app.service: Failed with result 'exit-code'.
May 30 14:47:36 kiosk-talisman systemd[1]: kiosk-app.service: Scheduled restart job, restart counter is at 237.
May 30 14:47:36 kiosk-talisman systemd[1]: Started kiosk-app.service - Kiosk Next.js application.
May 30 14:47:36 kiosk-talisman (node)[2390]: kiosk-app.service: Failed to determine user credentials: No such process
May 30 14:47:36 kiosk-talisman (node)[2390]: kiosk-app.service: Failed at step USER spawning /usr/bin/node: No such process
May 30 14:47:36 kiosk-talisman systemd[1]: kiosk-app.service: Main process exited, code=exited, status=217/USER
May 30 14:47:36 kiosk-talisman systemd[1]: kiosk-app.service: Failed with result 'exit-code'.
May 30 14:47:41 kiosk-talisman systemd[1]: kiosk-app.service: Scheduled restart job, restart counter is at 238.
May 30 14:47:41 kiosk-talisman systemd[1]: Started kiosk-app.service - Kiosk Next.js application.
May 30 14:47:41 kiosk-talisman (node)[2394]: kiosk-app.service: Failed to determine user credentials: No such process
May 30 14:47:41 kiosk-talisman (node)[2394]: kiosk-app.service: Failed at step USER spawning /usr/bin/node: No such process
May 30 14:47:41 kiosk-talisman systemd[1]: kiosk-app.service: Main process exited, code=exited, status=217/USER
May 30 14:47:41 kiosk-talisman systemd[1]: kiosk-app.service: Failed with result 'exit-code'.
May 30 14:47:46 kiosk-talisman systemd[1]: kiosk-app.service: Scheduled restart job, restart counter is at 239.
May 30 14:47:46 kiosk-talisman systemd[1]: Started kiosk-app.service - Kiosk Next.js application.
May 30 14:47:46 kiosk-talisman (node)[2404]: kiosk-app.service: Failed to determine user credentials: No such process
May 30 14:47:46 kiosk-talisman (node)[2404]: kiosk-app.service: Failed at step USER spawning /usr/bin/node: No such process
May 30 14:47:46 kiosk-talisman systemd[1]: kiosk-app.service: Main process exited, code=exited, status=217/USER
May 30 14:47:46 kiosk-talisman systemd[1]: kiosk-app.service: Failed with result 'exit-code'.
May 30 14:47:52 kiosk-talisman systemd[1]: kiosk-app.service: Scheduled restart job, restart counter is at 240.
May 30 14:47:52 kiosk-talisman systemd[1]: Started kiosk-app.service - Kiosk Next.js application.
May 30 14:47:52 kiosk-talisman (node)[2405]: kiosk-app.service: Failed to determine user credentials: No such process
May 30 14:47:52 kiosk-talisman (node)[2405]: kiosk-app.service: Failed at step USER spawning /usr/bin/node: No such process
May 30 14:47:52 kiosk-talisman systemd[1]: kiosk-app.service: Main process exited, code=exited, status=217/USER
May 30 14:47:52 kiosk-talisman systemd[1]: kiosk-app.service: Failed with result 'exit-code'.
May 30 14:47:57 kiosk-talisman systemd[1]: kiosk-app.service: Scheduled restart job, restart counter is at 241.
May 30 14:47:57 kiosk-talisman systemd[1]: Started kiosk-app.service - Kiosk Next.js application.
May 30 14:47:57 kiosk-talisman (node)[2406]: kiosk-app.service: Failed to determine user credentials: No such process
May 30 14:47:57 kiosk-talisman (node)[2406]: kiosk-app.service: Failed at step USER spawning /usr/bin/node: No such process
May 30 14:47:57 kiosk-talisman systemd[1]: kiosk-app.service: Main process exited, code=exited, status=217/USER
May 30 14:47:57 kiosk-talisman systemd[1]: kiosk-app.service: Failed with result 'exit-code'.
May 30 14:48:02 kiosk-talisman systemd[1]: kiosk-app.service: Scheduled restart job, restart counter is at 242.
May 30 14:48:02 kiosk-talisman systemd[1]: Started kiosk-app.service - Kiosk Next.js application.
May 30 14:48:02 kiosk-talisman (node)[2408]: kiosk-app.service: Failed to determine user credentials: No such process
May 30 14:48:02 kiosk-talisman (node)[2408]: kiosk-app.service: Failed at step USER spawning /usr/bin/node: No such process
May 30 14:48:02 kiosk-talisman systemd[1]: kiosk-app.service: Main process exited, code=exited, status=217/USER
May 30 14:48:02 kiosk-talisman systemd[1]: kiosk-app.service: Failed with result 'exit-code'.
=== files ===
ls: cannot access '/home/kiosk-talisman/kiosk/.env': No such file or directory
ls: cannot access '/home/kiosk-talisman/kiosk/.next/standalone/server.js': No such file or directory


