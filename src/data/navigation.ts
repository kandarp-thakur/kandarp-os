import type { LucideIcon } from "lucide-react";
import {
    Award,
    Boxes,
    GitBranch,
    Info,
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
 * Primary navigation links, ordered to mirror the page's scrolling sequence:
 * About → Experience → Projects → Toolkit → Infrastructure → Achievements →
 * Blog → Contact.
 */
export const navItems: NavItem[] = [
    {
        label: "About",
        shortLabel: "About",
        href: sectionHref(SECTIONS.whoami),
        sectionId: SECTIONS.whoami,
        icon: Info,
    },
    {
        label: "Experience",
        shortLabel: "Exp",
        href: sectionHref(SECTIONS.deployments),
        sectionId: SECTIONS.deployments,
        icon: GitBranch,
    },
    {
        label: "Projects",
        shortLabel: "Projects",
        href: sectionHref(SECTIONS.containers),
        sectionId: SECTIONS.containers,
        icon: Boxes,
    },
    {
        label: "Skills",
        shortLabel: "Skills",
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
        label: "Blog",
        href: sectionHref(SECTIONS.logs),
        sectionId: SECTIONS.logs,
        icon: ScrollText,
    },
    {
        label: "Contact",
        href: sectionHref(SECTIONS.ssh),
        sectionId: SECTIONS.ssh,
        icon: TerminalSquare,
    },
];
