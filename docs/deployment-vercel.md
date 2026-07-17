# Deploying Kandarp OS to Vercel with a Custom Domain

This guide walks you through deploying the portfolio to **Vercel** and
pointing a **custom domain** at it. The public site (home, blog, projects,
experience, skills, infrastructure, contact) is fully static/SSR and deploys
to Vercel with zero changes.

---

## 0. Prerequisites

| Requirement | Status |
|---|---|
| Code on `main` branch of `github.com/kandarp-thakur/kandarp-os` | ✅ |
| `npm run build` passes locally (124 routes generated) | ✅ |
| [`vercel.json`](../vercel.json) committed | ✅ |
| A Vercel account (free tier is fine) | sign up at vercel.com |
| A custom domain purchased from a registrar (GoDaddy, Namecheap, Cloudflare, etc.) | you provide |

---

## 1. Import the project into Vercel

1. Go to **https://vercel.com/new**.
2. Under **Import Git Repository**, find `kandarp-thakur/kandarp-os`.
   - If it is not listed, click **Adjust GitHub App Permissions** and grant
     access to the repository (or its organization).
3. Click **Import**.

### Build & Output Settings

Vercel auto-detects Next.js from [`package.json`](../package.json) and
[`next.config.mjs`](../next.config.mjs). The committed
[`vercel.json`](../vercel.json) already pins:

- **Framework preset:** Next.js
- **Build command:** `next build`
- **Install command:** `npm install`
- **Region:** `bom1` (Mumbai — closest to your Asia/Calcutta timezone)

Leave the defaults and click **Deploy**. The first deployment will finish in
~2–3 minutes and you will get a `*.vercel.app` preview URL.

---

## 2. Add Environment Variables

Go to **Project → Settings → Environment Variables** and add the following.
Use the **Production** environment (and Preview if you want it there too).

> ⚠️ **Never** commit real secrets to git. Add them only in the Vercel dashboard.

### Required for the public site

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` | Your final custom domain (with `https://`). Used for canonical URLs, sitemap, and Open Graph tags. |

### Required for the admin console to boot in production

| Name | Value | Notes |
|---|---|---|
| `ADMIN_JWT_SECRET` | `7a6f3a6f6aded38c7921f509a0c9a7270cc6faa4e0c22ef4c3e43c6641f746d85f1baff62e4595848ade9fd7726acead` | 96-byte hex string generated for you. HMAC-signs admin session JWTs. **Keep private.** |
| `ADMIN_OWNER_EMAIL` | `you@yourdomain.com` | The first admin account seeded on boot. Change the password immediately after first login. |
| `ADMIN_OWNER_PASSWORD` | a strong, unique password | Change on first login. |

### Optional (only if you use the feature)

| Name | Example | Notes |
|---|---|---|
| `CONTACT_EMAIL_API_KEY` | `re_xxxxx` | Resend/SendGrid key for the contact form (`/api/contact`). |
| `CONTACT_EMAIL_TO` | `hello@yourdomain.com` | Where contact submissions are delivered. |
| `CONTACT_EMAIL_FROM` | `portfolio@yourdomain.com` | Must be a verified sender. |
| `NEXT_PUBLIC_ANALYTICS_SRC` | `https://plausible.io/js/script.js` | Public analytics script. |
| `NEXT_PUBLIC_ANALYTICS_DOMAIN` | `yourdomain.com` | Analytics site/domain id. |
| `GITHUB_TOKEN` | `ghp_xxxxx` | For fetching repos in `/api/projects`. Server-only. |

After adding variables, click **Redeploy** so the new build picks them up.

---

## 3. Add your custom domain

1. Go to **Project → Settings → Domains**.
2. Click **Add**, enter your root domain (e.g. `yourdomain.com`), and click **Add**.
3. Add the `www` variant too (e.g. `www.yourdomain.com`) and set it to
   **Redirect to** the root domain.

Vercel will show you the DNS records you need to create at your registrar.

### DNS records to add at your registrar

| Type | Name / Host | Value / Points to | TTL |
|---|---|---|---|
| **A** | `@` (root) | `76.76.21.21` | Auto / 3600 |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 3600 |

> The exact A-record IP and CNAME target are shown in the Vercel dashboard
> after you add the domain — use those values if they differ from above.

### Verify the domain

1. Back in **Settings → Domains**, wait for the **DNS Configuration** and
   **Domain Configuration** checks to turn green (usually a few minutes, up to
   48 hours for slow registrars).
2. Vercel automatically provisions an SSL/TLS certificate via Let's Encrypt.
   Once it says **Valid Certificate**, your site is live at `https://yourdomain.com`.

---

## 4. Update `NEXT_PUBLIC_SITE_URL` to your domain

After the domain is live, make sure `NEXT_PUBLIC_SITE_URL` in the Vercel
environment variables matches your final domain exactly (including `https://`
and no trailing slash). This value feeds:

- [`src/app/sitemap.ts`](../src/app/sitemap.ts) — the `<loc>` entries
- [`src/app/robots.ts`](../src/app/robots.ts) — the sitemap reference
- [`src/app/layout.tsx`](../src/app/layout.tsx) — canonical + Open Graph metadata

Then **Redeploy** so metadata points at the correct domain.

---

## 5. Every push deploys automatically

Because the project is connected to GitHub, every `git push origin main`
triggers a new production deployment. Pull requests get isolated **Preview
deployments** with their own `*.vercel.app` URL.

---

## ⚠️ Important limitation: the admin console on Vercel

The admin console persists data to a **file-based JSON store** at
`.admin-data/` (see [`src/lib/admin/store.ts`](../src/lib/admin/store.ts)) and
writes uploaded media to `public/media/`.

**Vercel's serverless filesystem is read-only at runtime.** This means:

- ✅ The **public portfolio site** (blog, projects, skills, etc.) works
  perfectly — all of that content is read at **build time** from
  [`content/`](../content) and [`src/data/`](../src/data) and baked into the
  deployment.
- ❌ **Admin writes will not persist** on Vercel. Any change made through the
  admin UI (editing projects, uploading media, changing settings) will be lost
  when the serverless function's ephemeral filesystem is recycled, and writes
  may even throw errors.

### Recommended path forward for the admin

To make the admin console production-usable on Vercel, swap the file store for
a real database. The codebase is designed for exactly this —
[`src/lib/admin/store.ts`](../src/lib/admin/store.ts) is documented as
"the swappable seam" and [`src/lib/admin/repo.ts`](../src/lib/admin/repo.ts)
is the public API, so only the store adapter needs to change. Good options:

- **Vercel Postgres** (built-in, free tier available)
- **Vercel KV / Upstash Redis** for the session cache
- **Vercel Blob** for media uploads (replaces `public/media/` writes)

Until that swap is done, manage your content via the markdown/data files in
git and rebuild — the public site will be fully functional on Vercel.

---

## 6. Quick troubleshooting

| Symptom | Fix |
|---|---|
| Build fails on Vercel but passes locally | Ensure Node 18.17+ is set in **Settings → General → Node.js Version**. |
| Domain stays "Pending" | Double-check the A/CNAME records at your registrar; clear the previous DNS cache by lowering TTL. |
| `ERR: ADMIN_JWT_SECRET must be set...` | You forgot to add the env var in the Vercel dashboard — add it and redeploy. |
| Admin login works but changes vanish | Expected on Vercel's read-only FS — see the limitation note above. |
| 404 on `/admin/*` after deploy | The admin routes are dynamic (`ƒ`) and need env vars present; redeploy after adding them. |

---

## Summary checklist

- [ ] Import repo into Vercel
- [ ] Add environment variables (at least `NEXT_PUBLIC_SITE_URL` + `ADMIN_JWT_SECRET`)
- [ ] Add custom domain in **Settings → Domains**
- [ ] Create A + CNAME DNS records at your registrar
- [ ] Wait for SSL certificate to provision
- [ ] Set `NEXT_PUBLIC_SITE_URL` to `https://yourdomain.com` and redeploy
- [ ] (Later) Migrate admin store to Vercel Postgres/Blob for persistence
