#!/usr/bin/env bash
# Fix the broken iptables-persistent package non-interactively and confirm
# the firewall rules are persisted + the site is publicly reachable.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

# Pre-seed the debconf answers so dpkg --configure doesn't prompt.
sudo debconf-set-selections <<'SEED'
iptables-persistent iptables-persistent/autosave_v4 boolean true
iptables-persistent iptables-persistent/autosave_v6 boolean true
SEED

echo "=== Reconfiguring iptables-persistent ==="
sudo dpkg --configure -a 2>&1 | tail -5 || true
sudo apt-get install -y -f iptables-persistent 2>&1 | tail -5 || true

echo ""
echo "=== Re-save current (working) rules to rules.v4 ==="
sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null
echo "rules.v4 saved"

echo ""
echo "=== Verify port 80/443 rules persisted ==="
sudo grep -E 'dpt:(80|443)' /etc/iptables/rules.v4 || echo "WARN: 80/443 not found in rules.v4"

echo ""
echo "=== Enable netfilter-persistent on boot ==="
sudo systemctl enable netfilter-persistent 2>&1 | tail -3 || true

echo ""
echo "=== PUBLIC HTTP TEST (Host: kandarp.online) ==="
curl -s -o /dev/null -w 'HTTP %{http_code} in %{time_total}s\n' -H 'Host: kandarp.online' http://68.233.101.56/ || echo "test failed"
