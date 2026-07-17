"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import {
    Award,
    Boxes,
    GitBranch,
    Network,
    ScrollText,
    TerminalSquare,
    Wrench,
    type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/navigation/Logo";
import { NavList } from "@/components/navigation/NavList";
import { Hamburger } from "@/components/navigation/Hamburger";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { ScrollProgress } from "@/components/navigation/ScrollProgress";
import { CommandButton } from "@/components/navigation/CommandButton";
import {
    CommandPalette,
    type CommandItem,
} from "@/components/shared/CommandPalette";
import { navItems as defaultNavItems } from "@/data/navigation";
import { socials as defaultSocials } from "@/data/socials";
import type {
    NavItem as AdminNavItem,
    SocialLink as AdminSocialLink,
} from "@/lib/admin/types";
import {
    flattenNavItems,
    getActiveSection,
    scrollToSection,
} from "@/utils/navigation";
import { cn } from "@/utils/cn";

/** A map of icon name → LucideIcon component, for resolving admin nav icons. */
const ICON_MAP: Record<string, LucideIcon> = {
    Award,
    Boxes,
    GitBranch,
    Network,
    ScrollText,
    TerminalSquare,
    Wrench,
};

/**
 * Resolve an admin NavItem (icon as a string name) to the public NavItem shape
 * (icon as a LucideIcon component). Falls back to the GitBranch icon if the
 * name is unknown.
 */
function resolveAdminNav(items: AdminNavItem[]): typeof defaultNavItems {
    return items
        .filter((item) => item.visible)
        .map((item) => {
            const icon = ICON_MAP[item.icon ?? ""] ?? GitBranch;
            const children = item.children?.map((child) => ({
                label: child.label,
                href: child.href,
                sectionId: child.href.replace(/^#/, ""),
                icon,
            }));
            return {
                label: item.label,
                shortLabel: item.label,
                href: item.href,
                sectionId: item.href.replace(/^#/, ""),
                icon,
                children: children?.length ? children : undefined,
            };
        });
}

/**
 * Resolve admin social links to the public social shape. The admin SocialLink
 * has `platform` + `url` + `icon`; the public shape has `id`, `label`,
 * `command`, `url`, `handle`, `description`. We derive the label from the
 * platform and use the platform as the command.
 */
function resolveAdminSocials(
    socials: AdminSocialLink[],
): typeof defaultSocials {
    return socials.map((s, i) => ({
        id: s.id || `social-${i}`,
        label: s.platform,
        command: s.platform.toLowerCase(),
        url: s.url,
        handle: s.url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        description: "",
    }));
}

/** Scroll position (px) past which the navbar enters its "scrolled" state. */
const SCROLL_THRESHOLD = 80;

/** Scroll-spy: throttle interval in ms. */
const SPY_INTERVAL = 100;

/**
 * The primary navigation bar (navigation-design §1–§9).
 *
 * A floating glass pill that sticks to the top of the viewport. It is
 * scroll-aware: at rest it is a subtle, taller glass surface; past 80px of
 * scroll it shrinks and strengthens its glass + shadow. A 2px gradient
 * progress bar tracks reading progress at the very top. On mobile the links
 * collapse into a full-screen glass menu.
 *
 * Navigation is anchor-based: links smooth-scroll to sections on the single
 * home page. Active-state highlighting is driven by scroll position
 * (scroll-spy) rather than the URL pathname.
 *
 * The right cluster hosts a ⌘K search trigger (opens the command palette),
 * separated from the hamburger by a divider. The command palette is also
 * opened via the Cmd/Ctrl+K keyboard shortcut.
 *
 * This is a Client Component because it depends on scroll position, the
 * mobile-menu open state, and the command-palette open state.
 */
export interface NavbarProps {
    /** CMS-driven navigation items (admin shape, icon as string). Falls back to the hardcoded navItems. */
    adminNavItems?: AdminNavItem[];
    /** CMS-driven social links (admin shape). Falls back to the hardcoded socials. */
    adminSocials?: AdminSocialLink[];
    /** CMS-driven site name (forwarded to [`Logo`](./Logo.tsx)). */
    siteName?: string;
    /** CMS-driven user@host string (forwarded to [`Logo`](./Logo.tsx)). */
    userAtHost?: string;
}

export function Navbar({
    adminNavItems,
    adminSocials,
    siteName,
    userAtHost,
}: NavbarProps = {}) {
    const reduced = useReducedMotion() === true;

    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Resolve the nav items: CMS-driven (admin shape → public shape) if
    // provided, otherwise the hardcoded defaults.
    const navItems = useMemo(
        () =>
            adminNavItems && adminNavItems.length > 0
                ? resolveAdminNav(adminNavItems)
                : defaultNavItems,
        [adminNavItems],
    );

    // Resolve the social links: CMS-driven if provided, otherwise defaults.
    const socials = useMemo(
        () =>
            adminSocials && adminSocials.length > 0
                ? resolveAdminSocials(adminSocials)
                : defaultSocials,
        [adminSocials],
    );

    // The flattened nav tree — every scrollable destination, in order. Used by
    // scroll-spy and the command palette so dropdown children are observable
    // and searchable, not just the top-level entries.
    const flatNav = useMemo(() => flattenNavItems(navItems), [navItems]);

    // Viewport scroll progress (0 → 1) for the top progress bar.
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 30,
        restDelta: 0.001,
    });

    // Toggle the scrolled state past the threshold.
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Scroll-spy: track which section is in view to highlight the active link.
    // Uses the flattened nav tree so every section (including dropdown
    // children) is observed. Throttled via a timestamp gate to avoid running
    // on every scroll event.
    useEffect(() => {
        const sectionIds = flatNav.map((item) => item.sectionId);
        let last = 0;

        const onScroll = () => {
            const now = Date.now();
            if (now - last < SPY_INTERVAL) return;
            last = now;
            setActiveSection(getActiveSection(sectionIds));
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [flatNav]);

    // Open the command palette on Cmd/Ctrl+K. Closes on Escape (handled
    // inside the palette). Ignores the shortcut while the mobile menu or an
    // input/textarea/contentEditable is focused to avoid hijacking typing.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const isModifier = event.metaKey || event.ctrlKey;
            if (!isModifier || event.key.toLowerCase() !== "k") return;
            const target = event.target as HTMLElement | null;
            const isTyping =
                !!target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable);
            if (isTyping && !paletteOpen) return;
            event.preventDefault();
            setPaletteOpen((open) => !open);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [paletteOpen]);

    const openPalette = useCallback(() => setPaletteOpen(true), []);
    const closePalette = useCallback(() => setPaletteOpen(false), []);

    // Build the command list: navigation and social links.
    const commands = useMemo<CommandItem[]>(() => {
        const nav: CommandItem[] = flatNav.map((item) => ({
            id: `nav-${item.sectionId}`,
            label: item.label,
            group: "Navigation",
            keywords: [],
            icon: <item.icon className="h-4 w-4" />,
            onSelect: () => scrollToSection(item.sectionId),
        }));

        const links: CommandItem[] = socials.map((social) => ({
            id: `social-${social.id}`,
            label: social.label,
            group: "Links",
            keywords: [social.handle, social.command],
            onSelect: () => {
                window.open(social.url, "_blank", "noopener,noreferrer");
            },
        }));

        return [...nav, ...links];
    }, [flatNav]);

    return (
        <>
            <ScrollProgress progress={progress} />

            <header className="pointer-events-none fixed inset-x-0 top-3 z-[55] flex justify-center px-4">
                <motion.nav
                    aria-label="Primary"
                    animate={
                        reduced
                            ? undefined
                            : {
                                  paddingTop: scrolled ? 8 : 12,
                                  paddingBottom: scrolled ? 8 : 12,
                              }
                    }
                    transition={{ duration: 0.25, ease: [0.45, 0, 0.15, 1] }}
                    className={cn(
                        "pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl px-5",
                        "transition-all duration-slow ease-smooth",
                        scrolled
                            ? "glass-surface-strong shadow-glass"
                            : "glass-surface shadow-xs",
                    )}
                >
                    <Logo
                        scrolled={scrolled}
                        siteName={siteName}
                        userAtHost={userAtHost}
                    />

                    <NavList activeSection={activeSection} items={navItems} />

                    <div className="flex items-center gap-1">
                        <CommandButton onClick={openPalette} />
                        <span
                            aria-hidden="true"
                            className="h-6 w-px bg-border-subtle md:hidden"
                        />
                        <Hamburger
                            open={menuOpen}
                            onClick={() => setMenuOpen((v) => !v)}
                            className="md:hidden"
                        />
                    </div>
                </motion.nav>
            </header>

            <MobileMenu
                open={menuOpen}
                activeSection={activeSection}
                items={navItems}
                onClose={() => setMenuOpen(false)}
                onOpenSearch={openPalette}
            />

            <CommandPalette
                isOpen={paletteOpen}
                onClose={closePalette}
                commands={commands}
                placeholder="Search sections, actions, links…"
                title="Command palette"
            />
        </>
    );
}

Navbar.displayName = "Navbar";
