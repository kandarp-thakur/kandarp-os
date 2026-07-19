"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";

import { JournalEntry } from "@features/blog/components/JournalEntry";
import { TagPill } from "@features/blog/components/TagPill";
import { UnitChip } from "@features/blog/components/UnitChip";
import { useReducedMotion } from "@3d/hooks/useReducedMotion";
import { cn } from "@utils/cn";
import type { BlogPostMeta, BlogUnit } from "@packages/types/blog";

interface JournalStreamProps {
    /** All post metadata, newest-first. */
    posts: BlogPostMeta[];
    /** Units that have at least one post, with counts. */
    units: { unit: BlogUnit; count: number }[];
    /** All tags with counts, most-frequent first. */
    tags: { tag: string; count: number }[];
    /** Initial page size + load-more increment (§10.5). */
    pageSize?: number;
    /** Extra classes (escape hatch). */
    className?: string;
}

/** Search debounce (ms) — §3.4. */
const SEARCH_DEBOUNCE_MS = 150;

/** Max tags visible in the tag cloud before a `+N tags` link (§3.5). */
const MAX_TAGS_VISIBLE = 12;

/**
 * The journal stream dashboard (blog-page-design §3–§5).
 *
 * Orchestrates the `journalctl`-style index: a filter bar (unit chips + a
 * `grep` search + a tag cloud), the stream header, the journal entries, an
 * empty state, and a `--cursor`-style load-more button.
 *
 * Unit AND tag AND search apply together (§3.6). Search is debounced. The
 * load-more reveals the next `pageSize` entries (§10.5). All filtering is
 * client-side over the static post list — no backend.
 *
 * A Client Component because it owns the filter/search/pagination state.
 */
export function JournalStream({
    posts,
    units,
    tags,
    pageSize = 10,
    className,
}: JournalStreamProps) {
    const prefersReducedMotion = useReducedMotion();
    const [unitFilter, setUnitFilter] = useState<BlogUnit | "all">("all");
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce the search term (§3.4).
    const handleSearchChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setSearchInput(value);
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => {
                setSearchTerm(value);
            }, SEARCH_DEBOUNCE_MS);
        },
        [],
    );

    // Combined filter: unit AND tag AND grep across title, excerpt, tags, unit (§3.6).
    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return posts.filter((post) => {
            if (unitFilter !== "all" && post.unit !== unitFilter) return false;
            if (tagFilter !== null && !post.tags.includes(tagFilter))
                return false;
            if (!term) return true;
            return (
                post.title.toLowerCase().includes(term) ||
                post.excerpt.toLowerCase().includes(term) ||
                post.unit.toLowerCase().includes(term) ||
                post.tags.some((tag) => tag.toLowerCase().includes(term))
            );
        });
    }, [posts, unitFilter, tagFilter, searchTerm]);

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    const handleUnitClick = useCallback(
        (unit: BlogUnit) => {
            setUnitFilter((prev) => (prev === unit ? "all" : unit));
            setVisibleCount(pageSize);
        },
        [pageSize],
    );

    const handleTagClick = useCallback(
        (tag: string) => {
            setTagFilter((prev) => (prev === tag ? null : tag));
            setVisibleCount(pageSize);
        },
        [pageSize],
    );

    const handleLoadMore = useCallback(() => {
        setVisibleCount((prev) => prev + pageSize);
    }, [pageSize]);

    const visibleTags = tags.slice(0, MAX_TAGS_VISIBLE);
    const overflowTagCount = Math.max(0, tags.length - MAX_TAGS_VISIBLE);

    return (
        <section
            aria-label="Journal stream"
            className={cn("w-full", className)}
        >
            {/* Filter bar — unit chips + grep search + tag cloud (§3). */}
            <div className="glass-surface mb-6 flex flex-col gap-3 rounded-xl p-2.5">
                {/* Unit chips + search row. */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Unit chips. */}
                    <div
                        role="group"
                        aria-label="Filter entries by unit"
                        className="flex flex-1 flex-wrap gap-1.5"
                    >
                        <button
                            type="button"
                            aria-pressed={unitFilter === "all"}
                            onClick={() => {
                                setUnitFilter("all");
                                setVisibleCount(pageSize);
                            }}
                            className={cn(
                                "rounded-md px-3 py-1.5 font-mono text-2xs uppercase tracking-[0.1em]",
                                "transition-colors duration-fast ease-standard",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                unitFilter === "all"
                                    ? "bg-accent-subtle font-medium text-accent-solid"
                                    : "text-text-secondary hover:bg-overlay-hover",
                            )}
                        >
                            All
                        </button>
                        {units.map(({ unit, count }) => (
                            <span
                                key={unit}
                                className="inline-flex items-center gap-1.5"
                            >
                                <UnitChip
                                    unit={unit}
                                    onClick={handleUnitClick}
                                    active={unitFilter === unit}
                                />
                                <span className="font-mono text-2xs text-text-quaternary">
                                    {count}
                                </span>
                            </span>
                        ))}
                    </div>

                    {/* Grep search. */}
                    <div className="relative sm:w-64">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={searchInput}
                            onChange={handleSearchChange}
                            placeholder="grep ..."
                            aria-label="Search entries"
                            className={cn(
                                "h-9 w-full rounded-md border border-border-subtle bg-transparent pl-9 pr-3",
                                "font-mono text-sm text-text-primary placeholder:text-text-quaternary",
                                "transition-colors duration-fast ease-standard",
                                "focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                            )}
                        />
                    </div>
                </div>

                {/* Active filter chips — removable (§10.4). */}
                {(unitFilter !== "all" || tagFilter !== null || searchTerm) && (
                    <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2.5">
                        <span className="font-mono text-2xs uppercase tracking-[0.1em] text-text-tertiary">
                            filter:
                        </span>
                        {unitFilter !== "all" && (
                            <button
                                type="button"
                                onClick={() => {
                                    setUnitFilter("all");
                                    setVisibleCount(pageSize);
                                }}
                                className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2.5 py-0.5 font-mono text-2xs text-accent-solid transition-colors duration-fast ease-standard hover:bg-accent-subtle/70"
                            >
                                {unitFilter}.service
                                <span aria-hidden="true">×</span>
                            </button>
                        )}
                        {tagFilter !== null && (
                            <button
                                type="button"
                                onClick={() => {
                                    setTagFilter(null);
                                    setVisibleCount(pageSize);
                                }}
                                className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2.5 py-0.5 font-mono text-2xs text-accent-solid transition-colors duration-fast ease-standard hover:bg-accent-subtle/70"
                            >
                                #{tagFilter}
                                <span aria-hidden="true">×</span>
                            </button>
                        )}
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput("");
                                    setSearchTerm("");
                                    setVisibleCount(pageSize);
                                }}
                                className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2.5 py-0.5 font-mono text-2xs text-accent-solid transition-colors duration-fast ease-standard hover:bg-accent-subtle/70"
                            >
                                grep {'"'}
                                {searchTerm}
                                {'"'}
                                <span aria-hidden="true">×</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Tag cloud (§3.5). */}
                {visibleTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2.5">
                        {visibleTags.map(({ tag }) => (
                            <TagPill
                                key={tag}
                                tag={tag}
                                onClick={handleTagClick}
                                active={tagFilter === tag}
                                size="xs"
                            />
                        ))}
                        {overflowTagCount > 0 && (
                            <Link
                                href="/blog/tags"
                                className="font-mono text-2xs text-text-tertiary transition-colors duration-fast ease-standard hover:text-accent-solid"
                            >
                                +{overflowTagCount} tags
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Stream container (§4.2). */}
            <div className="glass-surface rounded-2xl p-4">
                {/* Stream header — journalctl columns (§4.3). */}
                <div
                    aria-hidden="true"
                    className="mb-3 flex items-center gap-4 border-b border-border-subtle pb-2 font-mono text-2xs uppercase tracking-[0.1em] text-text-tertiary"
                >
                    <span>Timestamp</span>
                    <span>Unit</span>
                    <span>Priority</span>
                    <span className="ml-auto">Entry</span>
                </div>

                {/* Entries. */}
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {visible.map((post, index) => (
                            <motion.div
                                key={post.slug}
                                layout={!prefersReducedMotion}
                                initial={
                                    prefersReducedMotion
                                        ? false
                                        : { opacity: 0 }
                                }
                                animate={{ opacity: 1 }}
                                exit={
                                    prefersReducedMotion
                                        ? undefined
                                        : { opacity: 0 }
                                }
                                transition={
                                    prefersReducedMotion
                                        ? { duration: 0 }
                                        : {
                                              duration: 0.2,
                                              ease: [0.4, 0, 1, 1],
                                          }
                                }
                            >
                                <JournalEntry
                                    post={post}
                                    index={index}
                                    onTagClick={handleTagClick}
                                    onUnitClick={handleUnitClick}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty state (§3.6). */}
                    {filtered.length === 0 && (
                        <div className="rounded-xl px-5 py-10 text-center">
                            <p className="font-mono text-sm text-text-tertiary">
                                <span className="text-text-secondary">$</span>{" "}
                                journalctl
                            </p>
                            <p className="mt-2 text-sm text-text-secondary">
                                No entries match.
                            </p>
                        </div>
                    )}
                </div>

                {/* Load more — journalctl --cursor (§10.5). */}
                {hasMore && filtered.length > 0 && (
                    <div className="mt-4 flex flex-col items-center gap-2 border-t border-border-subtle pt-4">
                        <p className="font-mono text-2xs text-text-tertiary">
                            <span className="text-text-secondary">$</span>{" "}
                            journalctl --reverse --cursor=...
                        </p>
                        <button
                            type="button"
                            onClick={handleLoadMore}
                            className={cn(
                                "rounded-md px-4 py-2 font-mono text-xs",
                                "border border-border-default text-text-secondary",
                                "transition-colors duration-fast ease-standard",
                                "hover:border-accent hover:text-accent-solid",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                            )}
                        >
                            Load{" "}
                            {Math.min(pageSize, filtered.length - visibleCount)}{" "}
                            more entries
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

JournalStream.displayName = "JournalStream";
