import type { MetadataRoute } from "next";

import { getSiteConfig } from "@/hooks/useSiteConfig";

/**
 * Web App Manifest (Next.js Metadata API).
 *
 * Emits `/manifest.webmanifest` — lets the site be "installed" as a PWA
 * and gives Android / desktop browsers an explicit name, theme color,
 * and icon set. The name, description, and theme color come from the CMS
 * site config so they stay in sync with the Settings.
 *
 * The icon is an SVG (`/icon.svg`) — crisp at every density and far
 * smaller than raster equivalents. SVG is supported by all modern
 * browsers for PWA installability.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const config = await getSiteConfig();

    return {
        name: config.name,
        short_name: config.shortName,
        description: config.description,
        start_url: "/",
        display: "standalone",
        background_color: config.colors.background,
        theme_color: config.colors.background,
        categories: ["portfolio", "developer", "technology"],
        icons: [
            {
                src: config.favicon ?? "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
            },
        ],
    };
}
