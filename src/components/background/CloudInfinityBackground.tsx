"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";

/**
 * CloudInfinityBackground — the signature 3D object mounted behind the hero.
 *
 * This is the host that mounts the R3F canvas containing the
 * [`CloudInfinity`](../../3d/cloudInfinity/CloudInfinity.tsx) object. It owns:
 *
 *  - **Lazy loading.** The canvas is `next/dynamic` with `ssr: false` so the
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
    /** Disable the scroll-progress tracking (e.g. for a preview route). */
    disableScroll?: boolean;
}

/** The R3F canvas host — client-only, never SSR'd. */
const Canvas3D = dynamic(() => import("@3d/Canvas3D").then((m) => m.Canvas3D), {
    ssr: false,
});

/** The in-canvas scene — client-only (depends on R3F context). */
const CloudInfinityScene = dynamic(
    () =>
        import("@3d/cloudInfinity/CloudInfinityScene").then(
            (m) => m.CloudInfinityScene,
        ),
    { ssr: false },
);

export function CloudInfinityBackground({
    className,
    disableScroll = false,
}: CloudInfinityBackgroundProps) {
    // Scroll progress (0 at hero top → 1 as the hero scrolls out of view).
    // Held in a ref so the frame loop reads it without React re-renders.
    const scrollProgressRef = useRef(0);

    // Whether the 3D render loop should be running. Starts `false` — the
    // IntersectionObserver will flip it to `true` once the hero is on-screen.
    // Toggled to `false` when the hero leaves the viewport OR the tab is
    // backgrounded / window loses focus (task §Performance: "render only
    // what's visible"). This drives the R3F `frameloop` prop.
    const [frameloop, setFrameloop] = useState<"always" | "never">("never");

    // Single passive scroll listener → write progress into the ref. The hero
    // is the first section; progress maps the hero's viewport exit to 0→1.
    useEffect(() => {
        if (disableScroll) return;

        const update = () => {
            const hero = document.getElementById("hero");
            if (!hero) {
                scrollProgressRef.current = 0;
                return;
            }
            const rect = hero.getBoundingClientRect();
            const vh = window.innerHeight || 1;
            // 0 when hero fills the viewport; 1 once it has fully scrolled past.
            const progress = Math.max(0, Math.min(1, -rect.top / vh));
            scrollProgressRef.current = progress;
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
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

        const sync = () => {
            const shouldRender = heroVisible && tabVisible && winFocused;
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

    return (
        <div
            aria-hidden="true"
            className={cn(
                "cloud-infinity-bg pointer-events-none fixed inset-0 -z-[1] overflow-hidden",
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
            <Canvas3D
                lightingPreset="soft"
                environmentPreset="studio"
                enableControls={false}
                frameloop={frameloop}
                passiveCamera
                // The CloudInfinity scene brings its own bespoke
                // EnvironmentLights (ambient + directional + rim + HDR +
                // contact shadows + fog). Disable the generic rig so the
                // glass isn't double-lit and there's no second fog pass.
                disableLighting
                disableEnvironment
                className="absolute inset-0"
            >
                <CloudInfinityScene scrollProgressRef={scrollProgressRef} />
            </Canvas3D>
        </div>
    );
}

/**
 * The immediate, non-animated backdrop shown before the canvas mounts (and as
 * the no-WebGL fallback). A clean gradient + two soft ambient glows — the same
 * treatment as [`HeroBackground`](../sections/HeroBackground.tsx) so the
 * transition into 3D is seamless. No glow blobs, no dot-grid (those were the
 * sources of the "blurry / low quality" read).
 */
function CloudInfinityFallback() {
    return (
        <div className="absolute inset-0">
            {/* Clean gradient — the calm base. */}
            <div
                className="absolute inset-0"
                style={{ backgroundImage: "var(--hero-bg-gradient)" }}
            />

            {/* Ambient lighting — soft blue glow (upper-left). Diffuse light,
                not a floating blob. */}
            <div
                className="absolute -left-[20%] -top-[25%] h-[80vh] w-[80vh] rounded-full blur-[120px]"
                style={{
                    background:
                        "radial-gradient(circle at center, var(--hero-ambient-blue), transparent 70%)",
                }}
            />

            {/* Ambient lighting — soft violet glow (lower-right). */}
            <div
                className="absolute -right-[20%] -bottom-[25%] h-[80vh] w-[80vh] rounded-full blur-[120px]"
                style={{
                    background:
                        "radial-gradient(circle at center, var(--hero-ambient-violet), transparent 70%)",
                }}
            />
        </div>
    );
}

CloudInfinityBackground.displayName = "CloudInfinityBackground";
