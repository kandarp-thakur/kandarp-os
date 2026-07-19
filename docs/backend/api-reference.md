# API Reference — Kandarp OS Admin Backend

> Complete reference for all admin API routes.
> Base URL: `/api/admin` · Auth: `kos_admin_session` cookie (HttpOnly, SameSite=Lax)

---

## Conventions

### Authentication

All admin API routes (except public auth endpoints) require a valid session
cookie. The middleware verifies the JWT signature at the edge (Web Crypto);
the route handler re-checks the `sid` against the `Session` table via
`requireAuth()` / `requirePermission()`.

| Response                                                       | Status | When                                      |
| -------------------------------------------------------------- | ------ | ----------------------------------------- |
| `{ error: "Unauthorized", code: 401 }`                         | 401    | No session or invalid JWT                 |
| `{ error: "Session expired or revoked", code: 401 }`           | 401    | Session revoked in DB                     |
| `{ error: "Forbidden — insufficient permissions", code: 403 }` | 403    | Valid session, missing permission         |
| `{ error: "Too many requests. Please slow down.", code: 429 }` | 429    | Rate limit exceeded                       |
| `{ error: "Cross-site request blocked (CSRF).", code: 403 }`   | 403    | Origin mismatch on state-changing request |
| `{ error: "Request body too large.", code: 413 }`              | 413    | Body exceeds size limit                   |

### Response Shape

```json
// Success
{ "data": "..." }

// Error
{ "error": "Human-readable message", "code": 400 }
```

Every response includes an `x-request-id` header (correlation ID) for support.

### Rate Limiting

- **General admin API**: 120 requests / 60 seconds per IP (middleware)
- **Login**: 5 attempts / 15 minutes per IP (route handler)

### Request Body Size

- **General admin API**: 1 MB
- **Media upload**: 12 MB (handler enforces 10 MB on the file)

---

## Auth

### POST `/api/admin/auth/login`

Authenticate a user and set the session cookie.

**Public** — no session required.

**Body**:

```json
{
    "email": "admin@kandarp.online",
    "password": "ChangeMe!2026",
    "remember": false
}
```

**Responses**:

| Status | Body                                                       |
| ------ | ---------------------------------------------------------- |
| 200    | `{ "user": { "id", "name", "email", "role" } }`            |
| 200    | `{ "requiresTotp": true, "userId": "..." }` (2FA enrolled) |
| 400    | `{ "error": "Invalid email or password." }`                |
| 401    | `{ "error": "Invalid email or password." }`                |
| 429    | `{ "error": "Too many login attempts. Try again later." }` |

Sets `kos_admin_session` cookie (HttpOnly, SameSite=Lax, Secure in prod).

### POST `/api/admin/auth/logout`

Revoke the current session and clear the cookie. Idempotent.

**Responses**: `200 { "ok": true }`

### GET `/api/admin/auth/me`

Get the current user from the session.

**Responses**: `200 { "user": { "id", "name", "email", "role" } }` or `401`.

### POST `/api/admin/auth/forgot`

Request a password reset email (if the email exists).

**Public** — no session required.

**Body**: `{ "email": "..." }`

**Responses**: `200 { "ok": true }` (always — anti-enumeration).

### GET `/api/admin/auth/sessions`

List the current user's active sessions (device management).

**Responses**:

```json
{
    "current": "sid-...",
    "sessions": [
        {
            "token": "sid-...",
            "ip": "1.2.3.4",
            "userAgent": "Mozilla/5.0...",
            "rememberMe": false,
            "lastUsedAt": "2026-01-01T00:00:00.000Z",
            "createdAt": "2026-01-01T00:00:00.000Z",
            "expiresAt": "2026-01-01T08:00:00.000Z",
            "isCurrent": true
        }
    ]
}
```

### DELETE `/api/admin/auth/sessions`

Revoke a session by token, or all other sessions ("logout other devices").

**Body**: `{ "token": "sid-..." }` (omit to revoke all others)

**Responses**: `200 { "ok": true }` or `400` (can't revoke current session here).

### POST `/api/admin/auth/change-password`

Change the current user's password (requires re-authentication).

**Body**: `{ "currentPassword": "...", "newPassword": "..." }`

**Responses**:

| Status | Body                                               |
| ------ | -------------------------------------------------- |
| 200    | `{ "ok": true, "revokedSessions": 2 }`             |
| 400    | `{ "error": "New password must be different..." }` |
| 401    | `{ "error": "Current password is incorrect." }`    |

On success, all sessions except the current one are revoked.

---

## Users

### GET `/api/admin/users`

List users. **Permission**: `users:read`

**Query**: `?page=1&pageSize=20&search=&sort=name&order=asc`

### POST `/api/admin/users`

Create a user. **Permission**: `users:write`

**Body**: `{ "name", "email", "password", "role": "owner"|"admin"|"editor"|"viewer" }`

### GET `/api/admin/users/<id>`

Get one user. **Permission**: `users:read`

### PATCH `/api/admin/users/<id>`

Update a user. **Permission**: `users:write`

**Body**: `{ "name"?, "email"?, "password"?, "role"?, "status"? }`

If `password`, `role`, or `status === "suspended"` changes, all sessions for that
user are revoked (force re-login).

### DELETE `/api/admin/users/<id>`

Delete a user (soft delete via `archivedAt`). **Permission**: `users:delete`

---

## CRUD Collections

All collections follow the same pattern via the CRUD factory
([`crud.ts`](../../src/lib/admin/crud.ts)):

| Method | Path                                           | Permission            | Description                                                  |
| ------ | ---------------------------------------------- | --------------------- | ------------------------------------------------------------ |
| GET    | `/api/admin/<collection>`                      | `<collection>:read`   | List (paginated, filterable, searchable)                     |
| POST   | `/api/admin/<collection>`                      | `<collection>:write`  | Create                                                       |
| GET    | `/api/admin/<collection>/<id>`                 | `<collection>:read`   | Get one                                                      |
| PATCH  | `/api/admin/<collection>/<id>`                 | `<collection>:write`  | Update                                                       |
| DELETE | `/api/admin/<collection>/<id>`                 | `<collection>:delete` | Soft delete (archive)                                        |
| POST   | `/api/admin/<collection>/bulk`                 | `<collection>:write`  | Bulk action (delete/archive/restore/publish/draft/duplicate) |
| POST   | `/api/admin/<collection>/reorder`              | `<collection>:write`  | Reorder (drag-and-drop)                                      |
| POST   | `/api/admin/<collection>/<id>/duplicate`       | `<collection>:write`  | Duplicate                                                    |
| POST   | `/api/admin/<collection>/<id>/archive`         | `<collection>:write`  | Archive (soft delete)                                        |
| POST   | `/api/admin/<collection>/<id>/restore`         | `<collection>:write`  | Restore (un-archive)                                         |
| POST   | `/api/admin/<collection>/<id>/restore-version` | `<collection>:write`  | Restore a previous version                                   |
| GET    | `/api/admin/<collection>/export`               | `<collection>:read`   | Export (JSON)                                                |
| POST   | `/api/admin/<collection>/import`               | `<collection>:write`  | Import (JSON)                                                |

### Collections

| Collection       | Path                          | Permissions                                            |
| ---------------- | ----------------------------- | ------------------------------------------------------ |
| Projects         | `/api/admin/projects`         | `projects:read` / `projects:write` / `projects:delete` |
| Experience       | `/api/admin/experience`       | `experience:*`                                         |
| Skills           | `/api/admin/skills`           | `skills:*`                                             |
| Infra Nodes      | `/api/admin/infra-nodes`      | `infrastructure:*`                                     |
| Infra Edges      | `/api/admin/infra-edges`      | `infrastructure:*`                                     |
| Awards           | `/api/admin/awards`           | `awards:*`                                             |
| Blog Posts       | `/api/admin/blog-posts`       | `blog:*`                                               |
| Education        | `/api/admin/education`        | `education:*`                                          |
| Certificates     | `/api/admin/certificates`     | `certificates:*`                                       |
| Services         | `/api/admin/services`         | `services:*`                                           |
| Resumes          | `/api/admin/resumes`          | `resumes:*`                                            |
| Media            | `/api/admin/media`            | `media:*`                                              |
| Users            | `/api/admin/users`            | `users:*`                                              |
| Activity Logs    | `/api/admin/activity-logs`    | `activity:*`                                           |
| Analytics Events | `/api/admin/analytics-events` | `analytics:*`                                          |

### List Query Parameters

| Param      | Type            | Default | Notes                          |
| ---------- | --------------- | ------- | ------------------------------ |
| `page`     | number          | 1       | 1-based                        |
| `pageSize` | number          | 20      | Max 100                        |
| `sort`     | string          | —       | Field name                     |
| `order`    | `asc` \| `desc` | `asc`   |                                |
| `search`   | string          | —       | Full-text search               |
| `<field>`  | string          | —       | Exact filter (any other param) |

---

## Singletons

Singletons (settings, profile, site-customization) have GET + PATCH (no id):

### Settings

| Method | Path                  | Permission       |
| ------ | --------------------- | ---------------- |
| GET    | `/api/admin/settings` | `settings:read`  |
| PATCH  | `/api/admin/settings` | `settings:write` |

### Profile

| Method | Path                 | Permission      |
| ------ | -------------------- | --------------- |
| GET    | `/api/admin/profile` | `profile:read`  |
| PATCH  | `/api/admin/profile` | `profile:write` |

### Site Customization

| Method | Path                            | Permission                           |
| ------ | ------------------------------- | ------------------------------------ |
| GET    | `/api/admin/site-customization` | `settings:read`                      |
| PATCH  | `/api/admin/site-customization` | `settings:write`                     |
| POST   | `/api/admin/site-customization` | `settings:write` (reset to defaults) |

---

## Media (Special)

Media has custom routes beyond the CRUD factory:

| Method | Path                             | Permission    | Notes                        |
| ------ | -------------------------------- | ------------- | ---------------------------- |
| POST   | `/api/admin/media/upload`        | `media:write` | Multipart upload (10 MB max) |
| POST   | `/api/admin/media/<id>/crop`     | `media:write` | Crop + re-optimize           |
| POST   | `/api/admin/media/<id>/optimize` | `media:write` | Re-run optimization          |

See [media.md](./media.md) for details.

---

## Dashboard & Search

### GET `/api/admin/dashboard`

Get dashboard stats (counts, recent projects, recent posts, activity).

**Permission**: any authenticated user.

### GET `/api/admin/search?q=<query>`

Global search across collections.

**Permission**: any authenticated user.

### GET `/api/admin/backup`

Export all data (JSON).

**Permission**: `settings:read`.

### POST `/api/admin/backup`

Import data (JSON).

**Permission**: `settings:write`.

---

## Public (Analytics)

### POST `/api/admin/analytics`

Ingest an analytics event (pageview, click, etc.).

**Public** — no session required (the public site fires beacons).

**Body**: `{ "type", "path", "referrer", "device", "browser", "duration", "meta" }`

**Responses**: `200 { "ok": true }`.

---

## RBAC Permissions

See [`rbac.ts`](../../src/lib/admin/rbac.ts) for the full permission matrix.

### Roles

| Role     | Description                                  |
| -------- | -------------------------------------------- |
| `owner`  | Full access (all permissions)                |
| `admin`  | Manage users + all content                   |
| `editor` | Create/edit all content (no user management) |
| `viewer` | Read-only access to all content              |

### Permission Format

Permissions follow `<collection>:<action>`:

- `users:read`, `users:write`, `users:delete`
- `projects:read`, `projects:write`, `projects:delete`
- `media:read`, `media:write`, `media:delete`
- `settings:read`, `settings:write`
- etc.

The `owner` role has all permissions. Other roles have a defined subset.
Per-user permission overrides can grant or revoke specific permissions.
