#!/usr/bin/env bash
# Run Prisma migrations + seed inside the kandarp-app container.
set -euo pipefail

echo "=== Checking container layout ==="
sudo docker exec kandarp-app sh -c 'whoami; pwd; ls -la /app | head -20'
echo ""
echo "=== Locating prisma + tsx binaries ==="
sudo docker exec kandarp-app sh -c 'ls -la /app/node_modules/.bin/prisma /app/node_modules/.bin/tsx 2>/dev/null || echo "binaries not in .bin"'
sudo docker exec kandarp-app sh -c 'ls /app/node_modules/prisma/build/index.js 2>/dev/null && echo "prisma build found" || echo "prisma build missing"'
sudo docker exec kandarp-app sh -c 'ls /app/node_modules/.bin/ 2>/dev/null | head -20 || echo "no .bin dir"'
echo ""
echo "=== DATABASE_URL present? ==="
sudo docker exec kandarp-app sh -c 'echo "${DATABASE_URL:0:40}..."'
echo ""
echo "=== Running prisma migrate deploy (via node_modules/.bin) ==="
sudo docker exec kandarp-app sh -c 'cd /app && ./node_modules/.bin/prisma migrate deploy' 2>&1 | tail -40
echo ""
echo "=== Running seed (via node_modules/.bin/tsx) ==="
sudo docker exec kandarp-app sh -c 'cd /app && ./node_modules/.bin/tsx prisma/seed.ts' 2>&1 | tail -40
