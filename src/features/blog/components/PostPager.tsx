import { formatJournalDate, postHref } from "@/lib/blogSummary";
import { UnitChip } from "@features/blog/components/UnitChip";
import { cn } from "@utils/cn";
import type { BlogPostMeta } from "@packages/types/blog";

interface PostPagerProps {
    /** The older (previous) entry, or `null` at the start of the journal. */
    previous: BlogPostMeta | null;
    /** The newer (next) entry, or `null` at the end of the journal. */
    next: BlogPostMeta | null;
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * The prev/next pager — chronological navigation between journal entries
 * (blog-page-design §16).
 *
 * A flex row with `← Previous` on the left and `Next →` on the right. Each
 * slot shows the direction, the date + unit, and the title. A missing slot
 * (first/last post) is hidden rather than disabled (§16.3).
 *
 * A Server Component — the slots are links.
 */
export function PostPager({ previous, next, className }: PostPagerProps) {
    if (!previous && !next) return null;

    return (
        <nav
            aria-label="Post navigation"
            className={cn(
                "glass-surface mt-8 flex flex-col gap-4 rounded-lg p-4 sm:flex-row sm:justify-between",
                className,
            )}
        >
            {previous ? (
                <a
                    href={postHref(previous.slug)}
                    className={cn(
                        "group flex flex-col gap-1 rounded-md p-2",
                        "transition-colors duration-fast ease-standard",
                        "hover:bg-overlay-hover",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                        "sm:flex-1 sm:text-left",
                    )}
                >
                    <span className="font-mono text-xs text-text-tertiary">
                        ← Previous entry
                    </span>
                    <span className="font-mono text-xs text-text-tertiary">
                        {formatJournalDate(previous.date)} ·{" "}
                        <UnitChip unit={previous.unit} />
                    </span>
                    <span className="text-sm font-semibold text-text-primary transition-colors duration-fast ease-standard group-hover:text-accent-solid">
                        {previous.title}
                    </span>
                </a>
            ) : (
                <span
                    className="hidden sm:block sm:flex-1"
                    aria-hidden="true"
                />
            )}

            {next ? (
                <a
                    href={postHref(next.slug)}
                    className={cn(
                        "group flex flex-col gap-1 rounded-md p-2",
                        "transition-colors duration-fast ease-standard",
                        "hover:bg-overlay-hover",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                        "sm:flex-1 sm:text-right",
                    )}
                >
                    <span className="font-mono text-xs text-text-tertiary">
                        Next entry →
                    </span>
                    <span className="font-mono text-xs text-text-tertiary">
                        {formatJournalDate(next.date)} ·{" "}
                        <UnitChip unit={next.unit} />
                    </span>
                    <span className="text-sm font-semibold text-text-primary transition-colors duration-fast ease-standard group-hover:text-accent-solid">
                        {next.title}
                    </span>
                </a>
            ) : (
                <span
                    className="hidden sm:block sm:flex-1"
                    aria-hidden="true"
                />
            )}
        </nav>
    );
}

PostPager.displayName = "PostPager";
