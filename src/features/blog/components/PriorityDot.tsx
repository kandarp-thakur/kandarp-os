import { PRIORITY_STYLES } from "@/data/blog";
import { cn } from "@utils/cn";
import type { BlogPriority } from "@packages/types/blog";

interface PriorityDotProps {
    /** The syslog priority — `info`, `notice`, or `debug`. */
    priority: BlogPriority;
    /** Show the label next to the dot (§7.3). Defaults to `true`. */
    showLabel?: boolean;
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * The syslog priority indicator — a colored dot + lowercase label
 * (blog-page-design §7.3).
 *
 * `info` (gray, standard), `notice` (accent, featured), `debug` (blue, deep
 * dive). The dot is never color-alone — it always carries a text label for
 * accessibility (§21). Used in the journal-entry metadata row and the post
 * header.
 *
 * A Server Component — it renders no interactive UI of its own.
 */
export function PriorityDot({
    priority,
    showLabel = true,
    className,
}: PriorityDotProps) {
    const style = PRIORITY_STYLES[priority];

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 font-mono text-xs",
                style.text,
                className,
            )}
            aria-label={`priority: ${style.label}`}
        >
            <span
                className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)}
                role="img"
                aria-hidden="true"
            />
            {showLabel && <span>{style.label}</span>}
        </span>
    );
}

PriorityDot.displayName = "PriorityDot";
