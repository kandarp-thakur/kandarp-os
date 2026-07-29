"use client";

import { Suspense, lazy } from "react";

import { ClientOnly } from "@features/shared/components/ClientOnly";

/**
 * BootScreenClient — a thin Client Component wrapper around
 * [`BootScreen`](./BootScreen.tsx).
 *
 * WHY THIS EXISTS
 * ---------------
 * `app/layout.tsx` is a Server Component. `BootScreen` uses framer-motion
 * `AnimatePresence` + `motion.div`, which emit inline styles + `data-*`
 * hydration markers during SSR that differ from what the client computes on
 * hydration. Statically importing it into the layout pulls that subtree into
 * the server render and risks a hydration mismatch.
 *
 * THE FIX
 * -------
 * Historically this used `next/dynamic({ ssr: false })`. But in the App
 * Router, a `next/dynamic({ ssr: false })` component mounted by a Server
 * Component (the root layout) makes Next.js error during SSR and bail the
 * ENTIRE layout segment to client-side rendering
 * (`BAILOUT_TO_CLIENT_SIDE_RENDERING`). The server-rendered section HTML is
 * then streamed into hidden Suspense slots that the client reveal may fail to
 * recover — leaving the page blank except for Client Components.
 *
 * We now use `React.lazy` + `Suspense` wrapped in `ClientOnly`. The server
 * and the client's first render both produce `null` (matching → no hydration
 * mismatch), and the real overlay mounts only after hydration. The lazy
 * import keeps `BootScreen` (and framer-motion) out of the server bundle —
 * identical to `ssr: false`, but WITHOUT the route-segment bailout.
 */
const BootScreen = lazy(() =>
    import("@features/hero/components/BootScreen").then((m) => ({
        default: m.BootScreen,
    })),
);

/**
 * Mount the boot overlay client-side only.
 *
 * Forwards an optional `onComplete` callback to the underlying
 * [`BootScreen`](./BootScreen.tsx).
 */
export function BootScreenClient({ onComplete }: { onComplete?: () => void }) {
    return (
        <ClientOnly>
            <Suspense fallback={null}>
                <BootScreen onComplete={onComplete} />
            </Suspense>
        </ClientOnly>
    );
}

BootScreenClient.displayName = "BootScreenClient";
