"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
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

import { NavList } from "@features/navigation/components/NavList";
import { Hamburger } from "@features/navigation/components/Hamburger";
import { MobileMenu } from "@features/navigation/components/MobileMenu";
import { CommandButton } from "@features/navigation/components/CommandButton";
import {
    CommandPalette,
    type CommandItem,
} from "@features/shared/components/CommandPalette";
import { navItems as defaultNavItems } from "@/data/navigation";
import { socials as defaultSocials } from "@/data/socials";
import type {
    NavItem as AdminNavItem,
    SocialLink as AdminSocialLink,
} from "@backend/schemas/types";
import { flattenNavItems, navigateToTarget } from "@utils/navigation";
import { SECTIONS } from "@utils/constants";
import { cn } from "@utils/cn";

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
const NAVIGATION_ORDER = [
    "about",
    "experience",
    "projects",
    "skills",
    "infrastructure",
    "achievements",
    "blog",
    "contact",
] as const;

const PUBLIC_ROUTE_SECTIONS: Record<string, string> = {
    about: SECTIONS.whoami,
    experience: SECTIONS.deployments,
    projects: SECTIONS.containers,
    skills: SECTIONS.toolkit,
    infrastructure: SECTIONS.infrastructure,
    achievements: SECTIONS.achievements,
    blog: SECTIONS.logs,
    contact: SECTIONS.ssh,
};

function sectionIdFromHref(href: string): string {
    if (href.startsWith("#")) return href.slice(1);

    const path = href.split(/[?#]/, 1)[0]?.replace(/^\/+|\/+$/g, "") ?? "";
    return (
        PUBLIC_ROUTE_SECTIONS[path] ??
        path.replaceAll("/", "-") ??
        SECTIONS.hero
    );
}

function sectionHrefFromHref(href: string): string {
    if (href.startsWith("#")) return href;
    const sectionId = sectionIdFromHref(href);
    return Object.values(PUBLIC_ROUTE_SECTIONS).includes(sectionId)
        ? `#${sectionId}`
        : href;
}

function resolveAdminNav(items: AdminNavItem[]): typeof defaultNavItems {
    const resolvedBySection = new Map(
        items
            .filter((item) => item.visible)
            .map((item) => {
                const sectionId = sectionIdFromHref(item.href);
                return [
                    sectionId,
                    {
                        href: sectionHrefFromHref(item.href),
                        sectionId,
                        icon: ICON_MAP[item.icon ?? ""] ?? GitBranch,
                    },
                ] as const;
            }),
    );

    // The public navbar is a fixed single-page contract. CMS values may supply
    // icons/targets, but cannot hide, rename, or reorder primary destinations.
    return defaultNavItems.map((fallback) => ({
        ...fallback,
        ...resolvedBySection.get(fallback.sectionId),
        label:
            fallback.sectionId === SECTIONS.toolkit ? "Skills" : fallback.label,
        shortLabel:
            fallback.sectionId === SECTIONS.toolkit
                ? "Skills"
                : fallback.shortLabel,
        href: `#${fallback.sectionId}`,
        sectionId: fallback.sectionId,
        children: undefined,
    }));
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

/** Fixed navbar compensation used by scrolling and the IntersectionObserver. */
const NAVBAR_OFFSET = 100;

/**
 * The primary navigation bar (navigation-design §1–§9).
 *
 * A floating glass pill that sticks to the top of the viewport. It is
 * scroll-aware: at rest it is a subtle, taller glass surface; past 80px of
 * scroll it shrinks and strengthens its glass + shadow. On mobile the links
 * collapse into a full-screen glass menu.
 *
 * Navigation is anchor-based: links smooth-scroll to sections on the single
 * home page. Active-state highlighting is driven by scroll position
 * (scroll-spy) rather than the URL pathname.
 *
 * The right cluster hosts a Ctrl+K search trigger (opens the command palette),
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
    const host = userAtHost ?? "root@kandarp";
    const identityName = siteName ?? "Kandarp OS";

    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    // Hero is the single active fallback until the observer reports the first
    // genuinely visible section.
    const [activeSection, setActiveSection] = useState<string>(SECTIONS.hero);
    const activeSectionRef = useRef<string>(SECTIONS.hero);
    const historyTargetRef = useRef<string | null>(null);

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

    // Keep all eight destinations in the same canonical order as the page.
    const primaryNavItems = useMemo(
        () =>
            NAVIGATION_ORDER.map((sectionId) =>
                navItems.find((item) => item.sectionId === sectionId),
            ).filter(
                (item): item is (typeof navItems)[number] => item !== undefined,
            ),
        [navItems],
    );

    // The flattened nav tree — every scrollable destination, in order. Used by
    // scroll-spy and the command palette so dropdown children are observable
    // and searchable, not just the top-level entries.
    const flatNav = useMemo(
        () => flattenNavItems(primaryNavItems),
        [primaryNavItems],
    );

    // Toggle the scrolled state past the threshold. Avoid scheduling a React
    // update when the threshold state has not changed during a scroll.
    useEffect(() => {
        const onScroll = () => {
            const next = window.scrollY > SCROLL_THRESHOLD;
            setScrolled((previous) => (previous === next ? previous : next));
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // IntersectionObserver owns the scroll-spy. A 0.55 threshold makes an
    // active section genuinely visible before the prompt moves.
    useEffect(() => {
        const sectionIds = [
            SECTIONS.hero,
            ...flatNav.map((item) => item.sectionId),
        ];
        const sections = sectionIds
            .map((id) => document.getElementById(id))
            .filter((section): section is HTMLElement => section !== null);
        if (sections.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                const next = visible[0]?.target.id;
                if (!next || next === activeSectionRef.current) return;

                const historyTarget = historyTargetRef.current;
                if (historyTarget && next === historyTarget) {
                    historyTargetRef.current = null;
                }
                activeSectionRef.current = next;
                setActiveSection(next);
                if (historyTarget) return;

                const hash = `#${next}`;
                if (window.location.hash !== hash) {
                    window.history.replaceState(
                        { ...window.history.state, sectionId: next },
                        "",
                        hash,
                    );
                }
            },
            { threshold: 0.55 },
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, [flatNav]);

    // Hash navigation is handled without a route transition. Back/Forward
    // restores the corresponding section and keeps the active state in sync.
    useEffect(() => {
        const handleHistoryNavigation = () => {
            const sectionId = window.location.hash.slice(1);
            if (sectionId && document.getElementById(sectionId)) {
                historyTargetRef.current = sectionId;
                window.requestAnimationFrame(() => {
                    import("@utils/navigation").then(({ scrollToSection }) =>
                        scrollToSection(sectionId, NAVBAR_OFFSET),
                    );
                });
            } else if (!sectionId) {
                historyTargetRef.current = SECTIONS.hero;
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        };

        handleHistoryNavigation();
        window.addEventListener("popstate", handleHistoryNavigation);
        return () => {
            window.removeEventListener("popstate", handleHistoryNavigation);
        };
    }, []);

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
            onSelect: () => navigateToTarget(item.href, item.sectionId),
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
    }, [flatNav, socials]);

    return (
        <>
            <header className="pointer-events-none fixed inset-x-0 top-4 z-[55] flex justify-center px-3 sm:px-4">
                <LayoutGroup id="primary-navigation">
                    <motion.nav
                        aria-label="Primary"
                        animate={reduced ? undefined : { y: scrolled ? -1 : 0 }}
                        transition={{ duration: 0.2, ease: [0.45, 0, 0.15, 1] }}
                        className={cn(
                            "terminal-navbar pointer-events-auto w-[95%] rounded-[18px] px-3 sm:px-5 lg:px-6",
                            "transition-all duration-200 ease-out",
                            scrolled ? "terminal-navbar-scrolled" : "",
                        )}
                    >
                        <div className="terminal-desktop-titlebar hidden min-h-[58px] items-center gap-4 md:flex">
                            <a
                                href={`#${SECTIONS.hero}`}
                                aria-label={`${identityName} home`}
                                className="terminal-identity group flex min-w-0 shrink-0 items-center gap-2 rounded-lg px-1 py-1"
                                onClick={(event) => {
                                    event.preventDefault();
                                    navigateToTarget(
                                        `#${SECTIONS.hero}`,
                                        SECTIONS.hero,
                                    );
                                }}
                            >
                                <span
                                    className="terminal-lights"
                                    aria-hidden="true"
                                >
                                    <i className="terminal-light terminal-light-close" />
                                    <i className="terminal-light terminal-light-minimize" />
                                    <i className="terminal-light terminal-light-zoom" />
                                </span>
                                <span className="font-mono text-xs tracking-tight text-gradient">
                                    {host}:~$
                                </span>
                            </a>
                            <NavList
                                activeSection={activeSection}
                                items={primaryNavItems}
                                className="!flex flex-1 items-center justify-center"
                            />
                            <CommandButton
                                onClick={openPalette}
                                className="shrink-0"
                            />
                        </div>

                        <div className="terminal-mobile-row flex items-center justify-between py-2 md:hidden">
                            <a
                                href={`#${SECTIONS.hero}`}
                                aria-label={`${identityName} home`}
                                className="terminal-identity group flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1"
                                onClick={(event) => {
                                    event.preventDefault();
                                    navigateToTarget(
                                        `#${SECTIONS.hero}`,
                                        SECTIONS.hero,
                                    );
                                }}
                            >
                                <span
                                    className="terminal-lights"
                                    aria-hidden="true"
                                >
                                    <i className="terminal-light terminal-light-close" />
                                    <i className="terminal-light terminal-light-minimize" />
                                    <i className="terminal-light terminal-light-zoom" />
                                </span>
                                <span className="font-mono text-sm tracking-tight text-gradient">
                                    {host}:~$
                                </span>
                            </a>
                            <div className="flex items-center gap-2">
                                <CommandButton onClick={openPalette} />
                                <Hamburger
                                    open={menuOpen}
                                    onClick={() => setMenuOpen((v) => !v)}
                                />
                            </div>
                        </div>
                    </motion.nav>
                </LayoutGroup>
            </header>

            <MobileMenu
                open={menuOpen}
                activeSection={activeSection}
                items={primaryNavItems}
                onClose={() => setMenuOpen(false)}
                onOpenSearch={openPalette}
            />

            <CommandPalette
                isOpen={paletteOpen}
                onClose={closePalette}
                commands={commands}
                placeholder="Run command..."
                title="Command palette"
            />
        </>
    );
}

Navbar.displayName = "Navbar";
