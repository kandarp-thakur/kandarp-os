/**
 * Site-level configuration for Kandarp OS.
 *
 * Centralizes presentation values that are expected to become CMS-driven in the
 * future (e.g. the Admin Panel Media Library). Components consume these values
 * instead of hardcoding asset paths, so the source can be swapped without
 * touching the component.
 *
 * NOTE: This module is intentionally separate from the identity / routing
 * metadata in `@/utils/constants` (which exports its own `SITE`). That object
 * owns the site's identity + navigation constants; this one owns presentation
 * assets that will migrate to the CMS.
 */
export const SITE = {
    /**
     * The hero portrait image — a transparent PNG/WebP rendered by
     * [`HeroPortrait`](../features/hero/components/HeroPortrait.tsx) via the
     * Next.js `Image` component.
     *
     * Today this is a static path under `/public`. In the future it will
     * resolve from the Admin Panel Media Library without changing the
     * component — `HeroPortrait` already consumes this value as a prop
     * default, so swapping the source here (or feeding it from the CMS) is the
     * only change required.
     */
    profileImage: "/images/profile/portrait.webp",
} as const;
