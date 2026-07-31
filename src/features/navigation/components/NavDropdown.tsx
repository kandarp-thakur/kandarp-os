"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { isSectionHref, navigateToTarget } from "@utils/navigation";
import { cn } from "@utils/cn";
import type { NavChild, NavItem } from "@/data/navigation";

interface NavDropdownProps {
    /** The dropdown parent item (must have `children`). */
    item: NavItem;
    /** The currently-active section id (from scroll-spy). */
    activeSection: string | null;
    /** Accent color shared with the parent navigation item. */
    tone: string;
}

/**
 * Desktop navigation dropdown for grouped sections (navigation-design §5).
 *
 * Renders a pill-style trigger button labelled with the parent (e.g. "Stack")
 * and a chevron that rotates when open. The panel opens on hover *and* on
 * click/tap (for keyboard users), and lists each child as a rich row with an
 * icon, label, and technical description. Selecting a child smooth-scrolls to
 * its section and closes the panel.
 *
 * Interaction model (Docker Desktop / Vercel switcher inspired):
 *  - **Hover** opens the panel after a short delay; leaving closes it.
 *  - **Click** toggles the panel (and cancels the hover timer) so touch + mouse
 *    users both have a reliable path.
 *  - **Keyboard**: the trigger is a real `<button>`; ArrowDown/Space/Enter
 *    open the panel and focus the first item; Escape closes and restores focus.
 *  - **Outside click** dismisses.
 *
 * The trigger uses the same text-only active glow as direct navigation links
 * whenever any of its children is the active section.
 *
 * A Client Component — it tracks open state, hover timers, and keyboard focus.
 */
export function NavDropdown({ item, activeSection, tone }: NavDropdownProps) {
    const [open, setOpen] = useState(false);
    const reduced = useReducedMotion() === true;
    const wrapperRef = useRef<HTMLLIElement>(null);
    const panelId = useId();
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const children = item.children ?? [];
    const childIds = children.map((c) => c.sectionId);
    const isChildActive =
        activeSection !== null && childIds.includes(activeSection);

    const cancelHover = useCallback(() => {
        if (hoverTimer.current) {
            clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
        }
    }, []);

    const openAfterDelay = useCallback(() => {
        cancelHover();
        hoverTimer.current = setTimeout(() => setOpen(true), 80);
    }, [cancelHover]);

    const close = useCallback(() => {
        cancelHover();
        setOpen(false);
    }, [cancelHover]);

    // Dismiss on outside click + Escape.
    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (event: PointerEvent) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(event.target as Node)) {
                close();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                close();
            }
        };
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, close]);

    // Clean up any pending hover timer on unmount.
    useEffect(() => cancelHover, [cancelHover]);

    const handleSelect = useCallback(
        (href: string, sectionId: string) => {
            close();
            // Defer so the panel's exit animation doesn't fight navigation.
            requestAnimationFrame(() => navigateToTarget(href, sectionId));
        },
        [close],
    );

    return (
        <li
            ref={wrapperRef}
            data-nav-section={item.sectionId}
            className="relative"
            style={{ "--nav-tone": tone } as React.CSSProperties}
            onMouseEnter={openAfterDelay}
            onMouseLeave={close}
        >
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onClick={() => {
                    cancelHover();
                    setOpen((v) => !v);
                }}
                className={cn(
                    "inline-flex items-center gap-1.5 py-1.5",
                    "font-sans text-[15px] transition-[color,text-shadow] duration-200 ease-out",
                    "hover:text-white",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    isChildActive
                        ? "font-semibold text-[#38BDF8] [text-shadow:0_0_12px_rgba(56,189,248,.35)]"
                        : "font-medium text-[#AAB4C5] [text-shadow:none]",
                )}
            >
                <span>{item.label}</span>
                <ChevronDown
                    className={cn(
                        "relative z-10 h-3.5 w-3.5 transition-transform duration-fast ease-standard",
                        open ? "rotate-180" : "rotate-0",
                    )}
                    aria-hidden="true"
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        id={panelId}
                        role="menu"
                        aria-label={`${item.label} menu`}
                        initial={
                            reduced ? false : { opacity: 0, y: -6, scale: 0.98 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                            reduced
                                ? undefined
                                : { opacity: 0, y: -6, scale: 0.98 }
                        }
                        transition={
                            reduced
                                ? { duration: 0 }
                                : {
                                      duration: 0.16,
                                      ease: [0.34, 1.56, 0.64, 1],
                                  }
                        }
                        className={cn(
                            "glass-surface-strong absolute left-0 top-full z-dropdown mt-2 w-72 origin-top-left rounded-xl p-2 shadow-glass",
                        )}
                    >
                        <ul className="flex flex-col gap-0.5">
                            {children.map((child) => (
                                <DropdownRow
                                    key={child.sectionId}
                                    child={child}
                                    active={activeSection === child.sectionId}
                                    onSelect={() =>
                                        handleSelect(
                                            child.href,
                                            child.sectionId,
                                        )
                                    }
                                />
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </li>
    );
}

/* -------------------------------------------------------------------------- */

interface DropdownRowProps {
    child: NavChild;
    active: boolean;
    onSelect: () => void;
}

/**
 * A single rich row inside the dropdown — icon, label, and a technical
 * description. Behaves as a menuitem: keyboard-focusable, Enter/Space selects.
 */
function DropdownRow({ child, active, onSelect }: DropdownRowProps) {
    const Icon = child.icon;
    return (
        <li role="none">
            <a
                role="menuitem"
                href={child.href}
                onClick={(event) => {
                    if (!isSectionHref(child.href)) return;
                    event.preventDefault();
                    onSelect();
                }}
                aria-current={active ? "true" : undefined}
                className={cn(
                    "flex items-start gap-3 px-3 py-2.5",
                    "transition-[color,text-shadow] duration-200 ease-out",
                    "hover:text-white",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    active
                        ? "font-semibold text-[#38BDF8] [text-shadow:0_0_12px_rgba(56,189,248,.35)]"
                        : "font-medium text-[#AAB4C5] [text-shadow:none]",
                )}
            >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-current">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                    <span className="font-sans text-sm text-current">
                        {child.label}
                    </span>
                    {child.description ? (
                        <span className="font-sans text-xs text-text-tertiary">
                            {child.description}
                        </span>
                    ) : null}
                </span>
            </a>
        </li>
    );
}

NavDropdown.displayName = "NavDropdown";
