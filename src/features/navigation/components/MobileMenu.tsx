"use client";

import { useEffect, useRef, useState } from "react";
import {
    AnimatePresence,
    motion,
    useReducedMotion,
    type Variants,
} from "framer-motion";
import { ChevronDown, Search, X } from "lucide-react";

import { Logo } from "@features/navigation/components/Logo";
import { scrollToSection } from "@utils/navigation";
import { socials } from "@/data/socials";
import type { NavChild, NavItem } from "@/data/navigation";
import { cn } from "@utils/cn";

interface MobileMenuProps {
    /** Whether the menu is open. */
    open: boolean;
    /** The currently-active section id (from scroll-spy). */
    activeSection: string | null;
    /** The full set of nav items. */
    items: NavItem[];
    /** Close the menu (hamburger toggle, link tap, Escape, scrim tap). */
    onClose: () => void;
    /** Open the command palette / search from within the menu. */
    onOpenSearch: () => void;
}

/**
 * Full-screen glass mobile menu (navigation-design §8).
 *
 * Slides in from the right with a scrim behind it. While open it locks body
 * scroll, traps focus within the panel, and restores focus to the hamburger on
 * close. Links stagger in on open; reduced motion renders everything instantly.
 *
 * Navigation is anchor-based: each link smooth-scrolls to its section on the
 * single home page. The scroll is deferred to the next frame so the menu's
 * body-scroll lock releases before the scroll fires.
 */
export function MobileMenu({
    open,
    activeSection,
    items,
    onClose,
    onOpenSearch,
}: MobileMenuProps) {
    const reduced = useReducedMotion() === true;
    const panelRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    // Lock body scroll + restore focus while the menu is open.
    useEffect(() => {
        if (!open) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        closeBtnRef.current?.focus();

        const { overflow } = document.body.style;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = overflow;
            previouslyFocused?.focus?.();
        };
    }, [open]);

    // Focus trap + Escape to close.
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
                return;
            }
            if (event.key === "Tab" && panelRef.current) {
                const focusables = Array.from(
                    panelRef.current.querySelectorAll<HTMLElement>(
                        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
                    ),
                );
                if (focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (!first || !last) return;
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    return (
        <motion.div
            initial={false}
            animate={open ? "open" : "closed"}
            // `pointer-events-none` on the root is critical: this overlay is
            // always mounted (it animates open/closed rather than
            // mounting/unmounting) and sits at z-[70], above the navbar
            // (z-[55]) that holds the hamburger + command buttons. Without
            // this, the closed overlay's root div would capture every tap on
            // the viewport and block the hamburger from opening on mobile.
            // It is safe because `pointer-events: none` on a parent does NOT
            // disable events on children that set `pointer-events: auto` —
            // the scrim + panel still receive taps when open (via variants).
            className={cn("fixed inset-0 z-[70] md:hidden pointer-events-none")}
            aria-hidden={!open}
        >
            {/* Scrim */}
            <motion.button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                tabIndex={open ? 0 : -1}
                variants={scrimVariants}
                custom={reduced}
                className="absolute inset-0 cursor-default bg-[var(--scrim)] backdrop-blur-glass-subtle"
            />

            {/* Panel */}
            <motion.div
                ref={panelRef}
                id="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
                variants={panelVariants}
                custom={reduced}
                className="glass-surface-strong absolute inset-y-0 right-0 flex w-full max-w-sm flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4">
                    <Logo alwaysShowWordmark />
                    <button
                        ref={closeBtnRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className={cn(
                            "inline-flex h-11 w-11 items-center justify-center rounded-md text-text-primary",
                            "transition-colors duration-fast ease-standard hover:bg-overlay-hover",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                        )}
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="mx-5 h-px bg-border-subtle" />

                {/* Nav links */}
                <motion.nav
                    aria-label="Primary"
                    variants={listVariants}
                    custom={reduced}
                    className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-6"
                >
                    {items.map((item) => {
                        if (item.children && item.children.length > 0) {
                            return (
                                <MobileAccordion
                                    key={item.sectionId}
                                    item={item}
                                    activeSection={activeSection}
                                    reduced={reduced}
                                    onClose={onClose}
                                />
                            );
                        }

                        const active = activeSection === item.sectionId;
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={item.sectionId}
                                variants={itemVariants}
                                custom={reduced}
                            >
                                <a
                                    href={item.href}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onClose();
                                        // Defer the scroll until the menu
                                        // closing animation frees body scroll.
                                        requestAnimationFrame(() =>
                                            scrollToSection(item.sectionId),
                                        );
                                    }}
                                    aria-current={active ? "true" : undefined}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-4 py-3",
                                        "font-sans text-lg font-medium transition-colors duration-fast ease-standard",
                                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                        active
                                            ? "bg-accent-subtle text-accent-solid"
                                            : "text-text-secondary hover:bg-overlay-hover hover:text-text-primary",
                                    )}
                                >
                                    <Icon
                                        className="h-5 w-5 text-text-tertiary"
                                        aria-hidden="true"
                                    />
                                    {item.label}
                                </a>
                            </motion.div>
                        );
                    })}
                </motion.nav>

                <div className="mx-5 h-px bg-border-subtle" />

                {/* Search entry — opens the command palette. */}
                <div className="px-5 pt-5">
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onOpenSearch();
                        }}
                        className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-4 py-3",
                            "font-sans text-base text-text-secondary transition-colors duration-fast ease-standard",
                            "hover:bg-overlay-hover hover:text-text-primary",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                        )}
                    >
                        <Search
                            className="h-5 w-5 text-text-tertiary"
                            aria-hidden="true"
                        />
                        Search
                        <kbd
                            className="ml-auto rounded-xs border border-border-subtle bg-canvas-sunken px-1.5 py-0.5 font-mono text-2xs text-text-tertiary"
                            aria-hidden="true"
                        >
                            ⌘K
                        </kbd>
                    </button>
                </div>

                {/* Social links */}
                <div className="flex flex-wrap items-center gap-2 px-5 py-5">
                    {socials.map((social) => (
                        <a
                            key={social.id}
                            href={social.url}
                            target={
                                social.url.startsWith("mailto:")
                                    ? undefined
                                    : "_blank"
                            }
                            rel="noopener noreferrer"
                            className={cn(
                                "rounded-md px-3 py-1.5 font-sans text-sm text-text-secondary",
                                "transition-colors duration-fast ease-standard",
                                "hover:bg-overlay-hover hover:text-text-primary",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                            )}
                        >
                            {social.label}
                        </a>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

/* -------------------------------------------------------------------------- */
/* Mobile accordion — expands a dropdown parent's children (navigation §8).  */
/* -------------------------------------------------------------------------- */

interface MobileAccordionProps {
    item: NavItem;
    activeSection: string | null;
    reduced: boolean;
    onClose: () => void;
}

/**
 * Mobile-only expandable cluster for a dropdown parent (e.g. "Stack").
 *
 * A header button toggles a collapsible list of child links. The chevron
 * rotates when open; the panel height animates via Framer Motion. Selecting a
 * child smooth-scrolls to its section and closes the whole menu. The header is
 * highlighted whenever any child is the active section.
 */
function MobileAccordion({
    item,
    activeSection,
    reduced,
    onClose,
}: MobileAccordionProps) {
    const [expanded, setExpanded] = useState(false);
    const children = item.children ?? [];
    const childIds = children.map((c) => c.sectionId);
    const isChildActive =
        activeSection !== null && childIds.includes(activeSection);
    const HeaderIcon = item.icon;

    return (
        <motion.div variants={itemVariants} custom={reduced}>
            <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`mobile-accordion-${item.sectionId}`}
                onClick={() => setExpanded((v) => !v)}
                className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3",
                    "font-sans text-lg font-medium transition-colors duration-fast ease-standard",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    isChildActive
                        ? "bg-accent-subtle text-accent-solid"
                        : "text-text-secondary hover:bg-overlay-hover hover:text-text-primary",
                )}
            >
                <HeaderIcon
                    className="h-5 w-5 text-text-tertiary"
                    aria-hidden="true"
                />
                {item.label}
                <ChevronDown
                    className={cn(
                        "ml-auto h-5 w-5 text-text-tertiary transition-transform duration-slow ease-smooth",
                        expanded ? "rotate-180" : "rotate-0",
                    )}
                    aria-hidden="true"
                />
            </button>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.ul
                        id={`mobile-accordion-${item.sectionId}`}
                        initial={reduced ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduced ? undefined : { height: 0, opacity: 0 }}
                        transition={
                            reduced
                                ? { duration: 0 }
                                : { duration: 0.28, ease: [0.45, 0, 0.15, 1] }
                        }
                        className="overflow-hidden pl-4"
                    >
                        {children.map((child) => (
                            <MobileChildRow
                                key={child.sectionId}
                                child={child}
                                active={activeSection === child.sectionId}
                                onClose={onClose}
                            />
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

interface MobileChildRowProps {
    child: NavChild;
    active: boolean;
    onClose: () => void;
}

/** A single child link inside the mobile accordion. */
function MobileChildRow({ child, active, onClose }: MobileChildRowProps) {
    const Icon = child.icon;
    return (
        <li>
            <a
                href={child.href}
                onClick={(e) => {
                    e.preventDefault();
                    onClose();
                    requestAnimationFrame(() =>
                        scrollToSection(child.sectionId),
                    );
                }}
                aria-current={active ? "true" : undefined}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2.5",
                    "font-sans text-base transition-colors duration-fast ease-standard",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    active
                        ? "bg-accent-subtle text-accent-solid"
                        : "text-text-tertiary hover:bg-overlay-hover hover:text-text-primary",
                )}
            >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {child.label}
            </a>
        </li>
    );
}

/* -------------------------------------------------------------------------- */
/* Motion variants                                                           */
/* -------------------------------------------------------------------------- */

const scrimVariants: Variants = {
    closed: { opacity: 0, pointerEvents: "none" },
    open: (reduced: boolean) => ({
        opacity: 1,
        pointerEvents: "auto",
        transition: { duration: reduced ? 0 : 0.2, ease: [0, 0, 0.2, 1] },
    }),
};

const panelVariants: Variants = {
    closed: { x: "100%", pointerEvents: "none" },
    open: (reduced: boolean) => ({
        x: "0%",
        pointerEvents: "auto",
        transition: { duration: reduced ? 0 : 0.32, ease: [0.45, 0, 0.15, 1] },
    }),
};

const listVariants: Variants = {
    closed: {},
    open: (reduced: boolean) => ({
        transition: {
            delayChildren: reduced ? 0 : 0.12,
            staggerChildren: reduced ? 0 : 0.05,
        },
    }),
};

const itemVariants: Variants = {
    closed: { opacity: 0, x: 16 },
    open: (reduced: boolean) => ({
        opacity: 1,
        x: 0,
        transition: { duration: reduced ? 0 : 0.3, ease: [0, 0, 0.2, 1] },
    }),
};

MobileMenu.displayName = "MobileMenu";
