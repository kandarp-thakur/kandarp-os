import { UNIT_TINT_TEXT, getUnitRegistry } from "@/data/blog";
import { formatUnitPid } from "@/lib/blogSummary";
import { cn } from "@/utils/cn";
import type { BlogUnit } from "@/types/blog";

interface UnitChipProps {
    /** The unit (category) key. */
    unit: BlogUnit;
    /** The post PID — when set, renders the full `unit.service[PID]` token. */
    pid?: number;
    /** Render as a link to the blog index filtered by this unit. */
    href?: string;
    /** Click handler — when set, the chip is a button that filters in place. */
    onClick?: (unit: BlogUnit) => void;
    /** Active state — the chip is the current filter. */
    active?: boolean;
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * A systemd-unit chip — the blog's category marker (blog-page-design §6.3).
 *
 * Renders the unit as `<name>.service` (or `<name>.service[PID]` when a pid
 * is given) in `font-mono`, tinted to the unit's semantic color. Used both as
 * a filter chip in the filter bar (button/link) and as a read-only token in
 * the journal-entry metadata row.
 *
 * A Server Component when used as a link; becomes a Client Component only
 * when the parent passes an `onClick`.
 */
export function UnitChip({
    unit,
    pid,
    href,
    onClick,
    active = false,
    className,
}: UnitChipProps) {
    const registry = getUnitRegistry(unit);
    const tintText = UNIT_TINT_TEXT[registry.tint];
    const label = pid !== undefined ? formatUnitPid(unit, pid) : registry.unit;

    const classes = cn(
        "inline-flex items-center font-mono text-xs",
        "transition-colors duration-fast ease-standard",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        active ? "font-medium" : "hover:opacity-80",
        tintText,
        className,
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={() => onClick(unit)}
                aria-pressed={active}
                aria-label={`filter by unit: ${registry.unit}`}
                className={classes}
            >
                {label}
            </button>
        );
    }

    if (href) {
        return (
            <a
                href={href}
                className={classes}
                aria-label={`filter by unit: ${registry.unit}`}
            >
                {label}
            </a>
        );
    }

    return (
        <span className={classes} aria-label={`unit: ${registry.unit}`}>
            {label}
        </span>
    );
}

UnitChip.displayName = "UnitChip";
