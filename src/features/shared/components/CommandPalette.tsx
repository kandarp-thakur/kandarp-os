"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";

import { cn } from "@utils/cn";

/** A single selectable command in the palette. */
export interface CommandItem {
    /** Stable unique id. */
    id: string;
    /** Label shown in the list. */
    label: string;
    /** Optional grouping label — commands with the same group are clustered. */
    group?: string;
    /** Optional leading icon. */
    icon?: ReactNode;
    /** Optional secondary hint (e.g. a shortcut). */
    hint?: ReactNode;
    /** Optional keywords used for fuzzy filtering. */
    keywords?: string[];
    /** Invoked when the command is selected (Enter or click). */
    onSelect: () => void;
}

interface CommandPaletteProps {
    /** Whether the palette is open. */
    isOpen: boolean;
    /** Called when the palette requests to close. */
    onClose: () => void;
    /** The full set of selectable commands. */
    commands: CommandItem[];
    /** Placeholder for the search field. Defaults to `"Search commands…"`. */
    placeholder?: string;
    /** Accessible title for the dialog. Defaults to `"Command palette"`. */
    title?: string;
    /** Extra classes on the panel (escape hatch). */
    className?: string;
}

const FOCUSABLE_SELECTOR =
    'button:not([disabled]), [role="option"]:not([aria-disabled="true"])';

/**
 * CommandPalette — the Cmd+K command menu (component-inventory Shared #5,
 * component-rules §10.2).
 *
 * A modal dialog with a search field and a filtered, keyboard-navigable list
 * of commands. Opens via Cmd/Ctrl+K (wired by the parent through `isOpen`),
 * closes on Escape, scrim click, or selecting a command.
 *
 * Keyboard: ↑/↓ move the active row, Enter selects it, Escape closes. The
 * active row resets to the first match whenever the query changes. The list
 * groups commands by their `group` label when provided.
 *
 * The panel is a `glass-surface-strong` card with `shadow-glass-modal` and
 * `radius-3xl`; entrance is scale-in + fade with `ease-spring`, reduced motion
 * renders instantly (ui-system §10.4).
 *
 * A Client Component — it manages query, active index, and keyboard handling.
 *
 * @example
 * <CommandPalette isOpen={open} onClose={close} commands={commands} />
 */
export function CommandPalette({
    isOpen,
    onClose,
    commands,
    placeholder = "Search commands…",
    title = "Command palette",
    className,
}: CommandPaletteProps) {
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const reduced = useReducedMotion() === true;

    // Filter + group commands by query (label + keywords, case-insensitive).
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return commands;
        return commands.filter((cmd) => {
            const haystack = [cmd.label, ...(cmd.keywords ?? [])]
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [commands, query]);

    // Reset query + active index on open.
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setActiveIndex(0);
        }
    }, [isOpen]);

    // Focus the search field on open.
    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    // Keep active index in bounds when the filtered list changes.
    useEffect(() => {
        setActiveIndex((i) => Math.min(i, Math.max(filtered.length - 1, 0)));
    }, [filtered.length]);

    // Scroll the active row into view.
    useEffect(() => {
        if (!isOpen || !listRef.current) return;
        const active =
            listRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[
                activeIndex
            ];
        active?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, isOpen]);

    const selectActive = useCallback(() => {
        const cmd = filtered[activeIndex];
        if (!cmd) return;
        cmd.onSelect();
        onClose();
    }, [filtered, activeIndex, onClose]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter") {
                event.preventDefault();
                selectActive();
            } else if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            }
        },
        [filtered.length, selectActive, onClose],
    );

    // Group filtered commands preserving order.
    const groups = useMemo(() => {
        const map = new Map<string, CommandItem[]>();
        for (const cmd of filtered) {
            const key = cmd.group ?? "";
            const list = map.get(key);
            if (list) list.push(cmd);
            else map.set(key, [cmd]);
        }
        return Array.from(map.entries());
    }, [filtered]);

    // Flatten index lookup for active-row tracking across groups.
    const flatIds = filtered.map((c) => c.id);

    // Global Escape listener — closes the palette even if focus has drifted
    // outside the panel (e.g. after clicking a command button). The React
    // onKeyDown handler only fires when a child has focus, so this window-level
    // listener is the reliable backstop.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh]"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    transition={
                        reduced
                            ? { duration: 0 }
                            : { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
                    }
                    onKeyDown={handleKeyDown}
                >
                    {/* Scrim. */}
                    <div
                        aria-hidden="true"
                        onClick={onClose}
                        // Lenis intercepts wheel events globally; exempt the scrim
                        // so scrolling inside the palette doesn't scroll the page.
                        data-lenis-prevent
                        className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-glass-subtle"
                    />

                    {/* Panel. */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        initial={
                            reduced ? false : { opacity: 0, scale: 0.96, y: 8 }
                        }
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={
                            reduced
                                ? undefined
                                : { opacity: 0, scale: 0.98, y: 4 }
                        }
                        transition={
                            reduced
                                ? { duration: 0 }
                                : { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }
                        }
                        className={cn(
                            "glass-surface-strong relative flex w-full max-w-xl flex-col overflow-hidden rounded-3xl shadow-glass-modal",
                            className,
                        )}
                    >
                        {/* Search field. */}
                        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3.5">
                            <Search
                                className="h-[18px] w-[18px] shrink-0 text-text-tertiary"
                                aria-hidden="true"
                            />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={placeholder}
                                aria-label={title}
                                aria-controls="command-list"
                                aria-autocomplete="list"
                                className="flex-1 bg-transparent font-sans text-base text-text-primary placeholder:text-text-quaternary focus:outline-none"
                            />
                            <kbd
                                className="hidden shrink-0 rounded-xs border border-border-default bg-canvas-sunken px-1.5 py-0.5 font-mono text-2xs text-text-tertiary sm:inline-block"
                                aria-hidden="true"
                            >
                                ESC
                            </kbd>
                        </div>

                        {/* Command list. */}
                        <div
                            id="command-list"
                            ref={listRef}
                            role="listbox"
                            aria-label={title}
                            // Lenis intercepts wheel events globally; exempt the
                            // results list so scrolling inside it doesn't scroll
                            // the page underneath.
                            data-lenis-prevent
                            className="max-h-80 overflow-y-auto p-2"
                        >
                            {filtered.length === 0 ? (
                                <p className="px-3 py-8 text-center font-sans text-sm text-text-tertiary">
                                    No commands found.
                                </p>
                            ) : (
                                groups.map(([group, items]) => (
                                    <div
                                        key={group || "default"}
                                        className="mb-1"
                                    >
                                        {group ? (
                                            <div className="px-3 py-1.5 font-sans text-2xs font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                                                {group}
                                            </div>
                                        ) : null}
                                        {items.map((cmd) => {
                                            const idx = flatIds.indexOf(cmd.id);
                                            const active = idx === activeIndex;
                                            return (
                                                <button
                                                    key={cmd.id}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={active}
                                                    onMouseEnter={() =>
                                                        setActiveIndex(idx)
                                                    }
                                                    onClick={selectActive}
                                                    className={cn(
                                                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left",
                                                        "font-sans text-sm transition-colors duration-fast ease-standard",
                                                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                                        active
                                                            ? "bg-accent-subtle text-accent-solid"
                                                            : "text-text-primary hover:bg-overlay-hover",
                                                    )}
                                                >
                                                    {cmd.icon ? (
                                                        <span
                                                            className="inline-flex shrink-0 text-text-tertiary"
                                                            aria-hidden="true"
                                                        >
                                                            {cmd.icon}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="h-4 w-4 shrink-0"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    <span className="flex-1 truncate">
                                                        {cmd.label}
                                                    </span>
                                                    {cmd.hint ? (
                                                        <span className="shrink-0 font-mono text-2xs text-text-tertiary">
                                                            {cmd.hint}
                                                        </span>
                                                    ) : null}
                                                    {active ? (
                                                        <CornerDownLeft
                                                            className="h-3.5 w-3.5 shrink-0 text-accent-solid"
                                                            aria-hidden="true"
                                                        />
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

CommandPalette.displayName = "CommandPalette";
