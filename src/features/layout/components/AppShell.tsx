import type { ReactNode } from "react";

import { NavigationLayout } from "@features/layout/components/NavigationLayout";
import { ContentWrapper } from "@features/layout/components/ContentWrapper";
import { FooterSlot } from "@features/layout/components/FooterSlot";
import { Footer } from "@features/footer/components/Footer";
import { getSiteConfig } from "@hooks/useSiteConfig";
import { cn } from "@utils/cn";

interface AppShellProps {
    /** The routed page content. */
    children: ReactNode;
    /** Override the navigation region. Defaults to [`NavigationLayout`](./NavigationLayout.tsx). */
    navigation?: ReactNode;
    /** Override the footer region. Defaults to [`Footer`](../footer/Footer.tsx) inside [`FooterSlot`](./FooterSlot.tsx). */
    footer?: ReactNode;
    /** Extra classes on the shell root (escape hatch). */
    className?: string;
}

/**
 * AppShell — the global application layout skeleton.
 *
 * Composes the three reusable regions of every page:
 *
 *   1. **Navigation** — [`NavigationLayout`](./NavigationLayout.tsx) (skip-link + navbar).
 *   2. **Content** — [`ContentWrapper`](./ContentWrapper.tsx) wrapping `children`.
 *      Grows to fill the viewport (`flex-1`) so the footer sticks to the bottom
 *      on short pages.
 *   3. **Footer** — [`FooterSlot`](./FooterSlot.tsx) wrapping [`Footer`](../footer/Footer.tsx).
 *
 * Both `navigation` and `footer` are slot props (component-rules §7.3), so a
 * route group can swap either region without rebuilding the shell. The shell
 * itself owns only structure + the sticky-footer flex column — no content.
 *
 * A Server Component — it composes Server + Client components and renders no
 * interactive UI of its own. Mounted once inside the root layout.
 */
export async function AppShell({
    children,
    navigation,
    footer,
    className,
}: AppShellProps) {
    // Resolve the CMS-driven site identity (cached via ISR tags). This single
    // read feeds both the Navbar (navigation + socials + logo) and the Footer
    // (columns + socials + copyright). The `unstable_cache` wrapper in
    // [`getSiteConfig`](../../hooks/useSiteConfig.ts) deduplicates this with
    // the layout's own call, so there is no duplicate store read.
    const config = await getSiteConfig();

    return (
        <div
            className={cn(
                // No background: the body already carries `bg-canvas-base`.
                // Keep content above the fixed decorative background layers
                // without pushing those layers behind the document canvas.
                "relative z-10 flex min-h-[100svh] flex-col",
                className,
            )}
        >
            {navigation ?? (
                <NavigationLayout
                    adminNavItems={config.navigation}
                    adminSocials={config.socials}
                    siteName={config.name}
                    userAtHost={config.userAtHost}
                />
            )}

            <ContentWrapper>{children}</ContentWrapper>

            {footer ?? (
                <FooterSlot>
                    <Footer
                        siteName={config.name}
                        siteDescription={config.description}
                        adminNavItems={config.navigation}
                        adminSocials={config.socials}
                        adminFooterColumns={config.footer.columns}
                        copyright={config.footer.copyright}
                        showSocials={config.footer.showSocials}
                        ownerName={config.owner}
                        userAtHost={config.userAtHost}
                    />
                </FooterSlot>
            )}
        </div>
    );
}

AppShell.displayName = "AppShell";
