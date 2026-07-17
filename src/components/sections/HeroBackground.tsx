"use client";

/**
 * HeroBackground (hero-design §0, §12; hero-background-redesign).
 *
 * The hero's local static backdrop — a clean, premium, engineering-grade
 * background that enhances the content rather than competing with it.
 *
 * Composition (per the redesign brief):
 *  1. **Clean gradient.** A near-invisible vertical gradient
 *     `#050816 → #0B1020 → #111827` — the calm base. No images, no blobs.
 *  2. **Ambient lighting.** Two very-low-opacity, large-blur radial glows
 *     (soft blue + soft Docker Blue) that softly illuminate the scene. They never
 *     read as floating blobs — they are diffuse ambient light, not objects.
 *  3. **Subtle film grain.** A 2–4% opacity grain layer for texture without
 *     visible pixels or rough static noise.
 *
 * Everything sits behind the content (`-z-10`, `pointer-events-none`).
 * Decorative only: `aria-hidden`, no pointer events.
 *
 * The animated [`DevOpsBackground`](../background/DevOpsBackground.tsx) is
 * mounted once at the layout level via
 * [`PageBackground`](../background/PageBackground.tsx), so it persists behind
 * every section. This component owns only the hero-scoped static layer.
 */
export function HeroBackground() {
    return null;
}

/**
 * The immediate, non-animated backdrop kept as a fallback implementation.
 * HeroBackground currently returns null so the hero stays transparent.
 */
function _HeroBackgroundFallback() {
    return (
        <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
        >
            <div
                className="absolute inset-0"
                style={{ backgroundImage: "var(--hero-bg-gradient)" }}
            />

            <div
                className="absolute -left-[20%] -top-[25%] h-[80vh] w-[80vh] rounded-full blur-[120px]"
                style={{
                    background:
                        "radial-gradient(circle at center, var(--hero-ambient-blue), transparent 70%)",
                }}
            />

            <div
                className="absolute -right-[20%] -bottom-[25%] h-[80vh] w-[80vh] rounded-full blur-[120px]"
                style={{
                    background:
                        "radial-gradient(circle at center, var(--hero-ambient-Docker Blue), transparent 70%)",
                }}
            />

            <div
                className="absolute inset-0 mix-blend-soft-light"
                style={{
                    opacity: "var(--hero-grain-opacity)",
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
            />
        </div>
    );
}

HeroBackground.displayName = "HeroBackground";
