import { TagPill } from "@features/blog/components/TagPill";
import { UnitChip } from "@features/blog/components/UnitChip";
import {
    formatGrepHeader,
    formatJournalDate,
    postHref,
    tagHref,
    topSharedTag,
} from "@/lib/blogSummary";
import { cn } from "@utils/cn";
import type { BlogPostMeta } from "@packages/types/blog";

interface RelatedEntriesProps {
    /** The current post — used to derive the `--grep` term. */
    post: BlogPostMeta;
    /** Correlated entries (shared tags + unit), max 3 (§15.3). */
    related: BlogPostMeta[];
    /** Extra classes (escape hatch). */
    className?: string;
}

/** Max tags visible on a related card (§15.5). */
const MAX_TAGS = 2;

/**
 * The related-entries section — correlated by shared tags + unit
 * (blog-page-design §15).
 *
 * Renders as a `journalctl --grep`-style block: a header naming the top
 * shared tag, then a 3-column grid of compact related-entry cards. Keeps the
 * reader in the journal, hopping between connected entries.
 *
 * A Server Component — it renders no interactive UI of its own (the cards
 * are links).
 */
export function RelatedEntries({
    post,
    related,
    className,
}: RelatedEntriesProps) {
    if (related.length === 0) return null;

    const grepTerm = topSharedTag(post);

    return (
        <section
            aria-label="Related entries"
            className={cn("glass-surface mt-12 rounded-2xl p-6", className)}
        >
            <p className="mb-4 font-mono text-sm text-text-tertiary">
                <span className="text-text-secondary">$</span>{" "}
                {formatGrepHeader(grepTerm)}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {related.map((entry) => {
                    const visibleTags = entry.tags.slice(0, MAX_TAGS);
                    const overflow = entry.tags.length - visibleTags.length;
                    return (
                        <a
                            key={entry.slug}
                            href={postHref(entry.slug)}
                            className={cn(
                                "group rounded-lg border border-border-default bg-glass-bg-subtle p-3",
                                "transition-[box-shadow,transform,border-color] duration-normal ease-standard",
                                "hover:-translate-y-0.5 hover:shadow-glass-hover hover:border-accent",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                            )}
                        >
                            <div className="mb-2 flex items-center gap-2 font-mono text-xs text-text-tertiary">
                                <time dateTime={entry.date}>
                                    {formatJournalDate(entry.date)}
                                </time>
                                <span>·</span>
                                <UnitChip unit={entry.unit} />
                            </div>
                            <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-text-primary transition-colors duration-fast ease-standard group-hover:text-accent-solid">
                                {entry.title}
                            </h3>
                            <ul className="flex flex-wrap gap-1.5">
                                {visibleTags.map((tag) => (
                                    <li key={tag}>
                                        <TagPill
                                            tag={tag}
                                            href={tagHref(tag)}
                                            size="xs"
                                        />
                                    </li>
                                ))}
                                {overflow > 0 && (
                                    <li className="inline-flex items-center rounded-full bg-canvas-tint px-2 py-0.5 font-mono text-2xs text-text-tertiary">
                                        +{overflow}
                                    </li>
                                )}
                            </ul>
                        </a>
                    );
                })}
            </div>
        </section>
    );
}

RelatedEntries.displayName = "RelatedEntries";
