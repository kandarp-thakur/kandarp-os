import { cn } from "@/utils/cn";

/**
 * A single summary stat rendered as a glass pill.
 */
export interface StatPill {
    /**
     * Stable key used for React keys + color lookup. Falls back to `label`
     * when omitted (e.g. the experience page keys by label).
     */
    key?: string;
    /** Human-readable label, e.g. `Running`, `Entries`. */
    label: string;
    /** Stat value (string to allow `1.2k` / `99.99%` formatting). */
    value: string;
}

interface StatPillsProps {
    /** The stats to render, in order. */
    stats: StatPill[];
    /**
     * Optional map from stat key → Tailwind text-color class, used to tint
     * the value (e.g. `running` → `text-success`). Keys missing from the map
     * fall back to `text-text-primary`.
     */
    colorByKey?: Record<string, string>;
    /** Extra classes on the list element. */
    className?: string;
    /** Extra classes on each pill. */
    pillClassName?: string;
    /** Override the value font-size class. Defaults to `text-base`. */
    valueSizeClassName?: string;
}

/**
 * StatPills — the shared "summary stats" row (component-inventory §shared).
 *
 * Renders a flex-wrap list of glass pills, each a bold mono value beside an
 * uppercase mono label. This exact markup was duplicated across the blog,
 * projects, experience, skills, and infrastructure pages; centralizing it
 * keeps the visual treatment identical and removes ~5 copies of the same JSX.
 *
 * The value color is driven by an optional `colorByKey` map keyed on the
 * stat's `key` (falling back to `label`). Pages that don't tint values
 * (experience) simply omit the map.
 *
 * A Server Component — it is pure presentational markup with no interactivity.
 */
export function StatPills({
    stats,
    colorByKey,
    className,
    pillClassName,
    valueSizeClassName = "text-base",
}: StatPillsProps) {
    return (
        <ul className={cn("flex flex-wrap gap-2.5", className)}>
            {stats.map((stat) => {
                const key = stat.key ?? stat.label;
                const valueColor = colorByKey?.[key] ?? "text-text-primary";
                return (
                    <li
                        key={key}
                        className={cn(
                            "glass-surface flex items-baseline gap-2 rounded-lg px-3 py-2",
                            pillClassName,
                        )}
                    >
                        <span
                            className={cn(
                                "font-mono font-semibold",
                                valueSizeClassName,
                                valueColor,
                            )}
                        >
                            {stat.value}
                        </span>
                        <span className="font-mono text-2xs uppercase tracking-[0.1em] text-text-tertiary">
                            {stat.label}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

StatPills.displayName = "StatPills";
