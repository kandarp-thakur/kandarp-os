import type { ReactNode } from "react";

import { Navbar } from "@/components/navigation/Navbar";
import { SkipNav } from "@/components/navigation/SkipNav";
import type { NavItem, SocialLink } from "@/lib/admin/types";

interface NavigationLayoutProps {
    /**
     * Override the default navigation. Defaults to the standard
     * [`Navbar`](../navigation/Navbar.tsx). The skip-link is always rendered
     * first so it remains the first focusable element regardless of the slot.
     */
    navigation?: ReactNode;
    /** CMS-driven navigation items (admin shape, icon as string). */
    adminNavItems?: NavItem[];
    /** CMS-driven social links (admin shape). */
    adminSocials?: SocialLink[];
    /** CMS-driven site name (forwarded to the Logo). */
    siteName?: string;
    /** CMS-driven user@host string (forwarded to the Logo). */
    userAtHost?: string;
}

/**
 * NavigationLayout — the navigation region of the application shell.
 *
 * Composes the accessibility skip-link (kept as the first focusable element
 * in the document) with the primary navigation. Accepts an optional
 * `navigation` slot so a route group can swap in a custom navbar while
 * retaining the skip-link (component-rules §7.3: slots over booleans).
 *
 * A Server Component — it renders a Client Component ([`Navbar`](../navigation/Navbar.tsx))
 * and a Server Component ([`SkipNav`](../navigation/SkipNav.tsx)).
 */
export function NavigationLayout({
    navigation,
    adminNavItems,
    adminSocials,
    siteName,
    userAtHost,
}: NavigationLayoutProps) {
    return (
        <>
            <SkipNav />
            {navigation ?? (
                <Navbar
                    adminNavItems={adminNavItems}
                    adminSocials={adminSocials}
                    siteName={siteName}
                    userAtHost={userAtHost}
                />
            )}
        </>
    );
}

NavigationLayout.displayName = "NavigationLayout";
