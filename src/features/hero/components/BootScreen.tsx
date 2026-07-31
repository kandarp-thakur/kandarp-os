"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { SITE } from "@utils/constants";

/** Total duration of the modern boot sequence, in ms. */
const BOOT_DURATION = 2000;
/** Hard safety timeout — the overlay is ALWAYS removed after this. */
const MAX_LIFETIME = 3500;
/** Pause after the sequence completes before fading the screen out. */
const FADE_DELAY = 200;

/** Short, modern boot stages — cycled beneath the progress bar. */
const STAGES = [
    "Initializing kernel",
    "Mounting volumes",
    "Starting services",
    "Establishing network",
    "Loading interface",
    "Ready",
] as const;

interface BootScreenProps {
    /** Called once the boot sequence completes and the screen fades out. */
    onComplete?: () => void;
}

/**
 * BootScreen — a modern OS-style boot experience.
 *
 * A clean, contemporary loader inspired by modern operating systems (macOS
 * Sonoma, Windows 11, ChromeOS): a centered monogram logo inside a glowing
 * rotating accent ring, a sleek progress bar, and a cycling status line.
 *
 * **Guaranteed to reveal the site.**
 *   - The overlay is mounted ONLY on the client after hydration (never in
 *     SSR HTML), so the server always streams real content.
 *   - A `requestAnimationFrame` loop drives the progress to 100%.
 *   - A hard safety timeout (`MAX_LIFETIME`) removes the overlay no matter
 *     what — the real page can never be trapped behind it.
 *
 * Skipped entirely when the user prefers reduced motion or has already
 * booted this tab session (sessionStorage guard).
 *
 * This is a Client Component — it depends on timers, the DOM, and
 * `prefers-reduced-motion`.
 */
export function BootScreen({ onComplete }: BootScreenProps) {
    const reduced = useReducedMotion() === true;
    // `mounted` gates client-only rendering — SSR sends nothing, so the real
    // page content is always in the document and never blocked by a black box.
    const [mounted, setMounted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stageIndex, setStageIndex] = useState(0);
    const [fading, setFading] = useState(false);
    const [done, setDone] = useState(false);

    // Keep the latest `onComplete` in a ref so the lifecycle effect below can
    // depend on a stable `[]` (set up once) without capturing a stale callback.
    // This prevents the effect from tearing down + re-arming its timers when a
    // parent passes a new `onComplete` identity each render — which previously
    // could cancel the in-flight `finish`/`done` timers mid-transition and
    // leave the overlay stuck open.
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    // Skip if reduced motion or already booted this session.
    const skip =
        reduced ||
        (typeof sessionStorage !== "undefined" &&
            sessionStorage.getItem("kandarp-os-booted") === "1");

    // Single lifecycle effect. Owns the ENTIRE boot timeline from mount →
    // fade → done in one place, so there is no inter-effect state handshake
    // that can stall. Three independent guarantees all converge on `setDone`:
    //   1. The RAF loop reaches 100% → schedules `finish` after FADE_DELAY.
    //   2. A hard deadline (MAX_LIFETIME) calls `finish` no matter what.
    //   3. `finish` flips `fading`; a final timer then flips `done` + fires
    //      onComplete. `finish`/`complete` are idempotent (ref-guarded).
    useEffect(() => {
        if (skip) {
            try {
                sessionStorage.setItem("kandarp-os-booted", "1");
            } catch {
                /* non-fatal */
            }
            onCompleteRef.current?.();
            return;
        }

        setMounted(true);

        const start = performance.now();
        let raf = 0;
        let finishTimer = 0;
        let doneTimer = 0;
        let finished = false;
        let completed = false;

        const markBooted = () => {
            try {
                sessionStorage.setItem("kandarp-os-booted", "1");
            } catch {
                /* non-fatal */
            }
        };

        // Final step: hide the overlay + notify the parent. Idempotent.
        const complete = () => {
            if (completed) return;
            completed = true;
            setDone(true);
            onCompleteRef.current?.();
        };

        // Begin the fade-out, then unmount after the fade duration. Idempotent.
        const finish = () => {
            if (finished) return;
            finished = true;
            markBooted();
            setProgress(100);
            setStageIndex(STAGES.length - 1);
            setFading(true);
            doneTimer = window.setTimeout(complete, 500);
        };

        let lastProgress = -1;
        let lastStageIndex = -1;

        const tick = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / BOOT_DURATION, 1);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
            const nextProgress = Math.round(eased * 100);
            const nextStageIndex = Math.min(
                Math.floor(eased * STAGES.length),
                STAGES.length - 1,
            );

            // The visual only exposes integer progress and a finite stage index.
            // Avoid scheduling redundant React updates on every animation frame.
            if (nextProgress !== lastProgress) {
                lastProgress = nextProgress;
                setProgress(nextProgress);
            }
            if (nextStageIndex !== lastStageIndex) {
                lastStageIndex = nextStageIndex;
                setStageIndex(nextStageIndex);
            }

            if (t < 1) {
                raf = requestAnimationFrame(tick);
            } else {
                finishTimer = window.setTimeout(finish, FADE_DELAY);
            }
        };

        raf = requestAnimationFrame(tick);

        // HARD SAFETY: no matter what (RAF throttled, tab backgrounded, etc.),
        // the overlay begins its fade after MAX_LIFETIME.
        const guard = window.setTimeout(finish, MAX_LIFETIME);

        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(finishTimer);
            window.clearTimeout(guard);
            window.clearTimeout(doneTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Render nothing on the server, before mount, when skipping, or when done.
    if (!mounted || done) return null;

    return (
        <AnimatePresence>
            <motion.div
                aria-hidden="true"
                role="status"
                aria-live="polite"
                initial={{ opacity: 1 }}
                animate={{ opacity: fading ? 0 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-10 bg-canvas-base px-6 sm:gap-12"
            >
                {/* Ambient glow — a soft radial wash behind the logo. */}
                <div
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(36,150,237,0.22) 0%, rgba(56,189,248,0.10) 45%, transparent 70%)",
                    }}
                />

                {/* Logo monogram inside a breathing accent ring. */}
                <motion.div
                    className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: [0.96, 1, 0.96] }}
                    transition={{
                        opacity: { duration: 0.5, ease: "easeOut" },
                        scale: {
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        },
                    }}
                >
                    {/* Rotating accent ring. */}
                    <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{
                            background:
                                "conic-gradient(from 0deg, transparent 0%, var(--docker-blue) 25%, var(--cloud-cyan) 50%, transparent 75%)",
                            maskImage:
                                "radial-gradient(transparent 58%, black 60%)",
                            WebkitMaskImage:
                                "radial-gradient(transparent 58%, black 60%)",
                        }}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                    {/* Inner glass disc + monogram. */}
                    <div className="relative flex h-[78%] w-[78%] items-center justify-center rounded-full border border-white/10 bg-glass-bg-strong backdrop-blur-glass-strong">
                        <span className="bg-accent-gradient bg-clip-text font-sans text-3xl font-bold text-transparent sm:text-4xl">
                            K
                        </span>
                    </div>
                </motion.div>

                {/* Wordmark. */}
                <motion.div
                    className="relative flex flex-col items-center gap-1 text-center"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                >
                    <p className="font-sans text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
                        {SITE.name}
                    </p>
                    <p className="font-mono text-2xs text-text-quaternary">
                        {SITE.userAtHost}
                    </p>
                </motion.div>

                {/* Progress bar. */}
                <motion.div
                    className="relative h-1 w-56 overflow-hidden rounded-full bg-white/10 sm:w-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                >
                    <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                            width: `${progress}%`,
                            background: "var(--accent-gradient)",
                            boxShadow:
                                "0 0 12px rgba(36,150,237,0.6), 0 0 4px rgba(56,189,248,0.8)",
                        }}
                    />
                </motion.div>

                {/* Status line. */}
                <motion.p
                    key={stageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="relative font-mono text-2xs text-text-tertiary"
                >
                    {STAGES[stageIndex]}
                    <span className="ml-1 inline-block h-[1em] w-[0.5ch] translate-y-[0.15em] bg-accent-solid animate-cursor-blink" />
                </motion.p>
            </motion.div>
        </AnimatePresence>
    );
}

BootScreen.displayName = "BootScreen";
