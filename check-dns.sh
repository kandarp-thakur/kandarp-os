#!/usr/bin/env bash
# Poll Google DNS-over-HTTPS until kandarp.online resolves to the Oracle server IP.
set -u
TARGET="68.233.101.56"
ATTEMPTS=20
SLEEP=15

ok_apex=false
ok_www=false

for i in $(seq 1 $ATTEMPTS); do
  echo "--- Attempt $i/$ATTEMPTS (T+$(($i*$SLEEP))s) ---"
  apex=$(curl -s "https://dns.google/resolve?name=kandarp.online&type=A" \
        | python3 -c 'import sys,json; d=json.load(sys.stdin); print(",".join(a["data"] for a in d.get("Answer",[]) if a.get("type")==1))' 2>/dev/null)
  www=$(curl -s "https://dns.google/resolve?name=www.kandarp.online&type=A" \
        | python3 -c 'import sys,json; d=json.load(sys.stdin); print(",".join(a["data"] for a in d.get("Answer",[]) if a.get("type")==1))' 2>/dev/null)
  echo "kandarp.online      -> ${apex:-<no A record>}"
  echo "www.kandarp.online  -> ${www:-<no A record>}"

  case ",$apex," in *",$TARGET,"*) ok_apex=true ;; esac
  case ",$www,"  in *",$TARGET,"*) ok_www=true  ;; esac

  if $ok_apex && $ok_www; then
    echo "=== DNS PROPAGATED: both apex and www point to $TARGET ==="
    exit 0
  fi
  sleep $SLEEP
done

echo "=== DNS NOT YET PROPAGATED after $((ATTEMPTS*SLEEP))s ==="
echo "apex ok=$ok_apex  www ok=$ok_www"
exit 1
