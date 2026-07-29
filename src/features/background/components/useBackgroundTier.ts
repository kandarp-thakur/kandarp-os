"use client";

/**
 * Performance tier detection for the DevOps background.
 *
 * Implements docs/devops-background.md §7.1 (Tier Scaling) and the reduced-motion
 * contract from docs/animation-design.md §5. The hook is intentionally cheap:
 * it reads a few capability signals once on mount (no continuous polling) and
 * resolves to one of four tiers. The constellation then scales its medallion
 * count and effects accordingly.
 *
 * Detection is heuristic and conservative — when in doubt, we downgrade so the
 * background never harms the foreground experience.
 */

import { useEffect, useState } from "react";

export type BackgroundTier = "high" | "medium" | "low" | "off";

export interface TierProfile {
    tier: BackgroundTier;
    /** Fraction of medallions to render (0–1). */
    density: number;
    /** Whether depth-of-field blur is enabled. */
    dof: boolean;
    /** Whether mouse parallax is enabled. */
    parallax: boolean;
    /** Whether the galactic (whole-constellation) rotation runs. */
    galactic: boolean;
    /** Whether self/orbital/float motion runs (false = frozen, §6.4). */
    motion: boolean;
}

const PROFILES: Record<BackgroundTier, TierProfile> = {
    high: {
        tier: "high",
        density: 1.0,
        dof: true,
        parallax: true,
        galactic: true,
        motion: true,
    },
    medium: {
        tier: "medium",
        density: 0.6,
        dof: false,
        parallax: true,
        galactic: true,
        motion: true,
    },
    low: {
        tier: "low",
        density: 0.3,
        dof: false,
        parallax: false,
        galactic: true,
        motion: true,
    },
    off: {
        tier: "off",
        density: 0,
        dof: false,
        parallax: false,
        galactic: false,
        motion: false,
    },
};

/** SSR-safe default — assume a capable device until we can measure. */
const DEFAULT_PROFILE: TierProfile = PROFILES.high;

/**
 * Resolve a performance tier from environment signals.
 *
 * Order of precedence:
 *  1. `prefers-reduced-motion: reduce` → motion + parallax off (but icons may
 *     still render as a frozen composition, §6.4). We keep a low density so the
 *     static frame is cheap.
 *  2. No WebGL / very low memory → `off` (CSS fallback only).
 *  3. Coarse pointer (touch) or low core count → `low`.
 *  4. Moderate cores / memory → `medium`.
 *  5. Otherwise → `high`.
 */
function resolveTier(): BackgroundTier {
    if (typeof window === "undefined") return "high";

    const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    // WebGL availability — a hard gate. No WebGL ⇒ CSS-only fallback.
    const canvas = document.createElement("canvas");
    const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
    if (!gl) return "off";

    const cores = navigator.hardwareConcurrency ?? 4;
    // `deviceMemory` is non-standard but widely available on Chromium.
    const memory =
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    if (reduced) return "low"; // frozen-ish: low density, no motion/parallax
    if (coarse || cores <= 2 || memory <= 2) return "low";
    if (cores <= 4 || memory <= 4) return "medium";
    return "high";
}

/**
 * Detect the background tier once on mount. Returns the high-tier default during
 * SSR / first paint so markup is stable, then refines after hydration.
 *
 * A small `saveData` / `connection.effectiveType` check is folded into `low`.
 */
export function useBackgroundTier(): TierProfile {
    const [profile, setProfile] = useState<TierProfile>(DEFAULT_PROFILE);

    useEffect(() => {
        let tier = resolveTier();

        // Fold in network-quality hints (cheap, no polling).
        const conn = (
            navigator as Navigator & {
                connection?: { saveData?: boolean; effectiveType?: string };
            }
        ).connection;
        if (
            conn?.saveData ||
            conn?.effectiveType === "slow-2g" ||
            conn?.effectiveType === "2g"
        ) {
            tier = tier === "high" ? "medium" : "low";
        }

        setProfile(PROFILES[tier]);

        // React to reduced-motion changes at runtime (OS toggle).
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = () => {
            setProfile((prev) => {
                const next = mq.matches
                    ? "low"
                    : prev.tier === "low"
                      ? "medium"
                      : prev.tier;
                return PROFILES[next];
            });
        };
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    return profile;
}
