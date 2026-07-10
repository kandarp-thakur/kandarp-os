import { socials as defaultSocials } from "@/data/socials";
import type { SocialLink as AdminSocialLink } from "@/lib/admin/types";
import { cn } from "@/utils/cn";

interface SocialLinksProps {
    /** Extra classes (escape hatch). */
    className?: string;
    /** CMS-driven social links (admin shape). Falls back to the hardcoded socials. */
    adminSocials?: AdminSocialLink[];
}

/**
 * SocialLinks — the footer's row of social/contact links
 * (component-inventory §Navigation #11–13).
 *
 * Renders the validated [`socials`](../../data/socials.ts) as accessible
 * anchor links. External links open in a new tab with `noopener noreferrer`;
 * `mailto:` and internal paths stay in-tab. Each link is keyboard-focusable
 * with the standard accent focus ring.
 *
 * A Server Component — it renders static data with no interactivity. Accepts
 * optional CMS-driven social links; falls back to the hardcoded defaults.
 */
export function SocialLinks({ className, adminSocials }: SocialLinksProps) {
    // Resolve socials: CMS-driven if provided, otherwise defaults.
    const links = (() => {
        if (adminSocials && adminSocials.length > 0) {
            return adminSocials.map((s, i) => ({
                id: s.id || `social-${i}`,
                label: s.platform,
                url: s.url,
            }));
        }
        return defaultSocials;
    })();

    return (
        <ul className={cn("flex flex-wrap items-center gap-1", className)}>
            {links.map((social) => {
                const isExternal =
                    /^https?:\/\//.test(social.url) ||
                    !social.url.startsWith("/");
                return (
                    <li key={social.id}>
                        <a
                            href={social.url}
                            {...(isExternal
                                ? {
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                }
                                : {})}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5",
                                "font-sans text-sm text-text-secondary",
                                "transition-colors duration-fast ease-standard",
                                "hover:bg-overlay-hover hover:text-text-primary",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                            )}
                        >
                            {social.label}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

SocialLinks.displayName = "SocialLinks";
