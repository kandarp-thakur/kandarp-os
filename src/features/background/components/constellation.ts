/**
 * DevOps constellation layout generator.
 *
 * Implements docs/devops-background.md §4 (Spatial Composition) and §3 (Motion
 * Design): icons are distributed across three depth shells via spherical
 * Fibonacci distribution, each with a varied self-rotation speed, orbital
 * radius, float phase, and tilt. The generator is pure + deterministic (seeded)
 * so SSR and the client produce identical markup — no hydration mismatch.
 */

import { DEVOPS_ICONS, type DevOpsIconId } from "./devopsIcons";

/** The three depth shells (§4.2). Far → near. */
export type ShellTier = "far" | "mid" | "near";

export interface ShellConfig {
    tier: ShellTier;
    /** Orbital radius in viewport-relative units (vmin). */
    radius: number;
    /** Icon count on this shell. */
    count: number;
    /** Icon scale relative to base. */
    scale: number;
    /** Medallion opacity (background never competes with content). */
    opacity: number;
    /** Parallax depth factor — far shells move more with the mouse. */
    parallax: number;
    /** Blur in px to simulate depth-of-field haze (§5.3). */
    blur: number;
}

/** Shell definitions (§4.2), ordered far → near for paint order.
 *
 * Redesigned (hero-background-redesign): reduced density + opacity so the
 * engineering icons read as a faint, intentional constellation behind the
 * content — never clutter. Depth is conveyed via opacity + scale only (no
 * blur; the `blur` field is retained for the type contract but unused). */
export const SHELLS: readonly ShellConfig[] = [
    {
        tier: "far",
        radius: 42,
        count: 6,
        scale: 0.5,
        opacity: 0.18,
        parallax: 1.0,
        blur: 0,
    },
    {
        tier: "mid",
        radius: 30,
        count: 7,
        scale: 0.75,
        opacity: 0.22,
        parallax: 0.6,
        blur: 0,
    },
    {
        tier: "near",
        radius: 20,
        count: 4,
        scale: 1.0,
        opacity: 0.28,
        parallax: 0.3,
        blur: 0,
    },
] as const;

/** A single placed medallion in the constellation. */
export interface Medallion {
    id: string;
    icon: DevOpsIconId;
    shell: ShellTier;
    /** Horizontal position as % of container (50 = center). */
    x: number;
    /** Vertical position as % of container (50 = center). */
    y: number;
    /** Visual scale multiplier. */
    scale: number;
    /** Medallion opacity. */
    opacity: number;
    /** Parallax depth factor (0 = none, 1 = max). */
    parallax: number;
    /** Depth-of-field blur in px. */
    blur: number;
    /** Self-rotation duration in seconds (varied, §3.3). */
    spin: number;
    /** Orbital drift duration in seconds (varied). */
    orbit: number;
    /** Float (vertical bob) duration in seconds (§3.3). */
    float: number;
    /** Float phase offset in seconds — desynchronizes the bob. */
    floatPhase: number;
    /** Tilt wobble duration in seconds (§3.3). */
    tilt: number;
    /** Initial rotation in degrees — avoids a synchronized start. */
    startAngle: number;
    /** Whether the icon path is a fill silhouette or a stroke glyph. */
    fill: boolean;
}

/**
 * Mulberry32 — a tiny, fast, deterministic PRNG. Seeded so the layout is stable
 * across SSR + client (no hydration mismatch) and across reloads.
 */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Pick an icon id by index, cycling through the catalog evenly. */
function iconForIndex(i: number): DevOpsIconId {
    const icon = DEVOPS_ICONS[i % DEVOPS_ICONS.length];
    if (!icon) {
        throw new Error(
            "DEVOPS_ICONS catalog is empty — cannot resolve icon for index.",
        );
    }
    return icon.id;
}

/**
 * Map a uniform [0,1) value to a varied duration within [min,max].
 * Uses a power curve so most icons land near the slow end (meditative), with a
 * few faster ones for life (§3.4 "Varied, not synchronized").
 */
function variedDuration(rng: () => number, min: number, max: number): number {
    const u = rng();
    // Bias toward slow: square the uniform so the distribution skews low.
    const skewed = 1 - u * u;
    return min + skewed * (max - min);
}

/**
 * Generate the full constellation. Pure + deterministic for a given seed.
 *
 * Distribution (§4.3): spherical Fibonacci on each shell keeps icons evenly
 * spaced (no clustering). A vertical bias pushes slightly more icons into the
 * upper hemisphere. The center 3-unit radius is kept clear (content zone).
 */
export function generateConstellation(seed = 7): Medallion[] {
    const rng = mulberry32(seed);
    const medallions: Medallion[] = [];
    let globalIndex = 0;

    for (const shell of SHELLS) {
        const n = shell.count;
        const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle

        for (let i = 0; i < n; i++) {
            // Fibonacci sphere: even spacing over a hemisphere-ish volume.
            const t = i / n;
            const phi = Math.acos(1 - 2 * t); // 0 → π
            const theta = golden * i;

            // Convert spherical → planar position on the shell disk.
            // Slight vertical bias (§4.3): lift the y distribution upward.
            const r = shell.radius * Math.sqrt(phi / Math.PI);
            let x = 50 + r * Math.cos(theta);
            let y = 50 + r * Math.sin(theta) * 0.82; // flatten vertically a touch

            // Keep the content zone clear (§4.3): nudge anything inside the
            // inner 3-unit radius outward. (Rare with Fibonacci, but safe.)
            const dx = x - 50;
            const dy = y - 50;
            const dist = Math.hypot(dx, dy);
            const minDist = 7;
            if (dist < minDist && dist > 0.01) {
                const k = minDist / dist;
                x = 50 + dx * k;
                y = 50 + dy * k;
            }

            const iconId = iconForIndex(globalIndex);
            const icon = DEVOPS_ICONS.find((d) => d.id === iconId);
            if (!icon) {
                throw new Error(
                    `DevOps icon "${iconId}" not found in catalog.`,
                );
            }

            medallions.push({
                id: `${shell.tier}-${i}`,
                icon: iconId,
                shell: shell.tier,
                x,
                y,
                scale: shell.scale * (0.85 + rng() * 0.3), // slight size variety
                opacity: shell.opacity,
                parallax: shell.parallax,
                blur: shell.blur,
                // §3.3: self-rotation 6–12°/s → 30–60s per rotation.
                spin: variedDuration(rng, 30, 60),
                // §3.3: orbital 4–6°/s → 60–90s per orbit.
                orbit: variedDuration(rng, 60, 90),
                // §3.3: float ±0.3 units / 8s sine — keep ~8s, small variety.
                float: 7 + rng() * 3,
                floatPhase: rng() * 8, // desync the bob
                // §3.3: tilt ±5° / 12s sine.
                tilt: 10 + rng() * 6,
                startAngle: rng() * 360,
                fill: icon.fill,
            });
            globalIndex++;
        }
    }

    return medallions;
}

/** Total medallion count across all shells (the "high" tier, §7.1). */
export const TOTAL_MEDALLIONS = SHELLS.reduce((sum, s) => sum + s.count, 0);
