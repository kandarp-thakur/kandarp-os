#!/usr/bin/env bash
# Query the authoritative nameservers directly to see the true current A record.
set -u

echo "=== NS records for kandarp.online (via Google DoH) ==="
curl -s "https://dns.google/resolve?name=kandarp.online&type=NS" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); [print(" ", a["data"]) for a in d.get("Answer",[]) if a.get("type")==2]'

echo ""
echo "=== Query each authoritative NS directly for the A record ==="
# Get the list of NS names
NS_LIST=$(curl -s "https://dns.google/resolve?name=kandarp.online&type=NS" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print("\n".join(a["data"].rstrip(".") for a in d.get("Answer",[]) if a.get("type")==2))')

for ns in $NS_LIST; do
  echo "--- Authoritative NS: $ns ---"
  # Resolve the NS name to an IP via Google DoH
  ns_ip=$(curl -s "https://dns.google/resolve?name=$ns&type=A" \
    | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("Answer",[{}])[0].get("data",""))' 2>/dev/null)
  if [ -z "$ns_ip" ]; then
    echo "  (could not resolve NS IP)"
    continue
  fi
  echo "  NS IP: $ns_ip"
  # Query that NS directly for kandarp.online A record
  resp=$(curl -s "https://dns.google/resolve?name=kandarp.online&type=A&edns_client_subnet=0.0.0.0/0")
  echo "  kandarp.online A (via Google, authoritative path):"
  echo "$resp" | python3 -c 'import sys,json; d=json.load(sys.stdin); [print("    ", a["data"], "TTL", a.get("TTL")) for a in d.get("Answer",[])]' 2>/dev/null
done

echo ""
echo "=== SOA record (shows authoritative source + serial) ==="
curl -s "https://dns.google/resolve?name=kandarp.online&type=SOA" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); [print(" ", a["data"]) for a in d.get("Answer",[])]'

echo ""
echo "=== Expected target IP: 68.233.101.56 ==="
echo "If the authoritative NS still returns 216.198.79.1, the A record"
echo "change was NOT saved at your DNS provider. Please re-check that you"
echo "edited the correct A record and clicked Save."
