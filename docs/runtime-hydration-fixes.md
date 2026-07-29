# Runtime Hydration and Animation Fixes

_Status: ✅ Active_  
_Last updated: 2026-07-29_

## Purpose

This document records the July 2026 fixes for pages that rendered server HTML but showed inactive components, missing terminal content, and animations that did not start in the local development environment.

## Symptoms

- The page layout and headings appeared, but interactive components did not respond.
- Navigation menus, filters, buttons, modal panels, and copy controls were inactive.
- Framer Motion and Three.js animations did not initialize.
- The System Information terminal remained at an empty prompt.
- Next.js development hot-module updates could fail to connect.
- Routes still returned HTTP 200 because server rendering was successful.

## Root Cause

The development Content Security Policy allowed same-origin and inline scripts but blocked dynamic code evaluation required by the Next.js development runtime. It also did not explicitly allow local WebSocket connections used for hot-module replacement.

This produced a server/client split:

1. Next.js successfully generated and returned server-rendered HTML.
2. The browser displayed that HTML.
3. The development runtime could not complete React hydration under the restrictive policy.
4. Client components, event handlers, terminal timers, Framer Motion, Lenis, GSAP, and Three.js initialization did not run.

The production policy did not need dynamic evaluation and remains strict.

## Implemented Fixes

### Environment-aware Content Security Policy

The CSP in `next.config.mjs` now distinguishes development from production:

- Development `script-src` permits `'unsafe-eval'` for generated Next.js development modules.
- Production `script-src` does not permit `'unsafe-eval'`.
- Development `connect-src` permits WebSocket connections to `localhost` and `127.0.0.1` on local ports.
- Production `connect-src` remains same-origin only.
- `upgrade-insecure-requests` remains production-only so local HTTP development is not upgraded.

This restores React hydration, event handlers, HMR, Framer Motion, Lenis, GSAP, and Three.js while preserving the stricter production policy.

### System Information terminal lifecycle

The terminal hook in `src/packages/hooks/useAboutTerminal.ts` now relies on its running-state and session-generation guards for scheduled callbacks. Cleanup still clears queued timers and invalidates the active session.

This prevents a stale shared cancellation value from causing every callback to exit before the first command appears. Reduced-motion behavior remains supported: users requesting reduced motion receive the complete static transcript without typing animation.

## Security Boundary

`'unsafe-eval'` is enabled only when `NODE_ENV` is `development`. It must not be added unconditionally or enabled in production. The local WebSocket sources are also development-only.

When changing the CSP, verify both modes:

```bash
npm run dev
npm run build
npm run start
```

The development response should contain local runtime permissions. The production response must retain the stricter policy.

## Validation Completed

The following checks passed after the fix:

```bash
npm run typecheck
npm run lint
npm run build
```

The production build generated all 18 application routes. Existing lint warnings are non-blocking formatting and static-key warnings; there are no lint errors.

The following development routes returned HTTP 200 with non-empty HTML:

- `/`
- `/about`
- `/projects`
- `/experience`
- `/skills`
- `/infrastructure`
- `/contact`
- `/blog`
- `/blog/tags`
- `/background-preview`
- `/cloud-infinity-preview`

## Local Verification

1. Start the development server with `npm run dev`.
2. Open `http://localhost:3000/`.
3. Perform one hard refresh with `Ctrl+F5` if an older blocked bundle is cached.
4. Confirm that navigation and buttons respond.
5. Confirm that the hero and System Information terminals render content.
6. Confirm that filters, expandable panels, modal views, and copy controls respond.
7. Confirm that motion and 3D enhancements initialize unless reduced motion is enabled at the operating-system level.

## Troubleshooting

### Server HTML appears but all interactions are inactive

Inspect the browser console for CSP violations involving script evaluation, WebSockets, or Next.js chunks. Then inspect the response `Content-Security-Policy` header. In development it should include `'unsafe-eval'` and local WebSocket sources.

### System Information terminal stays empty

Confirm that React hydration completed and that no client runtime error is present. The terminal starts immediately after mount and does not require the Intersection Observer callback to prime its sequence.

### Animations intentionally do not run

Check the operating-system or browser `prefers-reduced-motion` setting. The application intentionally disables or simplifies motion when reduced motion is requested.

### Changes do not appear

Use `http://localhost:3000/`, not the production-check process on port 3001. Perform a hard refresh after configuration changes. Next.js automatically restarts when `next.config.mjs` changes, but stale browser assets may still need to be discarded.

## Maintenance Rules

- Keep development-only CSP permissions conditional on `NODE_ENV`.
- Do not make primary content depend exclusively on animation completion.
- Every timer-driven hook must cancel timers and invalidate stale sessions during cleanup.
- Keep server HTML meaningful so content remains available before hydration.
- Run type checking, linting, production build, and route checks after changes to providers, CSP, hydration boundaries, or animation hooks.
