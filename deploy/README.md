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
