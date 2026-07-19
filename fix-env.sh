#!/usr/bin/env bash
# Fix the .env on the server: empty optional email fields fail Zod's .email()
# validation. Remove the empty CONTACT_EMAIL_* lines (they're optional —
# absence passes, but an empty string fails the email format check).
set -euo pipefail

cd /home/ubuntu/kandarp-os

echo "=== .env before ==="
grep -nE 'CONTACT_EMAIL|CLOUDINARY' .env || true

# Remove lines that set an optional email/var to an empty value.
# These are optional; omitting them entirely is valid.
sed -i -E '/^(CONTACT_EMAIL_TO|CONTACT_EMAIL_FROM|CONTACT_EMAIL_API_KEY|CLOUDINARY_CLOUD_NAME|CLOUDINARY_API_KEY|CLOUDINARY_API_SECRET)= *$/d' .env

echo ""
echo "=== .env after (non-secret) ==="
grep -vE 'SECRET|PASSWORD' .env

echo ""
echo "=== Recreate app container to pick up new env ==="
sudo docker compose -f docker-compose.server.yml up -d --force-recreate --no-deps app

echo "=== Waiting for app to be ready ==="
sleep 12

echo ""
echo "=== App HTTP test ==="
curl -s -o /dev/null -w 'HTTP %{http_code} in %{time_total}s\n' http://127.0.0.1:3000/

echo ""
echo "=== App logs (last 15) ==="
sudo docker logs kandarp-app --tail 15 2>&1
