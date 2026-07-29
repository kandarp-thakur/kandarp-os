"use client";

/**
 * BackgroundTierHud — a minimal performance-review overlay.
 *
 * Not page content. A tiny, fixed, non-interactive readout in the corner that
 * surfaces the resolved performance tier and live medallion count so the
 * animated background can be reviewed against the frame budget
 * (docs/devops-background.md §7.3). It also reports a live FPS sample to make
 * the "Review performance" step concrete.
 *
 * Kept deliberately small and self-contained so it adds negligible weight to
 * the preview route and nothing to the real background.
 */

import { useEffect, useRef, useState } from "react";

import { useBackgroundTier } from "./useBackgroundTier";
import { TOTAL_MEDALLIONS } from "./constellation";

export function BackgroundTierHud() {
    const tier = useBackgroundTier();
    const fps = useFps();
    const count = Math.round(TOTAL_MEDALLIONS * tier.density);

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed left-4 top-4 z-50 select-none font-mono text-2xs uppercase tracking-[0.12em] text-text-quaternary/80"
        >
            <div className="rounded-md border border-border-subtle bg-glass-bg-strong/70 px-2.5 py-2 backdrop-blur-glass-subtle">
                <div>
                    tier ·{" "}
                    <span className="text-text-secondary">{tier.tier}</span>
                </div>
                <div>
                    icons · <span className="text-text-secondary">{count}</span>{" "}
                    / {TOTAL_MEDALLIONS}
                </div>
                <div>
                    dof ·{" "}
                    <span className="text-text-secondary">
                        {tier.dof ? "on" : "off"}
                    </span>
                </div>
                <div>
                    parallax ·{" "}
                    <span className="text-text-secondary">
                        {tier.parallax ? "on" : "off"}
                    </span>
                </div>
                <div>
                    motion ·{" "}
                    <span className="text-text-secondary">
                        {tier.motion ? "on" : "off"}
                    </span>
                </div>
                <div>
                    fps ·{" "}
                    <span
                        className={
                            fps >= 50
                                ? "text-success"
                                : fps >= 30
                                  ? "text-warning"
                                  : "text-error"
                        }
                    >
                        {fps}
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * Sample frames-per-second with a 500ms rolling window. Cheap: one rAF, a
 * counter, and a timestamp compare. Returns 0 until the first window elapses.
 */
function useFps(): number {
    const [fps, setFps] = useState(0);
    const frames = useRef(0);
    const last = useRef(0);

    useEffect(() => {
        let raf = 0;
        const loop = (t: number) => {
            frames.current++;
            if (t - last.current >= 500) {
                setFps(
                    Math.round((frames.current * 1000) / (t - last.current)),
                );
                frames.current = 0;
                last.current = t;
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, []);

    return fps;
}

BackgroundTierHud.displayName = "BackgroundTierHud";
