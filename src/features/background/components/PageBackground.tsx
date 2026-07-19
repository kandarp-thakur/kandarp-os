"use client";

import dynamic from "next/dynamic";

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
 * NOT block first paint. We therefore defer it to the client via
 * `next/dynamic` with `ssr: false` — its JS is fetched async and never sits on
 * the critical render path. It mounts immediately on hydration (no extra rAF
 * gate) so the constellation appears as early as possible.
 *
 * Decorative only: `aria-hidden`, no pointer events.
 */

/** The animated constellation — client-only, never SSR'd. */
const DevOpsBackground = dynamic(
    () =>
        import("@features/background/components/DevOpsBackground").then(
            (m) => m.DevOpsBackground,
        ),
    { ssr: false },
);

export function PageBackground() {
    // The constellation is `ssr: false` (see the dynamic import above), so it
    // never blocks first paint / LCP — its JS is fetched async on the client.
    // We mount it immediately (no rAF gate) so the background appears as soon
    // as the chunk loads, rather than waiting an extra frame to even start.
    return <DevOpsBackground fixed />;
}

PageBackground.displayName = "PageBackground";
