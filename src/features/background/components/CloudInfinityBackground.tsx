"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";

import { ClientOnly } from "@features/shared/components/ClientOnly";
import { cn } from "@utils/cn";

/**
 * The R3F canvas host + in-canvas scene — client-only, never SSR'd.
 *
 * These pull in `@react-three/fiber` + `three`, which are client-only APIs
 * (`Canvas`, `useFrame`, `useThree`). Statically importing them into a
 * component rendered by the server `layout.tsx` pulls the R3F module graph
 * into the server bundle, where webpack's lazy factory is not initialized —
 * producing `Cannot read properties of undefined (reading 'call')` at
 * `options.factory` during `resolveLazy`.
 *
 * Loading strategy: `React.lazy` (NOT `next/dynamic({ ssr: false })`). In the
 * App Router, a `next/dynamic({ ssr: false })` component mounted by a Server
 * Component (the root layout) makes Next.js error during SSR and bail the
 * ENTIRE layout segment to client-side rendering
 * (`BAILOUT_TO_CLIENT_SIDE_RENDERING`), orphaning the server-rendered section
 * HTML. `React.lazy` keeps the 3D subtree out of the server bundle (it is
 * only evaluated on the client after hydration) WITHOUT the route-segment
 * bailout. The canvas is mounted inside `ClientOnly` so the server and first
 * client render both produce `null` (matching → no hydration mismatch).
 */
const Canvas3D = lazy(() =>
    import("@3d/Canvas3D").then((m) => ({ default: m.Canvas3D })),
);

const CloudInfinityScene = lazy(() =>
    import("@3d/cloudInfinity/CloudInfinityScene").then((m) => ({
        default: m.CloudInfinityScene,
    })),
);

/**
 * CloudInfinityBackground — the signature 3D object mounted behind the hero.
 *
 * This is the host that mounts the R3F canvas containing the
 * [`CloudInfinity`](../../3d/cloudInfinity/CloudInfinity.tsx) object. It owns:
 *
 *  - **Lazy loading.** The canvas is `React.lazy` + `ClientOnly` so the
 *    LCP is never blocked (task §Performance: "Lazy loaded"; mirrors
 *    hero-design §11.2). It mounts immediately on hydration (no rAF gate) so
 *    the 3D layer appears as early as possible.
 *  - **Scroll progress.** A single passive scroll listener writes the hero
 *    scroll progress (0 → 1) into a ref, which the object reads each frame to
 *    scale slightly + fade into the background of later sections (task
 *    §Placement). No React re-renders per scroll tick.
 *  - **Visibility-based rendering pause** (task §Performance: "render only
 *    what's visible"). The R3F `frameloop` is toggled between `"always"` (when
 *    the hero is on-screen and the tab is active) and `"never"` (when the hero
 *    scrolls out of view OR the tab is backgrounded / window blurred). This
 *    stops the WebGL render loop entirely — zero GPU/CPU cost when the 3D
 *    object can't be seen. An `IntersectionObserver` watches the hero section;
 *    `visibilitychange` + `blur` listeners watch the tab/window.
 *  - **Passive camera.** The CloudInfinity scene drives the camera itself
 *    (parallax), so the generic CameraRig frame loop is skipped via
 *    `passiveCamera` — eliminating a duplicate per-frame camera write.
 *  - **Stacking.** Fixed, full-viewport, `z-index: -1`, `pointer-events: none`
 *    — sits behind all content, never intercepts input (mirrors the existing
 *    [`PageBackground`](../background/PageBackground.tsx) contract).
 *  - **Fallback.** While the canvas is deferred (or on no-WebGL devices, where
 *    [`Canvas3D`](../../3d/Canvas3D.tsx) renders [`SceneFallback`](../../3d/scenes/SceneFallback.tsx)),
 *    a cheap CSS glow + dot-grid is shown so the hero never looks empty.
 *
 * The object is positioned to live **behind the hero content** and remains
 * partially visible while scrolling (the opacity fade handles the recession).
 *
 * @example
 * ```tsx
 * // In layout.tsx, alongside <PageBackground />:
 * <CloudInfinityBackground />
 * ```
 */
export interface CloudInfinityBackgroundProps {
    /** Extra classes on the host wrapper. */
    className?: string;
    /** Disable WebGL while retaining the lightweight CSS fallback. */
    threeEnabled?: boolean;
    /** Disable the entire infinity-loop visual, including its fallback. */
    infinityLoopEnabled?: boolean;
    /** Disable the scroll-progress tracking (e.g. for a preview route). */
    disableScroll?: boolean;
}

export function CloudInfinityBackground({
    className,
    threeEnabled = true,
    infinityLoopEnabled = true,
    disableScroll = false,
}: CloudInfinityBackgroundProps) {
    // Scroll progress (0 at hero top → 1 as the hero scrolls out of view).
    // Held in a ref so the frame loop reads it without React re-renders.
    const scrollProgressRef = useRef(0);

    // Start immediately so the hero background paints on first hydration. The
    // visibility effect below still pauses it when the hero/tab is hidden.
    const [frameloop, setFrameloop] = useState<"always" | "never">("always");

    // Coalesce bursty scroll events into one geometry read per animation frame.
    // Progress stays in a ref so this path never causes React re-renders.
    useEffect(() => {
        if (disableScroll) return;

        let pendingFrame: number | null = null;

        const update = () => {
            pendingFrame = null;
            const hero = document.getElementById("hero");
            if (!hero) {
                scrollProgressRef.current = 0;
                return;
            }
            const rect = hero.getBoundingClientRect();
            const vh = window.innerHeight || 1;
            // 0 when hero fills the viewport; 1 once it has fully scrolled past.
            scrollProgressRef.current = Math.max(
                0,
                Math.min(1, -rect.top / vh),
            );
        };

        const scheduleUpdate = () => {
            if (pendingFrame !== null) return;
            pendingFrame = window.requestAnimationFrame(update);
        };

        update();
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate);
        return () => {
            window.removeEventListener("scroll", scheduleUpdate);
            window.removeEventListener("resize", scheduleUpdate);
            if (pendingFrame !== null) {
                window.cancelAnimationFrame(pendingFrame);
            }
        };
    }, [disableScroll]);

    // Visibility-based rendering pause (task §Performance: "render only what's
    // visible"). Three signals gate the render loop:
    //   1. IntersectionObserver on the hero section — pauses when it scrolls
    //      out of view (the object is behind the hero; once the hero is gone
    //      the 3D canvas is invisible).
    //   2. `visibilitychange` — pauses when the tab is backgrounded.
    //   3. window `blur` — pauses when the window loses focus (covers alt-tab
    //      and multi-monitor scenarios the tab API misses).
    // All three write to the same `visibleRef`; a single `setFrameloop` call
    // translates the ref into React state so R3F's `frameloop` prop updates.
    useEffect(() => {
        const hero = document.getElementById("hero");
        if (!hero) {
            // No hero section (e.g. a route without one) — render normally.
            setFrameloop("always");
            return;
        }

        let heroVisible = false;
        let tabVisible = !document.hidden;
        let winFocused = document.hasFocus();

        let lastShouldRender: boolean | null = null;
        const sync = () => {
            const shouldRender = heroVisible && tabVisible && winFocused;
            if (shouldRender === lastShouldRender) return;
            lastShouldRender = shouldRender;
            setFrameloop(shouldRender ? "always" : "never");
        };

        // 1. IntersectionObserver — hero enters/leaves the viewport.
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    heroVisible = entry.isIntersecting;
                }
                sync();
            },
            // Start rendering slightly before the hero is fully visible and
            // keep rendering slightly after it leaves — avoids a hard pop.
            { rootMargin: "100px" },
        );
        io.observe(hero);

        // 2. Tab visibility — backgrounded tabs pause entirely.
        const onVisibility = () => {
            tabVisible = !document.hidden;
            sync();
        };
        document.addEventListener("visibilitychange", onVisibility);

        // 3. Window focus — covers alt-tab / multi-monitor.
        const onFocus = () => {
            winFocused = true;
            sync();
        };
        const onBlur = () => {
            winFocused = false;
            sync();
        };
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);

        // Initial sync in case the hero is already in view on mount.
        heroVisible = hero.getBoundingClientRect().bottom > 0;
        sync();

        return () => {
            io.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
        };
    }, []);

    if (!infinityLoopEnabled) return null;

    return (
        <div
            aria-hidden="true"
            className={cn(
                "cloud-infinity-bg pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-95",
                className,
            )}
        >
            {/* Immediate CSS fallback — visible until the canvas mounts and
                remains as the no-WebGL fallback layer behind the canvas. */}
            <CloudInfinityFallback />

            {/* The 3D canvas — lazy, client-only. Transparent so the page
                canvas color shows through (arch §3.5). The render loop is
                paused (`frameloop="never"`) when the hero is off-screen or the
                tab is backgrounded — zero GPU/CPU cost when invisible. The
                scene drives the camera itself (parallax), so the generic
                CameraRig loop is skipped via `passiveCamera`. */}
            {threeEnabled ? (
                <ClientOnly>
                    <Suspense fallback={null}>
                        <Canvas3D
                            lightingPreset="soft"
                            environmentPreset="studio"
                            effectPreset="off"
                            enableControls={false}
                            frameloop={frameloop}
                            passiveCamera
                            // The CloudInfinity scene brings its own bespoke
                            // EnvironmentLights (ambient + directional + rim +
                            // HDR + contact shadows + fog). Disable the generic
                            // rig so the glass isn't double-lit and there's no
                            // second fog pass.
                            disableLighting
                            disableEnvironment
                            className="absolute inset-0"
                        >
                            <CloudInfinityScene
                                tier="medium"
                                scrollProgressRef={scrollProgressRef}
                            />
                        </Canvas3D>
                    </Suspense>
                </ClientOnly>
            ) : null}
        </div>
    );
}

/**
 * The immediate CSS backdrop shown before the canvas mounts (and as
 * the no-WebGL fallback). Two soft, translucent ambient glows only — no opaque
 * base gradient. The body already carries `bg-canvas-base` (#050816), and this
 * layer sits directly above the animated DevOps constellation
 * ([`PageBackground`](./PageBackground.tsx)); an opaque sheet here would
 * occlude that constellation and hide the background loop. Keeping it
 * translucent lets the constellation show through both this fallback and the
 * transparent (`alpha: true`) 3D canvas. No glow blobs, no dot-grid (those
 * were the sources of the "blurry / low quality" read).
 */
function CloudInfinityFallback() {
    return (
        <div className="absolute inset-0">
            {/* No opaque base gradient here. The body already carries
                `bg-canvas-base` (#050816), and this layer sits directly above
                the animated DevOps constellation ([`PageBackground`](./PageBackground.tsx)).
                An opaque full-viewport gradient would paint over that
                constellation and hide the background loop entirely. We keep
                only translucent ambient glows so the constellation stays
                visible through the transparent 3D canvas + this fallback. */}

            {/* Ambient lighting — soft blue glow (upper-left). Diffuse light,
                not a floating blob. */}
            <div
                className="absolute -left-[18%] -top-[22%] h-[64vh] w-[64vh] rounded-full blur-[72px]"
                style={{
                    background:
                        "radial-gradient(circle at center, var(--hero-ambient-blue), transparent 70%)",
                }}
            />

            {/* Ambient lighting — AWS Orange plus Cloud Cyan reflection. */}
            <div
                className="absolute -right-[18%] -bottom-[22%] h-[64vh] w-[64vh] rounded-full blur-[72px]"
                style={{
                    background:
                        "radial-gradient(circle at 35% 35%, var(--hero-ambient-orange), transparent 62%), radial-gradient(circle at 65% 65%, var(--hero-ambient-cyan), transparent 70%)",
                }}
            />
        </div>
    );
}

CloudInfinityBackground.displayName = "CloudInfinityBackground";
