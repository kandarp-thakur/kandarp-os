#!/usr/bin/env bash
# Obtain Let's Encrypt cert for kandarp.online + www.kandarp.online and enable HTTPS.
# Runs after DNS has propagated to 68.233.101.56.
#
# STATUS (2026-07-19): The cert has already been issued and deployed. Both
# kandarp.online and www.kandarp.online resolve to 68.233.101.56 and are
# covered by a single Let's Encrypt ECDSA cert (SAN: kandarp.online,
# www.kandarp.online), valid until 2026-10-17. Auto-renewal via certbot.timer
# is enabled+active and the dry-run passes. Re-running this script is safe —
# certbot will renew/expand the existing cert idempotently. See
# scripts/cert-renew-test.sh for the renewal verification routine.
set -euo pipefail

DOMAIN="kandarp.online"
TARGET_IP="68.233.101.56"
EMAIL="admin@kandarp.online"
# www.kandarp.online now has an A record (CNAME to the apex) pointing at the
# target IP, so it is included in the cert. Leave this set; the script still
# guards on the A record resolving before adding the -d flag.
WWW_DOMAIN="www.kandarp.online"

echo "=== Step 1: Verify DNS propagation ==="
for i in $(seq 1 12); do
  apex=$(curl -s "https://dns.google/resolve?name=${DOMAIN}&type=A" \
        | python3 -c 'import sys,json; d=json.load(sys.stdin); print(",".join(a["data"] for a in d.get("Answer",[]) if a.get("type")==1))' 2>/dev/null || echo "")
  echo "  attempt $i: ${DOMAIN} -> ${apex:-<none>}"
  case ",$apex," in *",$TARGET_IP,"*) echo "  -> DNS OK"; break ;; esac
  sleep 15
done

case ",$apex," in
  *",$TARGET_IP,"*) : ;;
  *) echo "ERROR: ${DOMAIN} still does not resolve to ${TARGET_IP}. Aborting." ; exit 1 ;;
esac

echo ""
echo "=== Step 2: Ensure certbot + nginx plugin installed ==="
sudo apt-get update -qq
sudo apt-get install -y -qq certbot python3-certbot-nginx

echo ""
echo "=== Step 3: Obtain cert via nginx plugin (HTTP-01 challenge) ==="
# --nginx automatically edits the nginx config to serve over HTTPS
# Build the -d flags dynamically (only include www if it has an A record)
CERT_DOMAINS=(-d "${DOMAIN}")
if [ -n "${WWW_DOMAIN}" ]; then
  www_ip=$(curl -s "https://dns.google/resolve?name=${WWW_DOMAIN}&type=A" \
        | python3 -c 'import sys,json; d=json.load(sys.stdin); print(",".join(a["data"] for a in d.get("Answer",[]) if a.get("type")==1))' 2>/dev/null || echo "")
  if [ -n "${www_ip}" ]; then
    CERT_DOMAINS+=(-d "${WWW_DOMAIN}")
    echo "  Including ${WWW_DOMAIN} (resolves to ${www_ip})"
  else
    echo "  Skipping ${WWW_DOMAIN} (no A record yet)"
  fi
fi
sudo certbot --nginx \
  "${CERT_DOMAINS[@]}" \
  --non-interactive \
  --agree-tos \
  --no-eff-email \
  --email "${EMAIL}" \
  --redirect

echo ""
echo "=== Step 4: Verify cert files ==="
sudo ls -l /etc/letsencrypt/live/${DOMAIN}/ 2>/dev/null || echo "  (no live dir)"

echo ""
echo "=== Step 5: Test nginx config + reload ==="
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== Step 6: Verify HTTPS works ==="
sleep 3
echo "  -- https://${DOMAIN}/ --"
curl -s -o /dev/null -w '  HTTP %{http_code} in %{time_total}s (SSL verify: %{ssl_verify_result})\n' "https://${DOMAIN}/" || echo "  (curl failed)"
if [ -n "${WWW_DOMAIN}" ]; then
  echo "  -- https://${WWW_DOMAIN}/ --"
  curl -s -o /dev/null -w '  HTTP %{http_code} in %{time_total}s (SSL verify: %{ssl_verify_result})\n' "https://${WWW_DOMAIN}/" || echo "  (curl failed)"
else
  echo "  -- www.kandarp.online skipped (no A record) --"
fi

echo ""
echo "=== Step 7: Confirm auto-renewal timer ==="
sudo systemctl is-enabled certbot.timer 2>/dev/null || sudo systemctl enable certbot.timer
sudo systemctl is-active certbot.timer 2>/dev/null || sudo systemctl start certbot.timer
sudo systemctl list-timers certbot.timer --no-pager | head -3

echo ""
echo "=== Step 8: Dry-run renewal test ==="
sudo certbot renew --dry-run 2>&1 | tail -5

echo ""
echo "=== DONE: HTTPS should now be live on https://${DOMAIN} ==="
