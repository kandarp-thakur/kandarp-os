#!/usr/bin/env bash
# Verify certbot auto-renewal is healthy for kandarp.online.
# Runs on the server (ubuntu@68.233.101.56).
set -u

echo "=== certbot.timer status ==="
sudo systemctl is-enabled certbot.timer
sudo systemctl is-active certbot.timer
sudo systemctl list-timers certbot.timer --no-pager | head -3

echo ""
echo "=== Dry-run renewal (kandarp.online) ==="
# --no-random-sleep-on-renew avoids the up-to-8min non-interactive delay so the
# dry-run completes quickly. 120s is plenty for the staging ACME challenge.
sudo timeout 120 certbot renew --cert-name kandarp.online --dry-run --no-random-sleep-on-renew 2>&1
renew_exit=$?
echo ""
echo "RENEW_EXIT=${renew_exit}"

echo ""
echo "=== Recent letsencrypt log (last 15 lines) ==="
sudo tail -15 /var/log/letsencrypt/letsencrypt.log 2>/dev/null || echo "(no log)"
