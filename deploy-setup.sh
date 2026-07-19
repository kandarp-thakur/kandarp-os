#!/usr/bin/env bash
# Kandarp OS — server-side setup script.
# Generates production secrets + writes .env for docker compose.
set -euo pipefail

APP_DIR="/home/ubuntu/kandarp-os"
cd "$APP_DIR"

echo "=== Generating strong secrets ==="
ADMIN_JWT_SECRET="$(openssl rand -base64 32)"
AUTH_SECRET="$(openssl rand -hex 32)"
POSTGRES_PASSWORD="$(openssl rand -hex 24)"
ADMIN_OWNER_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-22)"

echo "=== Writing .env ==="
{
  echo "NODE_ENV=production"
  echo "LOG_LEVEL=info"
  echo "POSTGRES_USER=kandarp"
  echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}"
  echo "POSTGRES_DB=kandarp_os"
  echo "ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}"
  echo "AUTH_SECRET=${AUTH_SECRET}"
  echo "ADMIN_OWNER_EMAIL=admin@kandarp.online"
  echo "ADMIN_OWNER_PASSWORD=${ADMIN_OWNER_PASSWORD}"
  echo "NEXT_PUBLIC_SITE_URL=https://kandarp.online"
  echo "CLOUDINARY_CLOUD_NAME="
  echo "CLOUDINARY_API_KEY="
  echo "CLOUDINARY_API_SECRET="
  echo "CONTACT_EMAIL_TO="
  echo "GITHUB_TOKEN="
} > .env

chmod 600 .env
rm -f .env.local

echo "=== .env created (non-secret vars shown) ==="
grep -v -E 'SECRET|PASSWORD' .env

echo ""
echo "==================== SAVE THESE CREDENTIALS ===================="
echo "Admin login:  https://kandarp.online/admin/login"
echo "Email:        admin@kandarp.online"
echo "Password:     ${ADMIN_OWNER_PASSWORD}"
echo "DB password:  ${POSTGRES_PASSWORD}"
echo "================================================================"
