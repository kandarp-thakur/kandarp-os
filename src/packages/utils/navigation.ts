/**
 * Navigation helpers for the single-page anchor experience.
 *
 * Navigation is anchor-based: every link smooth-scrolls to a `#section-id`
 * on the home page. Active-state highlighting is driven by scroll position
 * (scroll-spy) rather than the URL pathname, since all sections share one
 * route (`/`).
 *
 * The navbar is a flat list of top-level links (Projects, Experience,
 * Toolkit, Infrastructure, Achievements, Logs, SSH). Consumers that need a
 * flat, ordered list of every scrollable destination (scroll-spy, command
 * palette, footer) use [`flattenNavItems`](#flattennavitems); it expands any
 * dropdown parents into their children and passes direct links through.
 */

import type { NavChild, NavItem } from "@/data/navigation";

/**
 * Smooth-scrolls to a section anchor, accounting for the fixed navbar
 * height. Falls back to a native jump when the target is missing or when
 * reduced motion is preferred.
 *
 * @param sectionId - The element id (without `#`) to scroll to.
 * @param navbarOffset - Pixels of navbar height to offset the scroll target.
 */
export function scrollToSection(sectionId: string, navbarOffset = 80): void {
    if (typeof document === "undefined") return;
    const el = document.getElementById(sectionId);
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    const top = el.getBoundingClientRect().top + window.scrollY - navbarOffset;

    window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
    });
}

/**
 * Determines which section is currently "active" based on scroll position.
 *
 * The active section is the one whose top has scrolled past the navbar
 * offset line. We pick the last section whose top is above the offset line;
 * if none qualify (near the top), the first section is active.
 *
 * Order-independent: the section ids are sorted by their actual document
 * position before walking the list, so the active detection is correct even
 * when the navigation order does not match the page order (e.g. Projects leads
 * the nav but follows Experience on the page).
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
    // independent of the order the ids were passed in. The navigation order
    // (e.g. Projects first) need not match the document order (Experience
    // precedes Projects on the page), so we sort by actual position before
    // walking the list.
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
