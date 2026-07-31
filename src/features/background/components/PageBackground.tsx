"use client";

import { Suspense, lazy } from "react";

import { ClientOnly } from "@features/shared/components/ClientOnly";

/**
 * PageBackground — the persistent, page-wide living infrastructure background.
 *
 * Mounts the animated [`DevOpsBackground`](../background/DevOpsBackground.tsx)
 * once at the layout level so it sits behind every section of the single-page
 * experience (and behind the blog routes). The animated layer is `fixed` to
 * the viewport at `z-index: -1`, so it never scrolls away and never
 * intercepts pointer events — the content always remains the focus.
 *
 * Loading strategy (mirrors hero-design §11.2): the animated background must
 * NOT block first paint. We therefore defer it to the client via `React.lazy`
 * wrapped in `ClientOnly` — its JS is fetched async and never sits on the
 * critical render path. It mounts immediately on hydration (no extra rAF
 * gate) so the constellation appears as early as possible.
 *
 * NOTE: this used to use `next/dynamic({ ssr: false })`. In the App Router,
 * a `next/dynamic({ ssr: false })` component mounted by a Server Component
 * (the root layout) makes Next.js error during SSR and bail the ENTIRE layout
 * segment to client-side rendering (`BAILOUT_TO_CLIENT_SIDE_RENDERING`),
 * orphaning the server-rendered section HTML. `React.lazy` + `ClientOnly`
 * achieves the same "nothing on the server, real component on the client
 * after hydration" behavior WITHOUT the route-segment bailout.
 *
 * Decorative only: `aria-hidden`, no pointer events.
 */

/** The animated constellation — client-only, never SSR'd. */
const DevOpsBackground = lazy(() =>
    import("@features/background/components/DevOpsBackground").then((m) => ({
        default: m.DevOpsBackground,
    })),
);

export interface PageBackgroundProps {
    /** CMS-controlled particle visibility for the global background. */
    particlesEnabled?: boolean;
}

export function PageBackground({
    particlesEnabled = true,
}: PageBackgroundProps) {
    // The constellation is lazy + ClientOnly (see above), so it never blocks
    // first paint / LCP — its JS is fetched async on the client. We mount it
    // immediately (no rAF gate) so the background appears as soon as the
    // chunk loads, rather than waiting an extra frame to even start.
    return (
        <ClientOnly>
            <Suspense fallback={null}>
                <DevOpsBackground fixed particlesEnabled={particlesEnabled} />
            </Suspense>
        </ClientOnly>
    );
}

PageBackground.displayName = "PageBackground";
