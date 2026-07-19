"use client";

/**
 * AdminCommandPalette — the global search + navigation modal.
 *
 * Opens with ⌘K / Ctrl+K. Debounced search hits the /api/admin/search
 * endpoint and also shows quick navigation links. Arrow-key navigable.
 */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { ALL_NAV_ITEMS } from "@features/admin/components/nav-config";
import { cn } from "@utils/cn";

interface SearchHit {
    id: string;
    title: string;
    subtitle?: string;
    type: string;
    href: string;
}

interface AdminCommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

export function AdminCommandPalette({
    open,
    onClose,
}: AdminCommandPaletteProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchHit[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    // Focus the input when opened.
    useEffect(() => {
        if (open) {
            setQuery("");
            setResults([]);
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Debounced search.
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/admin/search?q=${encodeURIComponent(query)}&limit=10`,
                );
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.results ?? []);
                    setActiveIndex(0);
                }
            } catch {
                // Silent fail — search is non-critical.
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation.
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, totalItems - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
                e.preventDefault();
                const item = allItems[activeIndex];
                if (item) {
                    router.push(item.href);
                    onClose();
                }
            }
        },
        [onClose, router, activeIndex],
    );

    if (!open) return null;

    // Combine nav items (when no query) with search results.
    const navHits: SearchHit[] = ALL_NAV_ITEMS.map((item) => ({
        id: item.href,
        title: item.label,
        type: "navigation",
        href: item.href,
    }));

    const allItems = query.trim() ? results : navHits;
    const totalItems = allItems.length;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh]">
            {/* Scrim */}
            <div
                className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--canvas-elevated)] shadow-2xl">
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4">
                    <Search className="h-5 w-5 text-[var(--text-tertiary)]" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search content or navigate…"
                        className="flex-1 bg-transparent py-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-quaternary)]"
                    />
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Results */}
                <div className="admin-scroll max-h-[50vh] overflow-y-auto p-2">
                    {allItems.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-[var(--text-tertiary)]">
                            {query.trim()
                                ? "No results found."
                                : "Start typing to search…"}
                        </p>
                    ) : (
                        <ul className="space-y-0.5">
                            {!query.trim() && (
                                <li className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-quaternary)]">
                                    Quick Navigation
                                </li>
                            )}
                            {allItems.map((item, index) => (
                                <li key={`${item.id}-${index}`}>
                                    <button
                                        onMouseEnter={() =>
                                            setActiveIndex(index)
                                        }
                                        onClick={() => {
                                            router.push(item.href);
                                            onClose();
                                        }}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                                            index === activeIndex
                                                ? "bg-[var(--accent-subtle)]"
                                                : "hover:bg-[var(--overlay-hover)]",
                                        )}
                                    >
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                                {item.title}
                                            </p>
                                            {item.subtitle && (
                                                <p className="truncate text-xs text-[var(--text-tertiary)]">
                                                    {item.subtitle}
                                                </p>
                                            )}
                                        </div>
                                        <span className="shrink-0 rounded-md bg-[var(--canvas-sunken)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                                            {item.type}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-2.5 text-[11px] text-[var(--text-quaternary)]">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="rounded border border-[var(--border-default)] bg-[var(--canvas-sunken)] px-1">
                                ↑↓
                            </kbd>
                            navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="rounded border border-[var(--border-default)] bg-[var(--canvas-sunken)] px-1">
                                ↵
                            </kbd>
                            select
                        </span>
                    </div>
                    <span>ESC to close</span>
                </div>
            </div>
        </div>
    );
}
