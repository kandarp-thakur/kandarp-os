import type { Metadata } from "next";

import { SITE } from "@utils/constants";

/**
 * Site metadata consumed by the root layout + SEO.
 * Kept in the data layer so routes stay thin (per folder-structure rules).
 *
 * Typed as `Metadata` directly (rather than `as const`) so the `openGraph`
 * images array stays mutable — Next's type expects `OGImage[]`, not a
 * readonly tuple.
 */
export const siteMetadata: Metadata = {
    title: {
        default: `${SITE.name} — ${SITE.owner}`,
        template: `%s | ${SITE.name}`,
    },
    description: SITE.description,
    metadataBase: new URL(SITE.url),
    openGraph: {
        title: `${SITE.name} — ${SITE.owner}`,
        description: SITE.description,
        url: SITE.url,
        siteName: SITE.name,
        type: "website",
        locale: "en_US",
        images: [
            {
                url: "/opengraph-image.svg",
                width: 1200,
                height: 630,
                alt: `${SITE.name} — ${SITE.owner}`,
                type: "image/svg+xml",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: `${SITE.name} — ${SITE.owner}`,
        description: SITE.description,
    },
    robots: {
        index: true,
        follow: true,
    },
};
