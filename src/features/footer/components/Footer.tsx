import Link from "next/link";

import { SocialLinks } from "@features/footer/components/SocialLinks";
import { FooterBottom } from "@features/footer/components/FooterBottom";
import { PageContainer } from "@features/layout/components/PageContainer";
import { navItems as defaultNavItems } from "@/data/navigation";
import { SITE, ROUTES } from "@utils/constants";
import { flattenNavItems } from "@utils/navigation";
import type { NavItem, SocialLink, FooterColumn } from "@backend/schemas/types";
import { cn } from "@utils/cn";

interface FooterProps {
    /** Extra classes (escape hatch). */
    className?: string;
    /** CMS-driven site name (falls back to SITE.name). */
    siteName?: string;
    /** CMS-driven site description (falls back to SITE.description). */
    siteDescription?: string;
    /** CMS-driven navigation items (falls back to hardcoded navItems). */
    adminNavItems?: NavItem[];
    /** CMS-driven social links (falls back to hardcoded socials). */
    adminSocials?: SocialLink[];
    /** CMS-driven footer columns (falls back to flattened navItems). */
    adminFooterColumns?: FooterColumn[];
    /** CMS-driven copyright text (falls back to default). */
    copyright?: string;
    /** Whether to show socials (defaults to true). */
    showSocials?: boolean;
    /** CMS-driven owner name (falls back to SITE.owner). */
    ownerName?: string;
    /** CMS-driven user@host string (falls back to SITE.userAtHost). */
    userAtHost?: string;
}

/**
 * Footer — the "System Shutdown" region.
 *
 * Themed as an OS poweroff sequence. Three regions stacked vertically inside
 * a [`PageContainer`](../layout/PageContainer.tsx):
 *
 *   1. **Top** — a terminal-style shutdown banner (`systemctl poweroff`),
 *      the OS wordmark, and the primary nav links repeated as anchor links
 *      (a11y + SEO second path).
 *   2. **Middle** — [`SocialLinks`](./SocialLinks.tsx) row.
 *   3. **Bottom** — [`FooterBottom`](./FooterBottom.tsx) copyright + the
 *      `exit 0` host signature.
 *
 * A Server Component — it composes other Server Components and static data.
 * Designed to be dropped into [`FooterSlot`](../layout/FooterSlot.tsx).
 */
export function Footer({
    className,
    siteName,
    siteDescription,
    adminNavItems,
    adminSocials,
    adminFooterColumns,
    copyright,
    showSocials = true,
    ownerName,
    userAtHost,
}: FooterProps) {
    const name = siteName ?? SITE.name;
    const description = siteDescription ?? SITE.description;

    // Resolve footer nav links: prefer CMS footer columns, then flattened
    // CMS nav items, then the hardcoded defaults.
    const footerLinks = (() => {
        if (adminFooterColumns && adminFooterColumns.length > 0) {
            return adminFooterColumns.flatMap((col) =>
                col.links.map((link) => ({
                    sectionId: link.id,
                    label: link.label,
                    href: link.href,
                })),
            );
        }
        if (adminNavItems && adminNavItems.length > 0) {
            return adminNavItems
                .filter((item) => item.visible)
                .flatMap((item) => [
                    { sectionId: item.id, label: item.label, href: item.href },
                    ...(item.children?.map((child) => ({
                        sectionId: child.id,
                        label: child.label,
                        href: child.href,
                    })) ?? []),
                ]);
        }
        return flattenNavItems(defaultNavItems);
    })();

    return (
        <PageContainer maxWidth="xl" className={cn("py-10", className)}>
            {/* Top — shutdown banner + footer nav */}
            <div className="flex flex-col gap-8 pb-8 md:flex-row md:items-start md:justify-between">
                <div className="max-w-sm">
                    {/* Shutdown banner — terminal poweroff aesthetic */}
                    <p className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                        {"// SYSTEM SHUTDOWN"}
                    </p>
                    <p className="mt-2 font-mono text-sm text-text-secondary">
                        <span className="text-accent-solid">$</span> systemctl
                        poweroff
                    </p>
                    <Link
                        href={ROUTES.home}
                        className="mt-3 inline-block font-sans text-base font-semibold tracking-[-0.01em] text-text-primary"
                    >
                        {name}
                    </Link>
                    <p className="mt-2 font-sans text-sm text-text-tertiary">
                        {description}
                    </p>
                </div>

                <nav aria-label="Footer">
                    <ul className="flex flex-wrap gap-x-6 gap-y-2">
                        {footerLinks.map((item) => (
                            <li key={item.sectionId}>
                                <a
                                    href={item.href}
                                    className={cn(
                                        "font-sans text-sm text-text-secondary",
                                        "transition-colors duration-fast ease-standard",
                                        "hover:text-text-primary",
                                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                    )}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* Middle — social links */}
            {showSocials && (
                <div className="border-t border-border-subtle py-6">
                    <SocialLinks adminSocials={adminSocials} />
                </div>
            )}

            {/* Bottom — copyright + host signature */}
            <div className="border-t border-border-subtle pt-6">
                <FooterBottom
                    copyright={copyright}
                    ownerName={ownerName}
                    userAtHost={userAtHost}
                />
            </div>
        </PageContainer>
    );
}

Footer.displayName = "Footer";
