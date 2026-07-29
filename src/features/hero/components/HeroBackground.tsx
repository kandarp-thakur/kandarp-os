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

HeroBackground.displayName = "HeroBackground";
