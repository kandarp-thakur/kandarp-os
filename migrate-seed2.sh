#!/usr/bin/env bash
# Run Prisma migrations + seed inside the kandarp-app container,
# invoking the CLIs directly via node (the standalone image has no .bin symlinks).
set -euo pipefail

echo "=== tsx entrypoint? ==="
sudo docker exec kandarp-app sh -c 'ls /app/node_modules/tsx/dist/cli.mjs 2>/dev/null && echo "tsx cli found" || echo "tsx cli missing"'

echo ""
echo "=== prisma migrate deploy ==="
sudo docker exec -w /app kandarp-app node /app/node_modules/prisma/build/index.js migrate deploy 2>&1 | tail -40

echo ""
echo "=== seed ==="
sudo docker exec -w /app kandarp-app node /app/node_modules/tsx/dist/cli.mjs prisma/seed.ts 2>&1 | tail -40
