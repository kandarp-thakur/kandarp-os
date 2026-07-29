import type { MetadataRoute } from "next";

import { getSiteConfig } from "@hooks/useSiteConfig";

/**
 * Dynamic robots.txt (Next.js Metadata API).
 *
 * Allows all crawlers full access — the portfolio is fully indexable.
 * Points crawlers at the generated sitemap so new posts / tags are
 * discovered without manual submission. The base URL comes from the CMS
 * site config so it stays in sync with the Settings.
 *
 * When maintenance mode is on, crawlers are disallowed.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
    const config = await getSiteConfig();
    const base = config.url.replace(/\/$/, "");

    return {
        rules: {
            userAgent: "*",
            allow: config.maintenanceMode ? "" : "/",
            disallow: config.maintenanceMode ? "/" : undefined,
        },
        sitemap: `${base}/sitemap.xml`,
        host: base,
    };
}
