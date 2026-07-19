#!/usr/bin/env bash
# Run Prisma migrations + seed using a one-shot container built from the
# `deps` stage (which has the FULL node_modules incl. prisma CLI + tsx +
# all transitive deps like `effect`). The standalone `runner` image omits
# these because the Next.js server doesn't import the prisma CLI.
#
# We reuse the same Docker network as the compose stack so the container
# can reach the `db` service by hostname.
set -euo pipefail

APP_DIR="/home/ubuntu/kandarp-os"
cd "$APP_DIR"

# Load env (DATABASE_URL etc. is constructed for the internal `db` hostname).
set -a
. ./.env
set +a

# The internal DATABASE_URL the app container uses (points at `db:5432`).
DB_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public"

NETWORK="kandarp-os_default"
# Fallback: derive the compose project network name.
if ! sudo docker network inspect "$NETWORK" >/dev/null 2>&1; then
  NETWORK=$(sudo docker compose -f docker-compose.server.yml config --format json 2>/dev/null \
    | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4 || true)
fi
echo "Using network: ${NETWORK:-<none>}"

echo "=== Building a migrate helper image from the deps stage ==="
# Build only up to the `deps` stage (fast — cached) and tag it.
sudo docker build --target deps -t kandarp-os-migrate . >/dev/null 2>&1 || {
  echo "Falling back to full build for migrate image..."
  sudo docker build --target deps -t kandarp-os-migrate .
}

echo ""
echo "=== prisma migrate deploy ==="
sudo docker run --rm \
  --network "${NETWORK}" \
  -e DATABASE_URL="${DB_URL}" \
  -v "$APP_DIR/prisma:/app/prisma" \
  -w /app \
  kandarp-os-migrate \
  sh -c 'node node_modules/prisma/build/index.js migrate deploy' 2>&1 | tail -40

echo ""
echo "=== seed ==="
sudo docker run --rm \
  --network "${NETWORK}" \
  -e DATABASE_URL="${DB_URL}" \
  -e ADMIN_JWT_SECRET="${ADMIN_JWT_SECRET}" \
  -e AUTH_SECRET="${AUTH_SECRET}" \
  -e ADMIN_OWNER_EMAIL="${ADMIN_OWNER_EMAIL}" \
  -e ADMIN_OWNER_PASSWORD="${ADMIN_OWNER_PASSWORD}" \
  -e NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL}" \
  -e NODE_ENV=production \
  -v "$APP_DIR/prisma:/app/prisma" \
  -w /app \
  kandarp-os-migrate \
  sh -c 'node node_modules/tsx/dist/cli.mjs prisma/seed.ts' 2>&1 | tail -40
