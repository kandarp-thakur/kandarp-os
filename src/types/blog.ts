import { z } from "zod";

/**
 * Type definitions for the Blog systemd journal.
 *
 * Zod schemas are the source of truth; types are inferred. Mirrors the
 * journal-entry data model defined in blog-page-design.md (§17): each post
 * is a "journal entry" with a timestamp (date), a unit (category as a
 * systemd `<name>.service`), a syslog priority (post level), a PID (post id),
 * tags (log tags), a computed reading time, and a Markdown body. The index
 * reads like `journalctl --reverse` — a reverse-chronological log stream of
 * glass entries.
 *
 * Posts are authored as `.mdx` files under `content/blog/` with YAML
 * frontmatter. The loader (`src/lib/blog.ts`) parses frontmatter with
 * `gray-matter`, validates it against these schemas, and derives the
 * reading time + headings from the body — no backend, fully static.
 */

/**
 * A systemd unit — the blog's category vocabulary (blog-page-design §6.2).
 * Each unit maps to a `<name>.service` and carries a semantic tint used by
 * the priority dot + unit chip.
 */
export const blogUnitSchema = z.enum([
    "devops",
    "docker",
    "linux",
    "networking",
    "aws",
    "python",
    "career",
    "life",
    "research",
    "support",
]);
export type BlogUnit = z.infer<typeof blogUnitSchema>;

/**
 * A syslog priority — the post's level (blog-page-design §7.2).
 * `info` (standard), `notice` (featured / highlighted), `debug` (deep dive).
 */
export const blogPrioritySchema = z.enum(["info", "notice", "debug"]);
export type BlogPriority = z.infer<typeof blogPrioritySchema>;

/**
 * A single heading auto-derived from the post body for the table of
 * contents (blog-page-design §13). `level` is 2 or 3 (H2/H3); `id` is the
 * slugified text used as the anchor target.
 */
export const blogHeadingSchema = z.object({
    /** Slugified heading text — the anchor `id`. */
    id: z.string(),
    /** Raw heading text. */
    text: z.string(),
    /** Heading level — 2 (H2) or 3 (H3). */
    level: z.number().int().min(2).max(3),
});
export type BlogHeading = z.infer<typeof blogHeadingSchema>;

/**
 * A single post represented as a systemd journal entry.
 * Timestamped, unit-tagged, priority-leveled, and inspectable — writing as
 * a persistent, queryable log.
 */
export const blogPostSchema = z.object({
    /** URL slug — the post path (`/blog/<slug>`). */
    slug: z.string(),
    /** Post title. */
    title: z.string(),
    /** Category as a systemd unit, e.g. `devops` → `devops.service`. */
    unit: blogUnitSchema,
    /** Post level — `info` (standard), `notice` (featured), `debug` (deep dive). */
    priority: blogPrioritySchema,
    /** Publish date as ISO `YYYY-MM-DD`. */
    date: z.string(),
    /** Post ID — shown as `[PID]` in the journalctl metadata row. */
    pid: z.number().int(),
    /** 1–2 sentence summary (entry excerpt). */
    excerpt: z.string(),
    /** Log tags — cross-cutting `#tag` markers for filtering + related posts. */
    tags: z.array(z.string()),
    /** Reading time in minutes (computed from the body word count, §9.2). */
    readingTime: z.number().int().min(1),
    /** Raw Markdown/MDX body source. */
    body: z.string(),
    /** Headings auto-derived from the body for the TOC (§13). */
    headings: z.array(blogHeadingSchema),
    /** If true, excluded from the stream + not routed. */
    draft: z.boolean().default(false),
});
export type BlogPost = z.infer<typeof blogPostSchema>;

/**
 * A post stripped of its body — the lightweight shape used by the index
 * stream, related-entries cards, and tag pages. Keeps the metadata needed
 * to render an entry without shipping the full Markdown to the client list.
 */
export const blogPostMetaSchema = blogPostSchema.omit({ body: true });
export type BlogPostMeta = z.infer<typeof blogPostMetaSchema>;

/** A unit registry entry — the category vocabulary + its semantic tint (§6.2). */
export const blogUnitRegistrySchema = z.object({
    /** Unit key, e.g. `devops`. */
    key: blogUnitSchema,
    /** Display label, e.g. `DevOps`. */
    label: z.string(),
    /** Full systemd unit name, e.g. `devops.service`. */
    unit: z.string(),
    /** Semantic tint used by the priority dot + unit chip. */
    tint: z.enum(["accent", "info", "success", "warning", "cloud"]),
    /** One-line description of the unit. */
    description: z.string(),
});
export type BlogUnitRegistry = z.infer<typeof blogUnitRegistrySchema>;

/** A tag with its post count — used by the tag cloud + tag index (§8.3). */
export const blogTagCountSchema = z.object({
    /** The tag (kebab-case, no `#`). */
    tag: z.string(),
    /** Number of posts carrying this tag. */
    count: z.number().int().min(1),
});
export type BlogTagCount = z.infer<typeof blogTagCountSchema>;

/** A journal summary stat rendered as a glass pill below the page header (§2.3). */
export const blogStatSchema = z.object({
    /** Stat key — used to color the value. */
    key: z.enum(["entries", "units", "tags", "words"]),
    label: z.string(),
    value: z.string(),
});
export type BlogStat = z.infer<typeof blogStatSchema>;
