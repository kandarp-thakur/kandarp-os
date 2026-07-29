import type { LucideIcon } from "lucide-react";
import {
    Award,
    Boxes,
    GitBranch,
    Network,
    ScrollText,
    TerminalSquare,
    Wrench,
} from "lucide-react";

import { SECTIONS, sectionHref } from "@utils/constants";

/**
 * A leaf navigation entry — a single scrollable destination. Used both as a
 * standalone top-level link and as a child inside a dropdown.
 *
 * `icon` is rendered in the mobile menu and the desktop dropdown; `description`
 * is an optional technical one-liner shown beneath the label in dropdowns.
 */
export interface NavChild {
    label: string;
    /** Anchor href (`#section-id`) for in-page smooth-scroll navigation. */
    href: string;
    /** The section id this link targets — used by scroll-spy. */
    sectionId: string;
    icon: LucideIcon;
    /** Optional technical descriptor shown under the label in dropdowns. */
    description?: string;
}

/**
 * A primary navigation entry. Navigation is anchor-based — every link
 * smooth-scrolls to a section on the single home page (`#id`).
 *
 * When `children` is present the item renders as a **dropdown** (e.g. "Stack")
 * whose trigger is a button; otherwise it is a direct anchor link (e.g. "Logs").
 * `shortLabel` is shown on smaller desktop screens to prevent overflow.
 */
export interface NavItem {
    label: string;
    /** Compact label shown below `lg` to prevent overflow. */
    shortLabel?: string;
    /** Anchor href (`#section-id`). For dropdown parents this points at the
     *  first child so the data stays a valid scroll target. */
    href: string;
    /** The section id this item represents — used by scroll-spy. For dropdown
     *  parents this is the first child's id. */
    sectionId: string;
    icon: LucideIcon;
    /** When present, this item renders as a dropdown containing these children. */
    children?: NavChild[];
}

/**
 * Primary navigation links — clean, professional, and intuitive for every
 * visitor (recruiters, clients, and engineers alike).
 *
 * Navigation is anchor-based — every link smooth-scrolls to a section on the
 * single home page (`#id`). All entries are flat top-level links (no
 * dropdowns), ordered for clarity with the primary content first:
 *
 *   ∞ root@kandarp
 *     ├─ Experience      → Deployment History
 *     ├─ Projects        → Running Containers (project fleet, `docker ps`)
 *     ├─ Toolkit         → Service mesh of skills
 *     ├─ Infrastructure  → Cloud topology & nodes
 *     ├─ Achievements    → Unlocked badges & milestones
 *     ├─ Logs            → Engineering Logs (Blog)
 *     └─ SSH             → Interactive Contact Terminal
 *
 * The DevOps theme is expressed through each section's design and
 * interactions (container rows, `docker inspect` panels, topology maps) — not
 * through the navigation labels, which stay plain and universally understood.
 * "Running Containers" is the internal heading of the Projects section, never
 * a navigation label.
 *
 * Note: the nav order need not match the document order (Projects leads the
 * nav but sits mid-page, after Experience). Scroll-spy resolves active state
 * by actual element position, not by nav order.
 */
export const navItems: NavItem[] = [
    {
        label: "Projects",
        shortLabel: "Projects",
        href: sectionHref(SECTIONS.containers),
        sectionId: SECTIONS.containers,
        icon: Boxes,
    },
    {
        label: "Experience",
        shortLabel: "Exp",
        href: sectionHref(SECTIONS.deployments),
        sectionId: SECTIONS.deployments,
        icon: GitBranch,
    },
    {
        label: "Toolkit",
        shortLabel: "Toolkit",
        href: sectionHref(SECTIONS.toolkit),
        sectionId: SECTIONS.toolkit,
        icon: Wrench,
    },
    {
        label: "Infrastructure",
        shortLabel: "Infra",
        href: sectionHref(SECTIONS.infrastructure),
        sectionId: SECTIONS.infrastructure,
        icon: Network,
    },
    {
        label: "Achievements",
        shortLabel: "Awards",
        href: sectionHref(SECTIONS.achievements),
        sectionId: SECTIONS.achievements,
        icon: Award,
    },
    {
        label: "Logs",
        href: sectionHref(SECTIONS.logs),
        sectionId: SECTIONS.logs,
        icon: ScrollText,
    },
    {
        label: "SSH",
        href: sectionHref(SECTIONS.ssh),
        sectionId: SECTIONS.ssh,
        icon: TerminalSquare,
    },
];
