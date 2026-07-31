# Deploying Kandarp OS to Vercel

> Production deployment guide for the PostgreSQL-backed public portfolio and administration console.

## Architecture Requirements

Kandarp OS runs on Vercel as dynamic Next.js functions backed by external durable services:

- a hosted PostgreSQL database for CMS, identity, sessions, analytics, and audit data;
- Cloudinary for durable media uploads;
- Vercel environment variables for runtime secrets;
- checked-in Prisma migrations applied as a separate release step.

Vercel's function filesystem is ephemeral. Do not use the local `public/media` provider for production uploads. The public pages and admin console are both database-backed; neither should be treated as a static, file-only deployment.

## 1. Prerequisites

- A Vercel project connected to the repository.
- A PostgreSQL 14+ database reachable from Vercel functions.
- A Cloudinary account when administrators will upload media.
- Node.js 20 selected for the project.
- Local quality gates and a clean production build completed before release.

No committed `vercel.json` is required. Vercel detects Next.js from [`package.json`](../package.json) and [`next.config.mjs`](../next.config.mjs).

## 2. Configure the Project

Import the Git repository in Vercel and use:

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | Next.js default |
| Node.js | 20.x |

The build script generates Prisma Client before running `next build`.

## 3. Configure Environment Variables

Add secrets through **Project Settings → Environment Variables**. Never commit production values.

### Required

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Hosted PostgreSQL connection URL; use the provider's serverless/pooler URL when available |
| `ADMIN_JWT_SECRET` | HMAC signing key, at least 32 random bytes |
| `AUTH_SECRET` | Independent authentication key, at least 32 random bytes |
| `MANAGED_SECRETS_KEY` | Independent AES-256-GCM key material, at least 32 random bytes |
| `ADMIN_OWNER_EMAIL` | Bootstrap owner email used by the seed |
| `ADMIN_OWNER_PASSWORD` | Unique bootstrap password; rotate after first login |
| `NEXT_PUBLIC_SITE_URL` | Canonical HTTPS origin, without a trailing slash |

Generate each secret independently:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Do not reuse one generated value for all three cryptographic purposes.

### Durable Media

Configure the complete provider set:

| Variable | Purpose |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Server-side API key |
| `CLOUDINARY_API_SECRET` | Server-side API secret |
| `CLOUDINARY_UPLOAD_FOLDER` | Optional folder prefix; defaults to `kandarp-os` |

If this set is incomplete, the application selects local storage. Local storage is not durable on Vercel and therefore is unsuitable for production administration.

### Optional Integrations

Configure contact email, public analytics, Sentry, and GitHub values only when the corresponding provider is enabled. See [`backend/configuration.md`](./backend/configuration.md) for the complete reference.

## 4. Apply Database Migrations

Do not rely on request-time schema creation, `prisma db push`, or the Vercel function filesystem. Apply checked-in migrations from CI or a trusted release workstation before directing production traffic to a new application version:

```bash
npm ci
node --env-file-if-exists=.env.local node_modules/prisma/build/index.js migrate deploy
```

In CI, `DATABASE_URL` should be supplied by the CI secret store rather than a committed file.

Verify state after deployment:

```bash
node --env-file-if-exists=.env.local node_modules/prisma/build/index.js migrate status
```

For a breaking schema change, use an expand-and-contract migration sequence so the old and new application versions can overlap safely during Vercel's rollout.

## 5. Seed System Data

Run the idempotent seed once for a new environment and twice during release verification:

```bash
node --env-file-if-exists=.env.local node_modules/prisma/build/index.js db seed
node --env-file-if-exists=.env.local node_modules/prisma/build/index.js db seed
```

The configured command uses `node --import tsx prisma/seed.ts`. It upserts system roles, permissions, role links, and the owner while adding demo collections only when absent.

Never depend on the first web request to initialize production data. Seed explicitly as a controlled deployment action.

## 6. Deploy and Verify

Deploy only after migrations are current. Then verify:

1. `GET /api/health/live` returns `200`;
2. `GET /api/health/ready` returns `200` and confirms database readiness;
3. the public home and content pages render persisted CMS data;
4. `/admin/login` authenticates the seeded owner;
5. an authenticated read such as `/api/admin/settings` succeeds;
6. Cloudinary upload and delivery work if media management is enabled;
7. logs do not contain cookies, bearer keys, passwords, or managed secrets.

If readiness returns `503`, do not direct production traffic to that deployment until database connectivity and required production configuration are corrected.

## 7. Custom Domain

Add the root and optional `www` domains in **Project Settings → Domains**. Create the DNS records shown by Vercel; use those displayed values rather than hard-coding provider addresses from documentation.

After TLS is active:

1. set `NEXT_PUBLIC_SITE_URL` to the final root HTTPS URL;
2. redeploy so sitemap, robots, canonical, and Open Graph metadata use the final origin;
3. redirect the secondary hostname to the canonical hostname.

## 8. Security and Operations

- Keep Production and Preview databases separate.
- Use different signing/encryption keys in every environment.
- Restrict database network access and prefer TLS-enabled pooled connections.
- Rotate the bootstrap owner password immediately.
- Enable TOTP for privileged accounts.
- Issue scoped API keys and revoke unused credentials.
- Use the activity log for administrative mutation review.
- Use structured logs and request IDs for operational diagnosis.
- Back up PostgreSQL through the database provider; the admin backup is an application-level export, not a replacement for physical/provider backups.
- Rotate any secret that was exposed in source control, build logs, screenshots, or support output.

## 9. Preview Deployments

Preview deployments must not share the production database when they may execute migrations, seeds, tests, or administrative writes. Recommended options are:

- a dedicated preview database;
- an isolated provider branch per preview;
- disabled admin mutation access when only production data can be reached.

Use preview-specific `NEXT_PUBLIC_SITE_URL` values only when metadata behavior must be tested; production canonical URLs should otherwise remain isolated from preview traffic.

## 10. Troubleshooting

| Symptom | Resolution |
| --- | --- |
| Build fails while loading Prisma configuration | Set a valid `DATABASE_URL` in the Vercel build environment |
| Readiness returns `503` | Check production secrets, database reachability, TLS/pooler settings, and migration state |
| Admin login fails after first deploy | Run the seed explicitly and verify owner environment values |
| Admin content is missing | Confirm the deployment points to the intended database and that seed/migrations completed |
| Uploaded files disappear | Configure all Cloudinary variables; Vercel local storage is ephemeral |
| Prisma reports connection exhaustion | Use the database provider's serverless pooler and review connection limits |
| A new API route returns authorization errors | Confirm role defaults, per-user overrides, and active session/API-key scopes |
| Metadata references the preview domain | Set the production `NEXT_PUBLIC_SITE_URL` and redeploy |

## Release Checklist

- [ ] Local lint, typecheck, tests, Prisma validation, and production build pass
- [ ] Production and Preview environment variables are isolated
- [ ] `DATABASE_URL` uses the appropriate hosted pooler/TLS configuration
- [ ] Authentication and managed-secret keys are strong and independent
- [ ] Cloudinary is configured for durable media
- [ ] Checked-in migrations are applied before traffic is shifted
- [ ] Idempotent seed completes twice without duplication
- [ ] Liveness and readiness both return `200`
- [ ] Owner password is rotated and TOTP is enabled
- [ ] Custom domain, canonical metadata, sitemap, and robots output use the final origin
