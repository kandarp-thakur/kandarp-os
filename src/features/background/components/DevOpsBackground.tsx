"use client";

/**
 * DevOpsBackground — the animated DevOps ecosystem background.
 *
 * A reusable, dependency-free animated background implementing
 * docs/devops-background.md: a slowly rotating constellation of glass
 * medallions (Infrastructure, Docker, AWS, Linux, Networking, Cloud, Git,
 * Python, Data Packets) floating in three depth shells behind the content.
 *
 * Design fidelity:
 *  - Glass medallions, monochrome silhouettes (§1) — no brand colors.
 *  - 3 depth shells: near (sharp) → far (blurred) for atmospheric perspective.
 *  - Slow, varied rotation: galactic + orbital + self + float + tilt (§3).
 *  - Mouse parallax, smoothed (§6.1).
 *  - Tier scaling + reduced-motion frozen fallback (§7, §6.4).
 *  - Content zone kept clear (§4.3).
 *
 * Performance:
 *  - Pure CSS transforms/opacity for all motion (compositor-friendly).
 *  - One shared rAF for parallax (no per-frame React renders).
 *  - `content-visibility: auto` on shells off-screen to skip paint.
 *  - `will-change` only on actively-animated layers.
 *  - `aria-hidden` + `pointer-events: none` — decorative, never blocks content.
 *
 * Usage:
 *   <DevOpsBackground />            // full-bleed, fixed behind a section
 *   <DevOpsBackground fixed={false} />  // absolute within a positioned parent
 */

import { useCallback, useMemo, useRef } from "react";

import { DEVOPS_ICON_MAP } from "./devopsIcons";
import { generateConstellation, type Medallion } from "./constellation";
import { useBackgroundTier, type TierProfile } from "./useBackgroundTier";
import { useParallax, type ParallaxState } from "./useParallax";
import { cn } from "@utils/cn";

export interface DevOpsBackgroundProps {
    /** Fixed to the viewport (default) or absolute within a positioned parent. */
    fixed?: boolean;
    /** Optional className for the root layer. */
    className?: string;
    /** Override the deterministic layout seed (default 7). */
    seed?: number;
    /** Render a faint mono label in the corner (debug/preview). */
    debugLabel?: string;
}

/** Base medallion size in px (scaled per shell). */
const BASE_SIZE = 64;

/**
 * Apply the tier profile to the constellation: trim density and disable motion
 * flags. Pure + memoized so the layout is stable for a given tier.
 */
function applyTier(medallions: Medallion[], tier: TierProfile): Medallion[] {
    if (tier.density >= 1) return medallions;
    const keep = Math.max(0, Math.round(medallions.length * tier.density));
    // Keep a spread: stride through the list so all shells + icon types survive.
    if (keep === 0) return [];
    const stride = medallions.length / keep;
    const result: Medallion[] = [];
    for (let i = 0; i < keep; i++) {
        const idx = Math.floor(i * stride) % medallions.length;
        const m = medallions[idx];
        if (m) result.push(m);
    }
    return result;
}

export function DevOpsBackground({
    fixed = true,
    className,
    seed = 7,
    debugLabel,
}: DevOpsBackgroundProps) {
    const tier = useBackgroundTier();
    const full = useMemo(() => generateConstellation(seed), [seed]);
    const medallions = useMemo(() => applyTier(full, tier), [full, tier]);

    const containerRef = useRef<HTMLDivElement>(null);

    // Drive parallax by writing CSS custom properties on the container inside
    // the parallax hook's single shared rAF tick — damping + DOM writes happen
    // in one loop, with no second rAF and no per-frame React renders.
    const applyParallax = useCallback((s: ParallaxState, range: number) => {
        const el = containerRef.current;
        if (!el) return;
        el.style.setProperty("--bg-px", `${(s.x * range).toFixed(2)}px`);
        el.style.setProperty("--bg-py", `${(s.y * range).toFixed(2)}px`);
    }, []);
    useParallax({
        enabled: tier.parallax,
        onFrame: applyParallax,
    });

    // CSS-tier gating: the root carries data attributes consumed by the
    // stylesheet to disable motion / DOF / parallax per tier.
    const dataAttrs = {
        "data-tier": tier.tier,
        "data-motion": tier.motion ? "on" : "off",
        "data-dof": tier.dof ? "on" : "off",
        "data-parallax": tier.parallax ? "on" : "off",
    };

    return (
        <div
            ref={containerRef}
            aria-hidden="true"
            {...dataAttrs}
            className={cn(
                "devops-bg",
                fixed ? "devops-bg--fixed" : "devops-bg--absolute",
                className,
            )}
        >
            {/* Layer 1: the constellation. Far → near paint order for depth.
                The clean gradient + ambient lighting live in HeroBackground /
                the page; this layer is only the slow-floating engineering
                icons. No wash, no galactic grid — those were visual clutter. */}
            {medallions.length > 0 ? (
                <div className="devops-bg__constellation">
                    {medallions.map((m) => (
                        <MedallionView key={m.id} m={m} tier={tier} />
                    ))}
                </div>
            ) : null}

            {/* Layer 0 (front): barely-there edge fade to frame content. */}
            <div className="devops-bg__vignette" />

            {debugLabel ? (
                <span className="devops-bg__label">{debugLabel}</span>
            ) : null}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Medallion                                                                  */
/* -------------------------------------------------------------------------- */

interface MedallionViewProps {
    m: Medallion;
    tier: TierProfile;
}

/**
 * A single glass medallion. All motion is CSS-driven via inline custom
 * properties so each medallion's varied durations/phases are honored without
 * generating unique class names. The element is `content-visibility: auto` so
 * off-screen medallions skip paint (per the perf strategy).
 */
function MedallionView({ m, tier }: MedallionViewProps) {
    const icon = DEVOPS_ICON_MAP[m.icon];
    const size = BASE_SIZE * m.scale;

    // Per-medallion CSS custom properties drive the keyframes (varied motion).
    const style: React.CSSProperties = {
        // Position on the shell disk (vmin-relative → responsive).
        left: `${m.x}%`,
        top: `${m.y}%`,
        // Sizing + depth (depth via opacity + scale only — no blur).
        ["--m-size" as string]: `${size}px`,
        ["--m-opacity" as string]: String(m.opacity),
        ["--m-parallax" as string]: String(m.parallax),
        // Motion durations (varied). Set to 0s when motion is off → frozen.
        ["--m-spin" as string]: tier.motion ? `${m.spin}s` : "0s",
        ["--m-orbit" as string]: tier.motion ? `${m.orbit}s` : "0s",
        ["--m-float" as string]: tier.motion ? `${m.float}s` : "0s",
        ["--m-tilt" as string]: tier.motion ? `${m.tilt}s` : "0s",
        ["--m-float-phase" as string]: `-${m.floatPhase}s`,
        ["--m-start" as string]: `${m.startAngle}deg`,
        // Negative delays so the constellation is "already in motion" on mount
        // (no synchronized start) — derived from the seeded layout.
        animationDelay: tier.motion ? `-${m.floatPhase}s` : undefined,
    };

    return (
        <div
            className="devops-medallion"
            style={style}
            data-shell={m.shell}
            data-icon={m.icon}
        >
            <div className="devops-medallion__inner">
                <svg
                    className="devops-medallion__icon"
                    viewBox="0 0 24 24"
                    width="100%"
                    height="100%"
                    aria-hidden="true"
                    focusable="false"
                >
                    {icon.fill ? (
                        <path d={icon.path} fill="currentColor" />
                    ) : (
                        <path
                            d={icon.path}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}
                </svg>
            </div>
        </div>
    );
}

DevOpsBackground.displayName = "DevOpsBackground";
