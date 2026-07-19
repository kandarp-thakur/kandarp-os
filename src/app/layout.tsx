import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import { fontVariables } from "@/assets/fonts";
import { Providers } from "@providers";
import { AppShell } from "@features/layout/components";
import { PageBackground } from "@features/background/components/PageBackground";
import { CloudInfinityBackground } from "@features/background/components/CloudInfinityBackground";
import { ThemeTokens } from "@features/shared/components/ThemeTokens";
import { AnalyticsBeacon } from "@features/shared/components/AnalyticsBeacon";
import { getSiteConfig } from "@hooks/useSiteConfig";
import { getPublicMetadata } from "@backend/services/public-data";
import "./globals.css";

/**
 * Generate metadata from the CMS (Settings.globalSeo + brand). Falls back to
 * the hardcoded SITE constants if the store is unavailable. This makes the
 * SEO admin module live: editing the global SEO title/description revalidates
 * the layout (via the `public:settings` tag) and the next render picks up the
 * new metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
    const [seo, config] = await Promise.all([
        getPublicMetadata(),
        getSiteConfig(),
    ]);

    return {
        title: seo.title,
        description: seo.description,
        metadataBase: new URL(config.url),
        openGraph: {
            title: seo.openGraph.title,
            description: seo.openGraph.description,
            url: config.url,
            siteName: config.name,
            type: "website" as const,
            locale: "en_US",
            images: [
                {
                    url: "/opengraph-image.svg",
                    width: 1200,
                    height: 630,
                    alt: `${config.name} — ${config.owner}`,
                    type: "image/svg+xml",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: seo.twitter.title,
            description: seo.twitter.description,
        },
        robots: {
            index: !config.maintenanceMode,
            follow: !config.maintenanceMode,
        },
    };
}

/**
 * JSON-LD structured data for the site + author.
 *
 * Emits a `WebSite` node (rich result eligibility + sitelink search box)
 * and a `Person` node (author identity for article rich results). Kept in
 * the root layout so every route inherits the same canonical identity.
 */
/**
 * JSON-LD structured data for the site + author.
 *
 * Emits a `WebSite` node (rich result eligibility + sitelink search box)
 * and a `Person` node (author identity for article rich results). The values
 * are resolved from the CMS (Settings + Profile) so editing the site name or
 * owner name in the admin console updates the structured data on the next
 * revalidation.
 */
async function buildJsonLd() {
    const config = await getSiteConfig();
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${config.url}/#website`,
                url: config.url,
                name: config.name,
                description: config.description,
                inLanguage: "en",
                author: { "@id": `${config.url}/#person` },
            },
            {
                "@type": "Person",
                "@id": `${config.url}/#person`,
                name: config.owner,
                url: config.url,
            },
        ],
    };
}

export const viewport: Viewport = {
    themeColor: "#0a0a0f",
    width: "device-width",
    initialScale: 1,
};

/**
 * Root layout — Kandarp OS.
 *
 * The site is dark-only (the "OS" aesthetic). `data-theme="dark"` is set
 * statically on `<html>` so tokens resolve to the dark palette on first
 * paint — no FOUC, no runtime switching, no blocking script.
 */
export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    // The admin console sets `x-is-admin` via middleware. When present, we
    // skip the public chrome (navbar, footer, 3D background) — the admin
    // route group provides its own layout with a dark theme + sidebar.
    const headerStore = await headers();
    const isAdmin = headerStore.get("x-is-admin") === "1";

    if (isAdmin) {
        return (
            <html lang="en" data-theme="dark" data-admin="true">
                <body
                    className={`${fontVariables} min-h-screen font-sans text-text-primary antialiased admin-surface`}
                >
                    {children}
                </body>
            </html>
        );
    }

    // Resolve the site config (cached via ISR tags) for theme + identity.
    const config = await getSiteConfig();
    const jsonLd = await buildJsonLd();

    return (
        <html lang="en" data-theme={config.theme}>
            <head>
                {/* CMS-driven design tokens (colors, fonts) from Settings. */}
                <ThemeTokens />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                {/* Favicon from Settings (falls back to the default icon.svg). */}
                {config.favicon && <link rel="icon" href={config.favicon} />}
            </head>
            <body
                className={`${fontVariables} min-h-screen bg-canvas-base font-sans text-text-primary antialiased`}
                // Browser extensions (e.g. Grammarly) inject attributes such as
                // `data-new-gr-c-s-check-loaded` / `data-gr-ext-installed` into
                // <body> before React hydrates, causing a spurious hydration
                // mismatch. `suppressHydrationWarning` tells React to ignore
                // attribute-only differences here (it does NOT silence content
                // mismatches). This is the officially recommended fix for
                // extension-induced hydration warnings.
                suppressHydrationWarning
            >
                <Providers>
                    {/* The persistent, page-wide living infrastructure
                        background — fixed behind every section + route. */}
                    <PageBackground />

                    {/* The signature CloudInfinity object — the visual
                        identity of Kandarp OS. Lives behind the hero content,
                        scales + fades as the user scrolls past the hero. */}
                    <CloudInfinityBackground />

                    {/* Analytics beacon — fires pageview + duration events to
                        the admin analytics ingest endpoint. Renders nothing. */}
                    <AnalyticsBeacon />

                    <AppShell>{children}</AppShell>
                </Providers>
            </body>
        </html>
    );
}
