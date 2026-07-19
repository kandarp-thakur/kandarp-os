#!/usr/bin/env bash
# Open ports 80/443 in the host iptables, inserting ACCEPT rules BEFORE
# the Oracle Cloud default REJECT rule (which sits at ~position 5 in INPUT
# and overrides UFW). Also persist rules so they survive reboot.
set -euo pipefail

echo "=== INPUT chain before ==="
sudo iptables -L INPUT -n --line-numbers | head -15

# Insert ACCEPT for 80/443 before the REJECT rule (position 5).
# Insert in reverse order so line numbers stay valid.
sudo iptables -I INPUT 5 -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT

echo ""
echo "=== INPUT chain after ==="
sudo iptables -L INPUT -n --line-numbers | head -15

# Persist across reboots. netfilter-persistent saves to /etc/iptables/rules.v4.
if command -v netfilter-persistent >/dev/null 2>&1; then
  sudo netfilter-persistent save
  echo "Saved via netfilter-persistent"
else
  sudo apt-get install -y iptables-persistent
  sudo netfilter-persistent save
  echo "Installed + saved via netfilter-persistent"
fi

echo ""
echo "=== Test public HTTP ==="
curl -s -o /dev/null -w 'HTTP %{http_code} in %{time_total}s\n' -H 'Host: kandarp.online' http://68.233.101.56/ || true
