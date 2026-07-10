import { SITE } from "@/utils/constants";
import type {
    BlogPost,
    BlogPostMeta,
    BlogPriority,
    BlogUnit,
} from "@/types/blog";

/**
 * Blog summary helpers (blog-page-design §2, §5, §12).
 *
 * Pure formatting utilities kept in the lib layer so the page + components
 * stay thin. Mirrors the projectsSummary.ts / experienceSummary.ts pattern:
 * a heading helper for the sr-only semantic section + small formatting
 * helpers for the journalctl metadata rows (timestamps, units, priorities,
 * reading time).
 */

/** The page heading — used by the visual header + the sr-only section. */
export function blogHeading(): string {
    return "Engineering Journal";
}

/** The sr-only intro line for the blog semantic section. */
export function blogIntro(): string {
    return `${SITE.owner}'s engineering writing rendered as a systemd journal — every post a journal entry, every category a unit, every search a grep.`;
}

/**
 * Format an ISO `YYYY-MM-DD` date as a `journalctl`-style short timestamp
 * (blog-page-design §5.4): `Jul 06 2024`. Uses UTC to stay deterministic
 * across the server build and the client.
 */
export function formatJournalDate(iso: string): string {
    const date = new Date(`${iso}T00:00:00Z`);
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const month = months[date.getUTCMonth()] ?? "???";
    const day = String(date.getUTCDate()).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${month} ${day} ${year}`;
}

/**
 * Format a unit key as a systemd unit name (§6.1): `devops` → `devops.service`.
 */
export function formatUnit(unit: BlogUnit): string {
    return `${unit}.service`;
}

/**
 * Format a unit + pid as a `journalctl`-style unit token (§5.4):
 * `devops.service[1042]`.
 */
export function formatUnitPid(unit: BlogUnit, pid: number): string {
    return `${formatUnit(unit)}[${pid}]`;
}

/** Reading-time display string (§9.3): `8 min read`. */
export function formatReadingTime(minutes: number): string {
    return `${minutes} min read`;
}

/** Priority dot + label (§7.3): `● notice`. */
export function formatPriority(priority: BlogPriority): string {
    return `● ${priority}`;
}

/** The `journalctl --grep` header for the related-entries section (§15.4). */
export function formatGrepHeader(term: string): string {
    return `$ journalctl --grep "${term}"`;
}

/** The post URL: `/blog/<slug>`. */
export function postHref(slug: string): string {
    return `/blog/${slug}`;
}

/** The tag-filtered index URL: `/blog/tags/<tag>`. */
export function tagHref(tag: string): string {
    return `/blog/tags/${tag}`;
}

/**
 * The top shared tag between a post and its related entries — used as the
 * `--grep` term in the related-entries header (§15.4). Falls back to the
 * post's unit if it has no tags.
 */
export function topSharedTag(post: BlogPost | BlogPostMeta): string {
    return post.tags[0] ?? post.unit;
}
