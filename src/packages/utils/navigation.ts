/**
 * Navigation helpers for the single-page anchor experience.
 *
 * Navigation is anchor-based: every link smooth-scrolls to a `#section-id`
 * on the home page. Active-state highlighting is driven by scroll position
 * (scroll-spy) rather than the URL pathname, since all sections share one
 * route (`/`).
 *
 * The navbar is a flat list of top-level links (About, Projects, Experience,
 * Skills, Infrastructure, Blog, Contact). Consumers that need a flat, ordered
 * list of every scrollable destination (scroll-spy, command
 * palette, footer) use [`flattenNavItems`](#flattennavitems); it expands any
 * dropdown parents into their children and passes direct links through.
 */

import type { NavChild, NavItem } from "@/data/navigation";

const SCROLL_DURATION_MS = 700;
let activeScrollFrame: number | null = null;

/** Returns whether a navigation href targets a section on the home page. */
export function isSectionHref(href: string): boolean {
    return href.startsWith("#");
}

/**
 * Navigates to either a home-page section or a regular route.
 *
 * Section links scroll in place when their target is mounted. When used from a
 * standalone route, they navigate back to the matching section on the home
 * page. Route and external links use normal browser navigation.
 */
export function navigateToTarget(href: string, sectionId: string): void {
    if (typeof window === "undefined") return;

    if (!isSectionHref(href)) {
        const sectionHref = href.replace(/^\//, "");
        const targetId = sectionHref || sectionId;
        const target = document.getElementById(targetId);
        if (target) {
            scrollToSection(targetId);
        }
        return;
    }

    const target = document.getElementById(sectionId);
    if (!target) return;

    // Update the address in place before scrolling. This preserves native
    // Back/Forward semantics without triggering a route transition or reload;
    // the observer remains the sole owner of the active visual state.
    const hash = `#${sectionId}`;
    if (window.location.hash !== hash) {
        window.history.pushState(
            { ...window.history.state, sectionId },
            "",
            hash,
        );
    }
    scrollToSection(sectionId);
}

/**
 * Smooth-scrolls to a section anchor, accounting for the fixed navbar
 * height. Falls back to a native jump when the target is missing or when
 * reduced motion is preferred.
 *
 * @param sectionId - The element id (without `#`) to scroll to.
 * @param navbarOffset - Pixels of navbar height to offset the scroll target.
 */
export function scrollToSection(sectionId: string, navbarOffset = 100): void {
    if (typeof document === "undefined") return;
    const el = document.getElementById(sectionId);
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    const start = window.scrollY;
    const top = Math.max(
        0,
        el.getBoundingClientRect().top + start - navbarOffset,
    );

    if (activeScrollFrame !== null) cancelAnimationFrame(activeScrollFrame);
    if (prefersReducedMotion) {
        window.scrollTo({ top, behavior: "auto" });
        activeScrollFrame = null;
        return;
    }

    const distance = top - start;
    const startedAt = performance.now();
    const step = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / SCROLL_DURATION_MS);
        const eased =
            progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, start + distance * eased);

        if (progress < 1) activeScrollFrame = requestAnimationFrame(step);
        else activeScrollFrame = null;
    };

    activeScrollFrame = requestAnimationFrame(step);
}

/**
 * Determines which section is currently "active" based on scroll position.
 *
 * The active section is the one whose top has scrolled past the navbar
 * offset line. We pick the last section whose top is above the offset line;
 * if none qualify (near the top), the first section is active.
 *
 * Order-independent: the section ids are sorted by their actual document
 * position before walking the list, so active detection remains correct if
 * navigation configuration and document order diverge.
 *
 * @param sectionIds - List of section ids to observe (any order).
 * @param offset - Pixels from the top of the viewport that counts as "active".
 * @returns The active section id, or `null` if none are in view.
 */
export function getActiveSection(
    sectionIds: readonly string[],
    offset = 120,
): string | null {
    if (typeof document === "undefined") return null;

    // Collect each section's current viewport position so active detection is
    // independent of the order the ids were passed in. Sort by actual document
    // position before walking the list.
    const positioned: { id: string; top: number }[] = [];
    for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        positioned.push({ id, top: el.getBoundingClientRect().top });
    }
    if (positioned.length === 0) return sectionIds[0] ?? null;

    positioned.sort((a, b) => a.top - b.top);

    let active: string | null = null;
    for (const { id, top } of positioned) {
        if (top <= offset) {
            active = id;
        } else {
            break;
        }
    }
    return active ?? positioned[0]?.id ?? null;
}

/**
 * Expands the navigation tree into a flat, ordered list of every scrollable
 * destination.
 *
 * Dropdown parents (items with `children`) are replaced by their children in
 * document order; direct links are kept as-is. This is the canonical list for
 * scroll-spy observation, the command palette, and the footer link row — all
 * of which need every section id, not just the top-level entries.
 *
 * @param items - The top-level navigation items (may include dropdowns).
 * @returns A flat ordered list of leaf navigation entries.
 */
export function flattenNavItems(items: readonly NavItem[]): NavChild[] {
    const out: NavChild[] = [];
    for (const item of items) {
        if (item.children && item.children.length > 0) {
            out.push(...item.children);
        } else {
            out.push({
                label: item.label,
                href: item.href,
                sectionId: item.sectionId,
                icon: item.icon,
            });
        }
    }
    return out;
}
