"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { cn } from "@utils/cn";
import type { PublicSiteIdentity } from "@backend/services/public-data";

/**
 * HeroPortrait3D — the 3D coder figure mounted inside the hero portrait frame.
 *
 * This is the host that mounts the R3F canvas containing the
 * [`CoderScene`](../../3d/coderModel/CoderScene.tsx) figure. It owns:
 *
 *  - **Lazy loading.** The canvas is `next/dynamic` with `ssr: false` so the
 *    LCP is never blocked (mirrors hero-design §11.2). It mounts immediately on
 *    hydration (no rAF gate) so the 3D figure appears as early as possible.
 *  - **Visibility-based rendering pause** (task §Performance: "render only
 *    what's visible"). The R3F `frameloop` is toggled between `"always"` (when
 *    the portrait is on-screen and the tab is active) and `"never"` (when it
 *    scrolls out of view OR the tab is backgrounded / window blurred). This
 *    stops the WebGL render loop entirely — zero GPU/CPU cost when the figure
 *    can't be seen. An `IntersectionObserver` watches the portrait wrapper;
 *    `visibilitychange` + `blur` listeners watch the tab/window.
 *  - **Passive camera.** The CoderScene drives the camera itself (parallax),
 *    so the generic CameraRig frame loop is skipped via `passiveCamera` —
 *    eliminating a duplicate per-frame camera write.
 *  - **Fallback.** While the canvas is deferred (or on no-WebGL devices, where
 *    [`Canvas3D`](../../3d/Canvas3D.tsx) renders
 *    [`SceneFallback`](../../3d/scenes/SceneFallback.tsx)), a cheap CSS
 *    silhouette + glow is shown so the frame never looks empty.
 *
 * The figure is sized to fill the portrait frame (the same dimensions as the
 * old monogram placeholder) so the hero layout is unchanged.
 *
 * @example
 * ```tsx
 * <HeroPortrait3D />
 * ```
 */
export interface HeroPortrait3DProps {
    /** Extra classes on the host wrapper. */
    className?: string;
    /** CMS-controlled Ready Player Me avatar settings. */
    avatar?: PublicSiteIdentity["heroAvatar"];
}

/** The R3F canvas host — client-only, never SSR'd. */
const Canvas3D = dynamic(() => import("@3d/Canvas3D").then((m) => m.Canvas3D), {
    ssr: false,
});

/** The in-canvas scene — client-only (depends on R3F context). */
const AvatarScene = dynamic(
    () => import("@3d/Avatar/AvatarScene").then((m) => m.AvatarScene),
    { ssr: false },
);

const CoderScene = dynamic(
    () => import("@3d/coderModel/CoderScene").then((m) => m.CoderScene),
    { ssr: false },
);

export function HeroPortrait3D({ className, avatar }: HeroPortrait3DProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Whether the 3D render loop should be running. Starts `false` — the
    // IntersectionObserver will flip it to `true` once the portrait is
    // on-screen. Toggled to `false` when it leaves the viewport OR the tab is
    // backgrounded / window loses focus. This drives the R3F `frameloop` prop.
    const [frameloop, setFrameloop] = useState<"always" | "never">("never");

    // Visibility-based rendering pause. Three signals gate the render loop:
    //   1. IntersectionObserver on the portrait wrapper — pauses when it
    //      scrolls out of view.
    //   2. `visibilitychange` — pauses when the tab is backgrounded.
    //   3. window `blur` — pauses when the window loses focus.
    // All three write to local flags; a single `setFrameloop` call translates
    // them into React state so R3F's `frameloop` prop updates.
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) {
            // No wrapper (shouldn't happen) — render normally.
            setFrameloop("always");
            return;
        }

        let visible = false;
        let tabVisible = !document.hidden;
        let winFocused = document.hasFocus();

        const sync = () => {
            const shouldRender = visible && tabVisible && winFocused;
            setFrameloop(shouldRender ? "always" : "never");
        };

        // 1. IntersectionObserver — portrait enters/leaves the viewport.
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    visible = entry.isIntersecting;
                }
                sync();
            },
            // Start rendering slightly before fully visible and keep rendering
            // slightly after it leaves — avoids a hard pop.
            { rootMargin: "100px" },
        );
        io.observe(el);

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

        // Initial sync in case the portrait is already in view on mount.
        visible = el.getBoundingClientRect().bottom > 0;
        sync();

        return () => {
            io.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
        };
    }, []);

    const hasReadyPlayerMeAvatar = Boolean(avatar?.avatarUrl?.trim());

    return (
        <div
            ref={wrapperRef}
            className={cn("relative h-full w-full", className)}
            aria-hidden="true"
        >
            {/* Immediate CSS fallback — visible until the canvas mounts and
                remains as the no-WebGL fallback layer behind the canvas. A
                calm silhouette + accent glow so the frame never looks empty. */}
            <CoderFallback />

            {/* The 3D canvas — lazy, client-only. Transparent so the page
                canvas color shows through (arch §3.5). The render loop is
                paused (`frameloop="never"`) when the portrait is off-screen or
                the tab is backgrounded — zero GPU/CPU cost when invisible.
                The scene drives the camera itself (parallax), so the generic
                CameraRig loop is skipped via `passiveCamera`. The CoderScene
                brings its own bespoke lighting + environment, so the generic
                rig is disabled to avoid double-lighting / double-fog. */}
            <Canvas3D
                lightingPreset="soft"
                environmentPreset="studio"
                enableControls={false}
                frameloop={frameloop}
                passiveCamera
                disableLighting
                disableEnvironment
                className="absolute inset-0"
            >
                {hasReadyPlayerMeAvatar ? (
                    <AvatarScene settings={avatar} />
                ) : (
                    <CoderScene />
                )}
            </Canvas3D>
        </div>
    );
}

/**
 * The immediate, non-animated fallback shown before the canvas mounts (and as
 * the no-WebGL fallback). A calm silhouette + soft ambient glow — frameless,
 * matching the redesigned mascot's integrated environment so the transition
 * into 3D is seamless. No card, no box, no rectangular frame.
 *
 * The silhouette mirrors the new mascot: a mature stylized engineer in a
 * turtleneck + bomber jacket, one hand in the jacket pocket, the other raised
 * to interact with holographic interfaces, the DevOps Infinity logo behind
 * it. Round glasses + a short beard hint at the editorial character. No
 * laptop — the character controls holograms.
 */
function CoderFallback() {
    return (
        <div className="absolute inset-0">
            {/* Soft ambient glow behind the figure — a large radial gradient
                (Docker Blue + AWS Orange) so the silhouette reads as "floating in light",
                not "floating in a box". Mirrors the PortraitFrame glow. */}
            <div
                className="absolute inset-0 blur-2xl"
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 45%, var(--hero-ambient-orange, rgba(255,153,0,0.10)) 0%, var(--hero-ambient-blue, rgba(59,130,246,0.14)) 45%, transparent 75%)",
                }}
            />

            {/* The DevOps Infinity logo — a faint CSS lemniscate behind the
                figure so the silhouette reads as "the character controls the
                loop" before the 3D lands. */}
            <div
                className="absolute left-1/2 top-[34%] -translate-x-1/2 opacity-30"
                aria-hidden="true"
                style={{
                    width: "120px",
                    height: "60px",
                    borderRadius: "9999px",
                    border: "2px solid var(--text-tertiary, currentColor)",
                    borderColor:
                        "transparent var(--text-tertiary, currentColor)",
                }}
            />
            <div
                className="absolute left-1/2 top-[34%] -translate-x-1/2 opacity-30"
                aria-hidden="true"
                style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "9999px",
                    border: "2px solid var(--text-tertiary, currentColor)",
                    borderColor:
                        "var(--text-tertiary, currentColor) transparent",
                }}
            />

            {/* Stylized mascot silhouette — a simple CSS figure so the frame
                reads as "a mature engineer controlling holograms" before the 3D
                lands. Natural proportions, one hand in pocket, one hand raised,
                round glasses + short beard hints. */}
            <div className="absolute inset-0 flex items-end justify-center pb-[14%]">
                <div className="relative flex flex-col items-center gap-1 opacity-50">
                    {/* Hair — modern textured top */}
                    <div className="h-3 w-7 rounded-t-full bg-text-tertiary" />
                    {/* Head */}
                    <div className="relative h-6 w-6 rounded-full bg-text-tertiary">
                        {/* Round glasses — two small rings on the face. */}
                        <div
                            className="absolute left-0.5 top-2.5 h-1.5 w-1.5 rounded-full border border-accent-solid"
                            aria-hidden="true"
                        />
                        <div
                            className="absolute right-0.5 top-2.5 h-1.5 w-1.5 rounded-full border border-accent-solid"
                            aria-hidden="true"
                        />
                        {/* Short beard — a thin band along the jaw. */}
                        <div
                            className="absolute -bottom-0.5 left-1/2 h-2 w-5 -translate-x-1/2 rounded-b-full bg-text-tertiary/80"
                            aria-hidden="true"
                        />
                    </div>
                    {/* Bomber jacket shoulders — slightly wider than the torso */}
                    <div className="-mt-1 h-4 w-12 rounded-t-2xl bg-text-tertiary" />
                    {/* Torso */}
                    <div className="h-10 w-10 rounded-t-xl bg-text-tertiary" />
                    {/* Legs */}
                    <div className="mt-1 flex gap-1">
                        <div className="h-8 w-3 rounded-b-sm bg-text-tertiary" />
                        <div className="h-8 w-3 rounded-b-sm bg-text-tertiary" />
                    </div>
                    {/* Left arm — relaxed, hand in the jacket pocket. A short
                        angled bar resting at the side. */}
                    <div
                        className="absolute -left-3 top-8 h-1.5 w-5 rotate-[12deg] rounded-full bg-text-tertiary"
                        aria-hidden="true"
                    />
                    {/* Right arm — raised forward + out, reaching a hologram.
                        An angled bar up toward the upper-right. */}
                    <div
                        className="absolute -right-3 top-6 h-1.5 w-8 rotate-[-40deg] rounded-full bg-text-tertiary"
                        aria-hidden="true"
                    />
                    {/* Hologram hint — a small accent dot near the raised
                        (right) hand only. */}
                    <div
                        className="absolute -right-5 top-3 h-1.5 w-1.5 rounded-full bg-accent-solid"
                        aria-hidden="true"
                    />
                </div>
            </div>
        </div>
    );
}

HeroPortrait3D.displayName = "HeroPortrait3D";
