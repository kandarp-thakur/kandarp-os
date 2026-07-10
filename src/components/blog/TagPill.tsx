import { cn } from "@/utils/cn";

interface TagPillProps {
    /** The tag (kebab-case, no `#`). */
    tag: string;
    /** Render as a link to the tag-filtered index (`/blog/tags/<tag>`). */
    href?: string;
    /** Click handler — when set, the pill is a button that filters in place. */
    onClick?: (tag: string) => void;
    /** Active state — the pill is the current filter. */
    active?: boolean;
    /** Extra classes (escape hatch). */
    className?: string;
    /** Size preset. Defaults to `"sm"`. */
    size?: "sm" | "xs";
}

/**
 * A `#tag` mono pill — the blog's log-tag marker (blog-page-design §8.2).
 *
 * Renders as a link (to the tag index) by default, a button (when `onClick`
 * is set, for in-place stream filtering), or a static span (when neither).
 * Active state tints the pill to the accent. Tags are kebab-case and always
 * carry the `#` prefix for color-independence (§21).
 *
 * A Server Component when used as a link; becomes a Client Component only
 * when the parent passes an `onClick`.
 */
export function TagPill({
    tag,
    href,
    onClick,
    active = false,
    className,
    size = "sm",
}: TagPillProps) {
    const sizeClass =
        size === "xs" ? "text-2xs px-2 py-0.5" : "text-xs px-2.5 py-1";

    const classes = cn(
        "inline-flex items-center rounded-full font-mono",
        "transition-colors duration-fast ease-standard",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        sizeClass,
        active
            ? "bg-accent-subtle text-accent-solid"
            : "bg-accent-subtle/60 text-accent-solid hover:bg-accent-subtle hover:text-accent-hover",
        className,
    );

    const content = (
        <>
            <span aria-hidden="true">#</span>
            {tag}
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={() => onClick(tag)}
                aria-pressed={active}
                aria-label={`tag: ${tag}`}
                className={classes}
            >
                {content}
            </button>
        );
    }

    if (href) {
        return (
            <a href={href} className={classes} aria-label={`tag: ${tag}`}>
                {content}
            </a>
        );
    }

    return (
        <span className={classes} aria-label={`tag: ${tag}`}>
            {content}
        </span>
    );
}

TagPill.displayName = "TagPill";
