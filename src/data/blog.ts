import {
    blogStatSchema,
    blogUnitRegistrySchema,
    type BlogPriority,
    type BlogStat,
    type BlogUnit,
    type BlogUnitRegistry,
} from "@/types/blog";

/**
 * Blog static data — the systemd-unit registry + journal stats
 * (blog-page-design §6.2, §2.3).
 *
 * The unit registry is the blog's category vocabulary. Each unit maps to a
 * `<name>.service` and carries a semantic tint used by the priority dot and
 * the unit chip. The stats are the `journalctl --disk-usage`-style summary
 * pills rendered below the page header.
 *
 * Post-derived data (the actual entries, tag counts, word totals) lives in
 * `src/lib/blog.ts` and is computed from the `.mdx` content at build time;
 * this file holds only the static, hand-authored registry + stat labels.
 */

/**
 * The systemd-unit registry — the blog's category vocabulary (§6.2).
 * Order is the chip order in the filter bar.
 */
const rawUnits = [
    {
        key: "devops",
        label: "DevOps",
        unit: "devops.service",
        tint: "accent",
        description: "CI/CD, pipelines, automation, culture",
    },
    {
        key: "docker",
        label: "Docker",
        unit: "docker.service",
        tint: "info",
        description: "Containers, images, builds, compose",
    },
    {
        key: "linux",
        label: "Linux",
        unit: "linux.service",
        tint: "success",
        description: "Kernel, shell, filesystem, systemd",
    },
    {
        key: "networking",
        label: "Networking",
        unit: "networking.service",
        tint: "info",
        description: "TCP/IP, DNS, routing, service mesh",
    },
    {
        key: "aws",
        label: "AWS",
        unit: "aws.service",
        tint: "warning",
        description: "Cloud, IaC, services, architecture",
    },
    {
        key: "python",
        label: "Python",
        unit: "python.service",
        tint: "success",
        description: "Language, libraries, patterns",
    },
    {
        key: "career",
        label: "Career",
        unit: "career.service",
        tint: "accent",
        description: "Growth, roles, mentoring, leadership",
    },
    {
        key: "life",
        label: "Life",
        unit: "life.service",
        tint: "cloud",
        description: "Reflections, philosophy, off-topic",
    },
    {
        key: "research",
        label: "Research",
        unit: "research.service",
        tint: "info",
        description: "Experiments, deep dives, papers",
    },
    {
        key: "support",
        label: "Support",
        unit: "support.service",
        tint: "warning",
        description: "On-call, incidents, postmortems, SRE",
    },
] satisfies BlogUnitRegistry[];

export const BLOG_UNITS: BlogUnitRegistry[] = rawUnits.map((u) =>
    blogUnitRegistrySchema.parse(u),
);

/** Look up a unit registry entry by its key. */
export function getUnitRegistry(unit: BlogUnit): BlogUnitRegistry {
    return (
        BLOG_UNITS.find((u) => u.key === unit) ?? {
            key: unit,
            label: unit,
            unit: `${unit}.service`,
            tint: "accent",
            description: "",
        }
    );
}

/**
 * Tailwind text-color class per unit tint — used by the unit chip + the
 * unit token in the journalctl metadata row (§6.3).
 */
export const UNIT_TINT_TEXT: Record<BlogUnitRegistry["tint"], string> = {
    accent: "text-accent-solid",
    info: "text-info",
    success: "text-success",
    warning: "text-warning",
    cloud: "text-[#38BDF8] dark:text-[#60C7FF]",
};

/**
 * Tailwind dot-color class per unit tint — the solid status dot (§6.3).
 */
export const UNIT_TINT_DOT: Record<BlogUnitRegistry["tint"], string> = {
    accent: "bg-accent-solid",
    info: "bg-info",
    success: "bg-success",
    warning: "bg-warning",
    cloud: "bg-[#38BDF8]",
};

/**
 * Priority styling — the syslog priority dot + label color (§7.2).
 * `info` (gray, standard), `notice` (accent, featured), `debug` (blue, deep dive).
 */
export const PRIORITY_STYLES: Record<
    BlogPriority,
    { dot: string; text: string; label: string }
> = {
    info: {
        dot: "bg-text-tertiary",
        text: "text-text-tertiary",
        label: "info",
    },
    notice: {
        dot: "bg-accent-solid",
        text: "text-accent-solid",
        label: "notice",
    },
    debug: {
        dot: "bg-info",
        text: "text-info",
        label: "debug",
    },
};

/**
 * Journal summary stats — the `journalctl --disk-usage`-style pills (§2.3).
 * The numeric values are placeholders; the page replaces `entries`, `units`,
 * `tags`, and `words` with live counts derived from the content at render
 * time. Kept here so the labels + keys stay the single source of truth.
 */
const rawStats = [
    { key: "entries", label: "Entries", value: "0" },
    { key: "units", label: "Units", value: "0" },
    { key: "tags", label: "Tags", value: "0" },
    { key: "words", label: "Words", value: "0" },
] satisfies BlogStat[];

export const BLOG_STAT_LABELS: BlogStat[] = rawStats.map((s) =>
    blogStatSchema.parse(s),
);

/** Format a word count as a compact `128k`-style string (§2.3). */
export function formatWordCount(words: number): string {
    if (words >= 1_000_000) return `${(words / 1_000_000).toFixed(1)}M`;
    if (words >= 1_000) return `${(words / 1_000).toFixed(0)}k`;
    return String(words);
}
