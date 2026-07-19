"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";

import { PriorityDot } from "@features/blog/components/PriorityDot";
import { TagPill } from "@features/blog/components/TagPill";
import { UnitChip } from "@features/blog/components/UnitChip";
import { useReducedMotion } from "@3d/hooks/useReducedMotion";
import {
    formatJournalDate,
    formatReadingTime,
    postHref,
    tagHref,
} from "@/lib/blogSummary";
import { cn } from "@utils/cn";
import type { BlogPostMeta } from "@packages/types/blog";

interface JournalEntryProps {
    /** The post metadata to render. */
    post: BlogPostMeta;
    /** Index in the list — drives the entrance stagger delay. */
    index: number;
    /** Click handler for a tag — filters the stream in place (does not navigate). */
    onTagClick?: (tag: string) => void;
    /** Click handler for a unit — filters the stream in place (does not navigate). */
    onUnitClick?: (unit: BlogPostMeta["unit"]) => void;
    /** Extra classes (escape hatch). */
    className?: string;
}

/** Max tags visible before collapsing to a `+N` overflow chip (§5.7). */
const MAX_TAGS_VISIBLE = 4;

/**
 * A single post rendered as a `journalctl`-style journal entry
 * (blog-page-design §5).
 *
 * Each entry is a hover-lifting glass card with a `journalctl` metadata row
 * (timestamp · unit[PID] · priority · reading time), a title, an excerpt,
 * and tag pills. Clicking the entry navigates to the full post; clicking a
 * tag or unit filters the stream in place (§10.1). Featured (`notice`)
 * entries get an accent left-border (§7.4).
 *
 * The whole card is a link (`<a>`) wrapping an `<article>` for semantics
 * (§21). Tags and unit chips stop propagation so they don't trigger the
 * card navigation.
 *
 * A Client Component for the entrance animation + tag/unit click handlers.
 */
export function JournalEntry({
    post,
    index,
    onTagClick,
    onUnitClick,
    className,
}: JournalEntryProps) {
    const prefersReducedMotion = useReducedMotion();
    const isFeatured = post.priority === "notice";

    const handleUnitClick = useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation();
            onUnitClick?.(post.unit);
        },
        [onUnitClick, post.unit],
    );

    const visibleTags = post.tags.slice(0, MAX_TAGS_VISIBLE);
    const overflowTags = post.tags.slice(MAX_TAGS_VISIBLE);

    // Entrance: fade up + stagger. Instant under reduced motion (§19.7).
    const entranceDelay = prefersReducedMotion ? 0 : index * 0.06;

    return (
        <motion.article
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={
                prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
            }
            viewport={{ once: true, margin: "-60px" }}
            transition={
                prefersReducedMotion
                    ? { duration: 0 }
                    : {
                          duration: 0.32,
                          ease: [0, 0, 0.2, 1],
                          delay: entranceDelay,
                      }
            }
            className={cn(
                "glass-surface group relative overflow-hidden rounded-xl",
                "px-4 py-4 sm:px-5",
                "transition-[box-shadow,transform,border-color] duration-normal ease-standard",
                "hover:-translate-y-0.5 hover:shadow-glass-hover hover:border-accent",
                isFeatured && "border-l-[3px] border-l-accent-solid",
                className,
            )}
        >
            <a
                href={postHref(post.slug)}
                aria-labelledby={`entry-${post.slug}-title`}
                className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
                {/* Metadata row — journalctl-style header (§5.4). */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-text-tertiary">
                    <time dateTime={post.date}>
                        {formatJournalDate(post.date)}
                    </time>
                    <span onClick={handleUnitClick} className="cursor-pointer">
                        <UnitChip unit={post.unit} pid={post.pid} />
                    </span>
                    <PriorityDot priority={post.priority} />
                    <span className="ml-auto">
                        {formatReadingTime(post.readingTime)}
                    </span>
                </div>

                {/* Title (§5.5). */}
                <h2
                    id={`entry-${post.slug}-title`}
                    className="mt-2 line-clamp-2 text-lg font-semibold text-text-primary transition-colors duration-fast ease-standard group-hover:text-accent-solid"
                >
                    {post.title}
                </h2>

                {/* Excerpt (§5.6). */}
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                    {post.excerpt}
                </p>
            </a>

            {/* Tags (§5.7). Tags sit outside the card link, so they never
                trigger navigation — they either filter in place (onClick) or
                link to the tag index (href). */}
            <ul className="mt-3 flex flex-wrap gap-1.5">
                {visibleTags.map((tag) => (
                    <li key={tag}>
                        <TagPill
                            tag={tag}
                            href={onTagClick ? undefined : tagHref(tag)}
                            onClick={onTagClick}
                        />
                    </li>
                ))}
                {overflowTags.length > 0 && (
                    <li
                        className="inline-flex items-center rounded-full bg-canvas-tint px-2 py-0.5 font-mono text-2xs text-text-tertiary"
                        title={overflowTags.map((t) => `#${t}`).join(" ")}
                    >
                        +{overflowTags.length}
                    </li>
                )}
            </ul>
        </motion.article>
    );
}

JournalEntry.displayName = "JournalEntry";
