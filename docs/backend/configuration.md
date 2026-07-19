# Configuration — Kandarp OS Backend

> Every environment variable, its purpose, validation rules, and how to generate secrets.

---

## Environment Variable Reference

All variables are validated by a Zod schema at boot
([`env-schema.ts`](../../src/lib/admin/env-schema.ts)). The validated, typed
object (`env`) is the single source of truth — every module reads from `env`
instead of `process.env` directly, so a typo'd key name is caught at compile time.

### Runtime

| Variable    | Type                                                         | Default                       | Required (Prod) | Notes                                     |
| ----------- | ------------------------------------------------------------ | ----------------------------- | :-------------: | ----------------------------------------- |
| `NODE_ENV`  | `development` \| `test` \| `production`                      | `development`                 |        —        | `production` enables strict secret checks |
| `LOG_LEVEL` | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` | `info` (prod) / `debug` (dev) |        —        | Pino log level                            |

### Database

| Variable       | Type                  | Default | Required (Prod) | Notes                                            |
| -------------- | --------------------- | ------- | :-------------: | ------------------------------------------------ |
| `DATABASE_URL` | string (postgres URL) | —       |        ✓        | Must start with `postgres://` or `postgresql://` |

### Auth / Sessions

| Variable               | Type                | Default                | Required (Prod) | Notes                        |
| ---------------------- | ------------------- | ---------------------- | :-------------: | ---------------------------- |
| `ADMIN_JWT_SECRET`     | string (≥ 32 bytes) | dev fallback           |        ✓        | HMAC signing secret for JWTs |
| `AUTH_SECRET`          | string (≥ 32 bytes) | dev fallback           |        ✓        | General auth secret          |
| `ADMIN_OWNER_EMAIL`    | email               | `admin@kandarp.online` |        —        | Seed owner account email     |
| `ADMIN_OWNER_PASSWORD` | string (≥ 8 chars)  | `ChangeMe!2026`        |        —        | Seed owner account password  |

### Public Site

| Variable               | Type | Default                 | Required (Prod) | Notes                |
| ---------------------- | ---- | ----------------------- | :-------------: | -------------------- |
| `NEXT_PUBLIC_SITE_URL` | URL  | `http://localhost:3000` |        —        | Public site base URL |

### Cloudinary (Media CDN)

| Variable                   | Type   | Default      | Required (Prod) | Notes                                   |
| -------------------------- | ------ | ------------ | :-------------: | --------------------------------------- |
| `CLOUDINARY_CLOUD_NAME`    | string | —            |        —        | Cloud name (enables Cloudinary storage) |
| `CLOUDINARY_API_KEY`       | string | —            |        —        | API key                                 |
| `CLOUDINARY_API_SECRET`    | string | —            |        —        | API secret                              |
| `CLOUDINARY_UPLOAD_FOLDER` | string | `kandarp-os` |        —        | Upload folder prefix                    |

### Contact / Email

| Variable                | Type   | Default | Required (Prod) | Notes                  |
| ----------------------- | ------ | ------- | :-------------: | ---------------------- |
| `CONTACT_EMAIL_API_KEY` | string | —       |        —        | Email provider API key |
| `CONTACT_EMAIL_TO`      | email  | —       |        —        | Contact form recipient |
| `CONTACT_EMAIL_FROM`    | email  | —       |        —        | Contact form sender    |

### Analytics / Error Tracking (Public)

| Variable                       | Type   | Default | Required (Prod) | Notes                |
| ------------------------------ | ------ | ------- | :-------------: | -------------------- |
| `NEXT_PUBLIC_ANALYTICS_SRC`    | string | —       |        —        | Analytics script src |
| `NEXT_PUBLIC_ANALYTICS_DOMAIN` | string | —       |        —        | Analytics domain     |
| `NEXT_PUBLIC_SENTRY_DSN`       | string | —       |        —        | Sentry DSN (client)  |
| `SENTRY_ORG`                   | string | —       |        —        | Sentry org           |
| `SENTRY_PROJECT`               | string | —       |        —        | Sentry project       |
| `SENTRY_AUTH_TOKEN`            | string | —       |        —        | Sentry auth token    |

### GitHub Integration

| Variable       | Type   | Default | Required (Prod) | Notes            |
| -------------- | ------ | ------- | :-------------: | ---------------- |
| `GITHUB_TOKEN` | string | —       |        —        | GitHub API token |

---

## Generating Secrets

### JWT / Auth Secret

```bash
# 48 random bytes → hex string (96 chars, well above the 32-byte minimum)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Database URL

```bash
# Local PostgreSQL
postgresql://postgres:password@localhost:5432/kandarp_os

# Supabase / Neon / Render (pooler URL)
postgresql://user:password@host:6543/postgres?pgbouncer=true
```

---

## `.env.local` Template

```bash
# ── Runtime ──────────────────────────────────────────────
NODE_ENV=development
LOG_LEVEL=debug

# ── Database ────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:password@localhost:5432/kandarp_os

# ── Auth / Sessions ────────────────────────────────────
ADMIN_JWT_SECRET=<generate with the command above>
AUTH_SECRET=<generate with the command above>
ADMIN_OWNER_EMAIL=admin@kandarp.online
ADMIN_OWNER_PASSWORD=ChangeMe!2026

# ── Public Site ─────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ── Cloudinary (optional — enables CDN media) ──────────
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
# CLOUDINARY_UPLOAD_FOLDER=kandarp-os

# ── Contact / Email (optional) ─────────────────────────
# CONTACT_EMAIL_API_KEY=
# CONTACT_EMAIL_TO=
# CONTACT_EMAIL_FROM=
```

---

## Production Strictness

In production (`NODE_ENV=production`), `assertProductionSecrets()` runs on the
first real request and throws if any of these are missing or weak:

- `DATABASE_URL` — must be a valid Postgres connection string
- `ADMIN_JWT_SECRET` — must be ≥ 32 bytes
- `AUTH_SECRET` — must be ≥ 32 bytes

This is lazy (not at import time) so `next build`'s page-data collection phase
doesn't crash on a missing secret — the check fires on the first real request
instead.

---

## Provider Selection

Some features are enabled automatically when their env vars are present:

| Feature                  | Env Var(s)                                                               | When Enabled      |
| ------------------------ | ------------------------------------------------------------------------ | ----------------- |
| Cloudinary media storage | `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` | All three present |
| Contact email            | `CONTACT_EMAIL_API_KEY` + `CONTACT_EMAIL_TO` + `CONTACT_EMAIL_FROM`      | All three present |
| GitHub integration       | `GITHUB_TOKEN`                                                           | Present           |

When a feature's env vars are absent, the app falls back to the default behavior
(local disk for media, no contact email, no GitHub data) — no crash, no error.
