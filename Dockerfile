# ──────────────────────────────────────────────────────────────────────
# Kandarp OS — multi-stage Dockerfile for self-hosted deployment (AWS EC2,
# ECS Fargate, App Runner, or any container host).
#
# Three stages keep the final image tiny (~150 MB):
#   1. deps    — install node_modules (cached layer)
#   2. builder — prisma generate + next build → produces .next/standalone
#   3. runner  — copies only the standalone server + static assets
#
# Build:   docker build -t kandarp-os .
# Run:     docker run -p 3000:3000 --env-file .env.local kandarp-os
# Migrate: docker run --rm --env-file .env.local kandarp-os \
#            sh -c "npx prisma migrate deploy && npx tsx prisma/seed.ts"
#
# Requires `output: "standalone"` in next.config.mjs (already set).
# ──────────────────────────────────────────────────────────────────────

# ── Stage 1: deps ──────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install build tools for native deps (sharp, argon2, @prisma/client).
RUN apk add --no-cache libc6-compat openssl

# Copy .npmrc BEFORE install so `legacy-peer-deps=true` is honoured.
# Without this, `npm ci` fails with ERESOLVE on React 19 + @react-three/*
# peer ranges (three/postprocessing). See .npmrc for the rationale.
COPY .npmrc ./

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install dependencies. We prefer `npm ci` (reproducible, uses the lockfile),
# but this repo migrated to pnpm so package-lock.json can drift from
# package.json. When `npm ci` fails (out-of-sync lockfile) we fall back to
# `npm install`, which regenerates the lockfile and resolves fresh.
# `--legacy-peer-deps` defuses React 19 / @react-three/* peer conflicts.
RUN if [ -f package-lock.json ]; then \
    npm ci --legacy-peer-deps || npm install --legacy-peer-deps; \
    else \
    npm install --legacy-peer-deps; \
    fi

# ── Stage 2: builder ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Raise the V8 old-space heap limit so the TypeScript type-checker (tsc) and
# the Next.js build worker don't OOM on low-RAM hosts. The default ~475 MB
# heap is too small for this codebase's type-check phase; 2048 MB is safe
# because the host has 2 GB of swap backing the build container.
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build. `npm run build` runs `prisma generate && next build` (see package.json).
# The standalone output lands in .next/standalone/.
RUN npm run build

# ── Stage 3: runner (tiny production image) ─────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Runtime tools: openssl for Prisma, tzdata for correct timestamps.
RUN apk add --no-cache openssl tzdata

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user for security (container hardening).
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# ── Copy the standalone server output ──────────────────────────────────
# `.next/standalone` contains server.js + only the node_modules the server
# actually imports. This is what makes the image ~150 MB instead of ~1.5 GB.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Client-side static assets (JS/CSS chunks) — not included in standalone.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Public folder (favicon, robots, og-image, media) — served at /.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma: the schema + generated client are needed for `prisma migrate deploy`
# and for the runtime query engine. The standalone bundler does not always
# include @prisma/client, so we copy it explicitly.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tsx ./node_modules/tsx

USER nextjs

EXPOSE 3000

# Healthcheck — the Next.js server responds to GET / with 200 once ready.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Start the standalone Node server (no `next start` needed).
CMD ["node", "server.js"]
