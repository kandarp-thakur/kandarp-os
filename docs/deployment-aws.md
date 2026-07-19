# Deployment Guide — Self-Hosting Kandarp OS on AWS

> **⚠️ Windows build note:** If you build the standalone output on Windows
> (not in Docker), you may see `EPERM: operation not permitted, symlink`
> warnings during the "copy traced files" phase. This is because Windows
> requires admin privileges or Developer Mode to create symlinks. The
> warnings are harmless — `server.js` is still produced. **Building inside
> Docker (Linux container) avoids this entirely** because Linux allows
> symlinks without special permissions. For the cleanest result, build the
> image with `docker build` (which runs the build on Linux) rather than
> `npm run build` on Windows.

> **Last Updated:** 2026-07-18
> **Scope:** Deploying the Kandarp OS portfolio (Next.js 15 + Prisma + PostgreSQL)
> to a self-managed AWS server (EC2, ECS Fargate, or App Runner) using Docker.
> This replaces the Vercel deployment path documented in
> [`deployment-vercel.md`](./deployment-vercel.md).

---

## 1. Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│  Internet (browser)                                          │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS (443)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  nginx (TLS termination, reverse proxy, gzip)                │
│  • Let's Encrypt cert (free, auto-renewing)                   │
│  • Security headers (HSTS, CSP, X-Frame-Options, …)          │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP (3000)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  Docker container — Kandarp OS (Next.js standalone)          │
│  • node server.js  (~250 MB RAM)                             │
│  • Edge middleware (auth, rate-limit, CSRF, body-size)       │
│  • App Router (public + admin + ~150 API routes)             │
└───────────────────────────┬──────────────────────────────────┘
                            │ TCP (5432)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  PostgreSQL 16                                               │
│  • Option A: Amazon RDS (managed, recommended for prod)      │
│  • Option B: postgres:16-alpine container (dev / single-box) │
└──────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- **`output: "standalone"`** in [`next.config.mjs`](../next.config.mjs) bundles a
  minimal self-contained server into `.next/standalone/`. The Docker image is
  ~150 MB instead of ~1.5 GB.
- **Multi-stage Dockerfile** — three stages (deps → builder → runner) keep the
  final image tiny and free of build tooling.
- **Build off the server** — the 1 GB Free Tier EC2 cannot run `docker build`
  (needs ~2 GB RAM). Build locally or in CI, push to ECR, pull on the server.

---

## 2. Prerequisites

| Requirement | Why |
|-------------|-----|
| AWS account | EC2 + RDS + ECR |
| Domain name | For TLS + the `NEXT_PUBLIC_SITE_URL` env var |
| Docker (local) | To build the image |
| AWS CLI v2 | To push to ECR + manage resources |
| Node 20 (local) | To generate secrets + run Prisma locally if needed |

---

## 3. Files in this deployment

| File | Purpose |
|------|---------|
| [`next.config.mjs`](../next.config.mjs) | `output: "standalone"` enabled |
| [`Dockerfile`](../Dockerfile) | Multi-stage build → tiny production image |
| [`.dockerignore`](../.dockerignore) | Keeps build context small, prevents secret leaks |
| [`docker-compose.yml`](../docker-compose.yml) | Local + single-server orchestration (app + Postgres) |
| [`nginx.conf`](../nginx.conf) | Reverse proxy + TLS termination + security headers |
| [`.env.example`](../.env.example) | All environment variables documented |
| [`prisma/schema.prisma`](../prisma/schema.prisma) | PostgreSQL datasource |

---

## 4. Generate secrets

Before deploying, generate strong secrets. Run these locally:

```bash
# ADMIN_JWT_SECRET — 32 bytes, base64 (used for admin JWT signing)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# AUTH_SECRET — 32 bytes, hex (used by NextAuth)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save these — you'll set them as environment variables on the server.

---

## 5. Local test (Docker Compose)

Test the full stack locally before touching AWS:

```bash
# 1. Create your env file
cp .env.example .env.local
# Edit .env.local — fill in all required values:
#   POSTGRES_PASSWORD, ADMIN_JWT_SECRET, AUTH_SECRET,
#   ADMIN_OWNER_EMAIL, ADMIN_OWNER_PASSWORD, NEXT_PUBLIC_SITE_URL

# 2. Build + start everything (app + Postgres)
docker compose up -d --build

# 3. Watch the logs
docker compose logs -f app

# 4. Run database migrations + seed (first time only)
docker compose exec app sh -c "npx prisma migrate deploy && npx tsx prisma/seed.ts"

# 5. Open the site
#    Public:  http://localhost:3000
#    Admin:   http://localhost:3000/admin/login
#    Log in with ADMIN_OWNER_EMAIL / ADMIN_OWNER_PASSWORD

# 6. Stop everything
docker compose down

# 7. Wipe the database (start fresh)
docker compose down -v
```

If the app starts but the database isn't seeded, you'll see the public site
fall back to the hardcoded data in [`src/data/`](../src/data/) — that's the
safety net built into [`public-data.ts`](../src/backend/services/public-data.ts).

---

## 6. Deploy to AWS — Option A: EC2 (Free Tier, recommended)

### 6.1 Launch the EC2 instance

1. **EC2 console → Launch instance**
2. **Name:** `kandarp-os`
3. **AMI:** Ubuntu Server 22.04 LTS (x86)
4. **Instance type:** `t3.micro` (Free Tier — 1 vCPU, 1 GB RAM)
5. **Key pair:** create new, download the `.pem`
6. **Network settings:**
   - Allow SSH (port 22) from **your IP only**
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
7. **Storage:** 20 GB gp3 (Free Tier includes 30 GB EBS)
8. **Launch**

> **⚠️ 1 GB RAM rule:** Do **not** run `docker build` on this instance. Build
> locally (or in CI) and push to ECR. The EC2 only *runs* the prebuilt image
> (~250 MB RAM). See §6.3.

### 6.2 Create the RDS PostgreSQL database (Free Tier)

1. **RDS console → Create database**
2. **Engine:** PostgreSQL → **Version:** 16.x
3. **Template:** Free Tier
4. **DB instance class:** `db.t3.micro` (1 vCPU, 1 GB RAM)
5. **Storage:** 20 GB gp2
6. **Master username:** `kandarp`
7. **Master password:** generate a strong one, save it
8. **Public access:** No (keep it private — only the EC2 reaches it)
9. **VPC security group:** create one allowing **port 5432** from the EC2's
   security group only
10. **Create.** Note the endpoint, e.g. `kandarp-db.xxxxx.region.rds.amazonaws.com`

### 6.3 Build + push the Docker image (on your local machine)

```bash
# 1. Authenticate Docker to ECR
aws ecr create-repository --repository-name kandarp-os
aws ecr get-login-password --region <region> \
  | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

# 2. Build the image locally (your dev machine has enough RAM)
docker build -t kandarp-os .

# 3. Tag + push
docker tag kandarp-os <account>.dkr.ecr.<region>.amazonaws.com/kandarp-os:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/kandarp-os:latest
```

> **ECR Free Tier:** 500 MB storage free for 12 months. The image is ~150 MB,
> so you have plenty of room.

### 6.4 Set up the EC2 instance

SSH in and install Docker:

```bash
# Connect
ssh -i your-key.pem ubuntu@<ec2-public-ip>

# Install Docker + Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for the group change to take effect
exit
ssh -i your-key.pem ubuntu@<ec2-public-ip>

# Add a 2 GB swap file (safety net for 1 GB RAM — prevents OOM kills)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Authenticate to ECR on the EC2 (so it can pull the image)
aws configure  # enter your AWS keys
aws ecr get-login-password --region <region> \
  | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
```

### 6.5 Run the app on the EC2

```bash
# Pull the image you pushed in §6.3
docker pull <account>.dkr.ecr.<region>.amazonaws.com/kandarp-os:latest

# Run the container, pointing DATABASE_URL at RDS
docker run -d \
  --name kandarp \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  -e DATABASE_URL="postgresql://kandarp:<rds-password>@<rds-endpoint>:5432/kandarp_os?schema=public" \
  -e ADMIN_JWT_SECRET="<your-generated-secret>" \
  -e AUTH_SECRET="<your-generated-secret>" \
  -e ADMIN_OWNER_EMAIL="you@example.com" \
  -e ADMIN_OWNER_PASSWORD="<strong-password>" \
  -e NEXT_PUBLIC_SITE_URL="https://yourdomain.com" \
  -e CLOUDINARY_CLOUD_NAME="<...>" \
  -e CLOUDINARY_API_KEY="<...>" \
  -e CLOUDINARY_API_SECRET="<...>" \
  <account>.dkr.ecr.<region>.amazonaws.com/kandarp-os:latest

# Run migrations + seed (one-shot)
docker exec kandarp sh -c "npx prisma migrate deploy && npx tsx prisma/seed.ts"

# Check it's healthy
docker ps
curl http://localhost:3000/
```

### 6.6 Set up nginx + TLS

```bash
# Install nginx + Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Copy the nginx config (from this repo) and edit YOUR_DOMAIN
sudo cp nginx.conf /etc/nginx/conf.d/kandarp.conf
sudo nano /etc/nginx/conf.d/kandarp.conf
#   replace yourdomain.com with your real domain (all occurrences)

# Test + reload
sudo nginx -t
sudo systemctl reload nginx

# Get a free TLS certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Certbot auto-edits nginx.conf to add the cert paths + sets up auto-renewal
```

### 6.7 Point your domain

In your DNS provider (Route 53 or any registrar):
- Add an **A record** → EC2 public IP
- Wait for DNS to propagate (usually a few minutes)

Visit `https://yourdomain.com` — the site should be live.

---

## 7. Deploy to AWS — Option B: ECS Fargate (serverless containers)

If you don't want to manage an EC2, use Fargate (no Free Tier, but fully managed):

1. **Build + push to ECR** (same as §6.3).
2. **Create an RDS PostgreSQL** instance (same as §6.2, but allow port 5432
   from the ECS task's security group).
3. **Create a Task Definition** (JSON) pointing to your ECR image, with all
   env vars. Use **Secrets Manager** or **Parameter Store** for secrets —
   reference them in the task definition as `valueFrom`.
4. **Create an Application Load Balancer (ALB)** with a listener on 443 (TLS)
   and a target group forwarding to port 3000. Use **AWS Certificate Manager
   (ACM)** for the TLS cert (free, auto-renewing).
5. **Create an ECS service** on Fargate (`FARGATE` launch type, 0.5 vCPU /
   1 GB task size is enough), behind the ALB.
6. **Run migrations** as a one-shot ECS task (or `docker run` locally with
   `DATABASE_URL` pointing at RDS):
   ```bash
   docker run --rm \
     -e DATABASE_URL="postgresql://..." \
     <account>.dkr.ecr.<region>.amazonaws.com/kandarp-os:latest \
     sh -c "npx prisma migrate deploy && npx tsx prisma/seed.ts"
   ```
7. Point your domain's DNS to the ALB's DNS name.

---

## 8. Deploy to AWS — Option C: App Runner (easiest)

1. **Push to ECR** (same as §6.3).
2. **AWS Console → App Runner → Create service → Source: ECR**
3. **Port:** 3000
4. **Environment variables:** add all from [`.env.example`](../.env.example)
   (use Secrets Manager references for secrets).
5. **Use RDS for PostgreSQL** (App Runner can't run a database container).
6. App Runner gives you a URL automatically; point your domain's CNAME to it.

---

## 9. Environment variables

All variables are documented in [`.env.example`](../.env.example). The
required ones for production:

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | `postgresql://kandarp:pass@host:5432/kandarp_os?schema=public` |
| `ADMIN_JWT_SECRET` | ✅ | (32-byte base64 string) |
| `AUTH_SECRET` | ✅ | (32-byte hex string) |
| `ADMIN_OWNER_EMAIL` | ✅ | `you@example.com` |
| `ADMIN_OWNER_PASSWORD` | ✅ | (strong password) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://yourdomain.com` |
| `CLOUDINARY_CLOUD_NAME` | ⚠️ | (needed for media uploads) |
| `CLOUDINARY_API_KEY` | ⚠️ | (needed for media uploads) |
| `CLOUDINARY_API_SECRET` | ⚠️ | (needed for media uploads) |
| `CONTACT_EMAIL_*` | ⚠️ | (needed for the contact form) |
| `SENTRY_DSN` | ➖ | (optional, error tracking) |
| `GITHUB_TOKEN` | ➖ | (optional, repo stats) |

> **Never** commit `.env.local`. It's in [`.gitignore`](../.gitignore) and
> [`.dockerignore`](../.dockerignore). For production, use AWS Secrets Manager
> or Systems Manager Parameter Store.

---

## 10. Database migrations + seed

Run these **once per deploy** (or once, then on schema changes):

```bash
# Apply pending migrations to the production database
docker exec kandarp npx prisma migrate deploy

# Seed the owner user + RBAC roles + permissions
docker exec kandarp npx tsx prisma/seed.ts
```

For ECS/App Runner, run these as a one-shot task (a separate container that
exits after seeding) rather than on every app start.

---

## 11. Updating the deployment

When you push new code:

```bash
# 1. Locally: build + push the new image
docker build -t kandarp-os .
docker tag kandarp-os <account>.dkr.ecr.<region>.amazonaws.com/kandarp-os:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/kandarp-os:latest

# 2. On the EC2: pull + restart
ssh -i your-key.pem ubuntu@<ec2-public-ip>
docker pull <account>.dkr.ecr.<region>.amazonaws.com/kandarp-os:latest
docker stop kandarp && docker rm kandarp
# Re-run the `docker run` command from §6.5

# 3. Run migrations if the schema changed
docker exec kandarp npx prisma migrate deploy
```

For zero-downtime deploys, run two containers and swap nginx's upstream, or
use ECS Fargate (which handles rolling updates automatically).

---

## 12. Monitoring + logs

```bash
# App logs (stdout from the container)
docker logs -f kandarp

# Last 100 lines
docker logs --tail 100 kandarp

# nginx access + error logs (on the host)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Postgres (RDS) — view in the RDS console → Logs & events
```

For production monitoring, consider:
- **CloudWatch Container Insights** (ECS) or **CloudWatch Logs** (EC2 via
  the Docker log driver)
- **Sentry** (set `SENTRY_DSN`) for app error tracking
- **UptimeRobot** or **AWS CloudWatch Synthetics** for uptime monitoring

---

## 13. Backups

### RDS (recommended)
- Enable **automated backups** in the RDS console (retention 7–30 days).
- Enable **Point-in-Time Recovery** for down-to-the-second restore.

### Self-managed Postgres (container)
```bash
# Daily dump (add to cron)
docker exec kandarp-db pg_dump -U kandarp kandarp_os | gzip > /backups/kandarp-$(date +%F).sql.gz

# Restore
gunzip -c /backups/kandarp-2026-07-18.sql.gz | docker exec -i kandarp-db psql -U kandarp kandarp_os
```

---

## 14. Cost estimate (Free Tier vs. post-Free Tier)

| Resource | Free Tier (12 mo) | After Free Tier |
|----------|-------------------|-----------------|
| EC2 `t3.micro` (always-on) | $0 | ~$8–10/mo |
| RDS `db.t3.micro` (always-on) | $0 | ~$13–15/mo |
| ECR (500 MB) | $0 | ~$0.01/mo |
| Data transfer (100 GB/mo) | $0 | ~$0.09/GB over 100 GB |
| Route 53 (optional) | — | ~$0.50/mo per zone |
| **Total** | **$0/mo** | **~$21–25/mo** |

To stay near $0 after the Free Tier: run Postgres in a container on the same
EC2 (saves the RDS cost, but no managed backups — ~$8–10/mo total).

---

## 15. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `docker build` crashes on EC2 | 1 GB RAM is not enough to build | Build locally or in CI, push to ECR, pull on EC2 |
| App won't start, `ECONNREFUSED db:5432` | Postgres not ready or wrong host | Check `DATABASE_URL` host; if using RDS, use the RDS endpoint, not `db` |
| `PrismaClientInitializationError` | Missing `DATABASE_URL` or DB not reachable | Verify the env var + security group allows port 5432 |
| 502 Bad Gateway from nginx | App not running or not on port 3000 | `docker ps` to check; `docker logs kandarp` for errors |
| Admin login redirects in a loop | `ADMIN_JWT_SECRET` not set or mismatched | Ensure the same secret is set on every restart |
| Public site shows fallback data | DB not seeded | Run `npx tsx prisma/seed.ts` |
| `OOMKilled` in `docker ps` | Container exceeded memory | Add swap (§6.4); upgrade to `t3.small` (2 GB) if needed |
| Certbot fails | Port 80 blocked or DNS not propagated | Open port 80 in the security group; wait for DNS |
| `Cannot find module '@prisma/client'` | Standalone bundler missed it | The Dockerfile copies it explicitly (§Dockerfile); rebuild |

---

## 16. Quick reference — one-page deploy

```bash
# ── On your local machine ─────────────────────────────────────────────
cp .env.example .env.local && nano .env.local          # fill in secrets
docker build -t kandarp-os .                            # build
aws ecr create-repository --repository-name kandarp-os  # one-time
aws ecr get-login-password --region <r> | docker login --username AWS --password-stdin <acct>.dkr.ecr.<r>.amazonaws.com
docker tag kandarp-os <acct>.dkr.ecr.<r>.amazonaws.com/kandarp-os:latest
docker push <acct>.dkr.ecr.<r>.amazonaws.com/kandarp-os:latest

# ── On the EC2 ────────────────────────────────────────────────────────
curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER  # one-time
# (re-login, add swap, aws configure, ecr login — see §6.4)
docker pull <acct>.dkr.ecr.<r>.amazonaws.com/kandarp-os:latest
docker run -d --name kandarp --restart unless-stopped -p 3000:3000 \
  --env-file .env.local \
  <acct>.dkr.ecr.<r>.amazonaws.com/kandarp-os:latest
docker exec kandarp sh -c "npx prisma migrate deploy && npx tsx prisma/seed.ts"

# ── nginx + TLS ───────────────────────────────────────────────────────
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp nginx.conf /etc/nginx/conf.d/kandarp.conf && sudo nano /etc/nginx/conf.d/kandarp.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# ── DNS ───────────────────────────────────────────────────────────────
# A record → EC2 public IP
```

---

## See also

- [`deployment-vercel.md`](./deployment-vercel.md) — the Vercel deployment path
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — full architecture documentation
- [`backend/security.md`](./backend/security.md) — auth, RBAC, JWT, session model
- [`backend/configuration.md`](./backend/configuration.md) — environment variables
- [`.env.example`](../.env.example) — all env vars with descriptions
