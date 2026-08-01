# Deploying Kandarp OS to Oracle Cloud

> Production deployment guide for the Docker-based Oracle Cloud server and GitHub Actions release workflow.

## Architecture

Production runs on one Oracle Cloud host:

- host Nginx terminates TLS on ports 80 and 443;
- the Next.js standalone container listens only on `127.0.0.1:3000`;
- PostgreSQL 16 runs on Docker's internal network with a persistent volume;
- GitHub Actions connects over SSH and deploys the exact `main` revision;
- runtime secrets remain in the server-side `.env` file and are never copied into the repository.

The relevant files are [`Dockerfile`](../Dockerfile), [`docker-compose.server.yml`](../docker-compose.server.yml), and [`.github/workflows/deploy-oracle.yml`](../.github/workflows/deploy-oracle.yml).

## 1. Server Prerequisites

Install and configure:

- Git;
- Docker Engine and the Docker Compose v2 plugin;
- Nginx with TLS for the production domain;
- a non-root deployment user that can run Docker Compose;
- an SSH key dedicated to GitHub Actions;
- a checkout of this repository on the `main` branch.

The deployment user must own or have write access to the checkout. Do not grant unrestricted root SSH access to the workflow.

## 2. Runtime Environment

Create `.env` in the server checkout and restrict it to the deployment user. It must contain at least:

| Variable               | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `POSTGRES_PASSWORD`    | Password for the internal PostgreSQL service    |
| `ADMIN_JWT_SECRET`     | Admin JWT signing key, at least 32 random bytes |
| `AUTH_SECRET`          | Independent authentication/session key          |
| `MANAGED_SECRETS_KEY`  | Independent managed-secret encryption key       |
| `ADMIN_OWNER_EMAIL`    | Initial owner email                             |
| `ADMIN_OWNER_PASSWORD` | Initial owner password; rotate after login      |
| `NEXT_PUBLIC_SITE_URL` | Canonical HTTPS origin                          |

Optional Cloudinary and integration values are documented in [`backend/configuration.md`](./backend/configuration.md). Local media is persistent only when explicitly mounted; use Cloudinary for durable production media unless server storage and backups are intentionally managed.

## 3. GitHub Production Environment

Create a GitHub environment named `production`. Add these environment or repository secrets:

| Secret           | Value                                           |
| ---------------- | ----------------------------------------------- |
| `ORACLE_HOST`    | Public DNS name or IP of the Oracle server      |
| `ORACLE_USER`    | Restricted deployment SSH user                  |
| `ORACLE_SSH_KEY` | Dedicated private SSH key                       |
| `ORACLE_APP_DIR` | Absolute repository checkout path on the server |
| `ORACLE_PORT`    | Optional SSH port; defaults to `22`             |

Add this environment variable:

| Variable         | Value                                           |
| ---------------- | ----------------------------------------------- |
| `PRODUCTION_URL` | Canonical HTTPS origin without a trailing slash |

For stronger release control, configure required reviewers and limit the environment to the `main` branch.

## 4. SSH Hardening

Add only the dedicated public key to the deployment user's `authorized_keys`. Restrict inbound SSH in the Oracle security list and host firewall where practical. The workflow records the host key with `ssh-keyscan` before connecting; verify the server fingerprint independently before the first production run.

Never store the private deployment key in the repository or server `.env` file.

## 5. Migration Preflight

The workflow builds the new image, starts PostgreSQL, and runs checked-in Prisma migrations before replacing the web container. A migration failure stops deployment.

Before enabling automatic deployment, reconcile any Prisma migration-history drift. In particular, production's `_prisma_migrations` entries must match the checked-in migration directory names. Do not use `prisma migrate reset`, `prisma db push`, or manual schema deletion in production.

After reconciliation, verify on the server:

```bash
docker compose -f docker-compose.server.yml run --rm app \
  node node_modules/prisma/build/index.js migrate status
```

## 6. Deployment

A push to `main` starts the workflow automatically. It can also be started from GitHub Actions with **Run workflow**.

The release performs these operations:

1. authenticates to the server with the dedicated SSH key;
2. fast-forwards the server checkout to `origin/main`;
3. builds the new application image;
4. starts and health-checks PostgreSQL;
5. applies Prisma migrations;
6. recreates the application container;
7. checks liveness, readiness, `/blog/hye`, and missing-slug `404` behavior.

The workflow uses a production concurrency lock so two releases cannot mutate the server simultaneously.

## 7. Nginx and DNS

Point the production domain's DNS records to the Oracle public IP. Configure Nginx to proxy the HTTPS virtual host to `http://127.0.0.1:3000`. Keep port 3000 closed publicly; [`docker-compose.server.yml`](../docker-compose.server.yml) binds it to loopback only.

After changing DNS from another provider, allow DNS caches to expire before deleting the old deployment. Confirm both the root domain and `www` behavior, TLS renewal, canonical metadata, sitemap, and robots output.

## 8. Verification and Rollback

Verify after every deployment:

```bash
curl --fail https://kandarp.online/api/health/live
curl --fail https://kandarp.online/api/health/ready
curl --fail https://kandarp.online/blog/hye
```

Inspect container state and application logs:

```bash
docker compose -f docker-compose.server.yml ps
docker compose -f docker-compose.server.yml logs --tail=200 app
```

For application rollback, check out a previously verified commit on the server and rebuild with the same Compose file. Database rollback requires a separately designed forward-fix migration; never reset the production database.

## 9. Backups and Operations

- Back up the PostgreSQL volume regularly and test restore procedures.
- Back up any server-hosted media separately.
- Monitor disk space, Docker health, Nginx errors, TLS renewal, and readiness failures.
- Rotate SSH, owner, authentication, encryption, database, and integration secrets.
- Keep the deployment user's permissions limited to this application and its Docker services.

## Release Checklist

- [ ] GitHub `production` environment and required secrets are configured
- [ ] Oracle SSH host fingerprint is independently verified
- [ ] Server `.env` contains strong, independent production secrets
- [ ] Prisma migration history matches the checked-in migrations
- [ ] Nginx and TLS proxy to `127.0.0.1:3000`
- [ ] Liveness and readiness return `200`
- [ ] `/blog/hye` returns `200` and a missing slug returns `404`
- [ ] Database and media backups are current
- [ ] DNS no longer routes production traffic to Vercel
