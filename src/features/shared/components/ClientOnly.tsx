"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * ClientOnly — renders its children ONLY after the component has mounted on
 * the client.
 *
 * WHY THIS EXISTS
 * ---------------
 * `next/dynamic` with `{ ssr: false }` is the traditional way to keep a
 * component out of the server render. But in the Next.js App Router, when a
 * `next/dynamic({ ssr: false })` component is mounted by a Server Component
 * (such as the root `layout.tsx`), Next.js errors during SSR and marks the
 * ENTIRE route/layout segment with `BAILOUT_TO_CLIENT_SIDE_RENDERING`. The
 * server-rendered HTML for every section is then streamed into hidden
 * Suspense slots (`<div hidden id="S:1">`) that the client reveal (`$RV`) may
 * fail to recover — leaving the page blank except for the Client Components
 * that re-render on the client.
 *
 * This wrapper replaces that pattern. It renders `null` on the server AND on
 * the client's first render (so the two match exactly — no hydration
 * mismatch), then renders its children after `useEffect` confirms a client
 * mount. Pair it with `React.lazy` + `Suspense` so the heavy module (e.g.
 * `@react-three/fiber`) stays a dynamic chunk that is never evaluated during
 * SSR:
 *
 * ```tsx
 * const LazyScene = lazy(() => import("./Scene").then((m) => ({ default: m.Scene })));
 *
 * export function Host() {
 *     return (
 *         <ClientOnly>
 *             <Suspense fallback={null}>
 *                 <LazyScene />
 *             </Suspense>
 *         </ClientOnly>
 *     );
 * }
 * ```
 *
 * Net effect: identical to `next/dynamic({ ssr: false })` (nothing on the
 * server, real component on the client after hydration) but WITHOUT the
 * route-segment bailout that orphans the server-rendered page content.
 */
export function ClientOnly({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    return mounted ? <>{children}</> : null;
}

ClientOnly.displayName = "ClientOnly";
