# Admin Console Usage — Kandarp OS

> Operational guide for authenticated content, identity, appearance, media, and platform administration.

## Access and Session Safety

1. Open `/admin/login` on the configured site origin.
2. Sign in with the seeded owner account or an account created by an authorized administrator.
3. Complete TOTP when the account has two-factor authentication enabled.
4. Use the profile/security pages to change the bootstrap password, enroll TOTP, review sessions, and revoke other devices.
5. Sign out from the user menu when finished on a shared device.

The session is an HttpOnly cookie backed by a persisted database session. Revoking a session or suspending an account takes effect on the next protected request.

## Permissions and Navigation

The sidebar is defined in [`src/features/admin/components/nav-config.ts`](../src/features/admin/components/nav-config.ts). The 64 configured destinations map to pages under [`src/app/admin/(console)`](../src/app/admin/(console)/page.tsx).

The effective permission is resolved as:

```text
per-user explicit grant or denial → role default when no override exists
```

Owners have full system access. Administrators, editors, and viewers receive narrower role defaults. An owner can use the roles/users permission controls to add or explicitly deny individual capabilities without changing the user's role. Changes are evaluated at request time and do not require a new login.

## Content Workflow

For a normal CMS collection such as projects, experience, skills, awards, blog posts, education, certificates, services, resumes, or infrastructure:

1. Open the collection from the sidebar.
2. Use search, filters, pagination, and sorting to locate records.
3. Create or edit a record using the validated editor form.
4. Save the record; the API validates the payload and records an activity event.
5. Publish or draft the record where the collection supports status.
6. Use archive rather than destructive deletion when the content may be needed later.
7. Restore archived records or restore a previous version from the record actions menu.
8. Use duplicate, reorder, bulk actions, import, and export only after reviewing the target set.

Published public pages read through [`src/backend/services/public-data.ts`](../src/backend/services/public-data.ts). Successful content mutations invalidate the relevant cache tags, so published changes become visible without manually editing frontend data files.

## Appearance and Site Controls

- **Hero**: edit heading, terminal text, statistics, calls to action, and social links.
- **Theme/appearance**: configure brand, colors, typography, animation, performance, and Three.js preferences.
- **Navigation/menus/footer**: maintain public navigation and footer columns.
- **SEO**: update global metadata, canonical defaults, and social preview configuration.
- **Website builder**: manage section visibility and page-level composition.
- **Settings**: maintain site identity, contact fields, notification recipients, cache preferences, and maintenance mode.

Validate the public home and affected routes after changing global appearance or navigation settings.

## Media and Documents

Use the media library for images and the resume/document modules for downloadable assets. Add descriptive alt text and keep filenames meaningful for operators even though storage uses generated safe keys.

Local storage is intended for development or a durable single-node host. Production/serverless deployments should configure the complete Cloudinary credential set. Uploaded secrets and integration values are never returned as plaintext.

## Identity and Security

- **Users**: create accounts, assign roles, suspend access, and revoke sessions after sensitive changes.
- **Roles/permissions**: inspect role defaults and per-user overrides.
- **Sessions**: review device metadata and revoke individual or other sessions.
- **API keys**: create scoped credentials for `/api/v1/*`; copy the raw secret immediately because it is shown only once.
- **Security**: enroll TOTP, change passwords, and review security state.
- **Activity logs**: inspect administrative mutations and security events.

Grant the smallest useful API-key scope. Revoke credentials that are no longer used. Do not paste passwords, API keys, or managed secrets into activity details, content fields, screenshots, or support tickets.

## Analytics, Health, and Operations

- **Dashboard/analytics**: review bounded public events and aggregate summaries.
- **Activity logs**: investigate who changed which record and when.
- **System health**: compare application liveness and database readiness.
- **Backup**: export an application-level sanitized backup before large content changes; retain provider/database backups separately for disaster recovery.
- **Integrations/environment variables**: update managed metadata and values through dedicated controls. Responses expose configured state, not plaintext.

## Safe Change Checklist

Before a large edit:

- export a current application backup;
- confirm the target environment and current user role;
- make one logical change at a time;
- preview the public route after saving;
- inspect the activity log for the expected mutation;
- restore or revert a version when the result is incorrect.

Before production release, run the documented lint, typecheck, test, Prisma validation, migration status, double-seed, and production-build gates. See [`backend/README.md`](./backend/README.md) and [`deployment-vercel.md`](./deployment-vercel.md).
