import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import GithubSlugger from "github-slugger";

import {
    blogPostSchema,
    type BlogHeading,
    type BlogPost,
    type BlogPostMeta,
} from "@/types/blog";

/**
 * Blog content loader — the static MDX pipeline (blog-page-design §17).
 *
 * Posts are authored as `.mdx` files under `content/blog/` with YAML
 * frontmatter. This module reads them at build time (Node `fs`), parses the
 * frontmatter with `gray-matter`, validates each entry against the Zod
 * schema, and derives the reading time + table-of-contents headings from the
 * body. No backend — everything is static, resolved when Next.js builds the
 * route segment.
 *
 * The loader is only ever imported from Server Components / `generateStaticParams`
 * / `generateMetadata`, so the `fs` calls run on the server at build time.
 */

/** Absolute path to the blog content directory. */
const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

/** Words-per-minute used to compute reading time (blog-page-design §9.2). */
const WORDS_PER_MINUTE = 200;

/**
 * Extract H2/H3 headings from a Markdown/MDX body and slugify their text for
 * anchor ids (blog-page-design §13.2). Uses `github-slugger` so the ids match
 * the ones `rehype-slug` will generate at render time — keeping the TOC
 * anchors in sync with the rendered heading ids.
 *
 * Code fences are skipped so headings inside code blocks are ignored.
 */
export function extractHeadings(body: string): BlogHeading[] {
    const slugger = new GithubSlugger();
    const headings: BlogHeading[] = [];
    let inFence = false;
    let fenceMarker = "";

    for (const line of body.split("\n")) {
        // Track fenced code blocks (``` or ~~~) — skip headings inside them.
        const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
        if (fenceMatch) {
            const marker = fenceMatch[1]?.[0] ?? "`";
            if (!inFence) {
                inFence = true;
                fenceMarker = marker;
            } else if (marker === fenceMarker) {
                inFence = false;
                fenceMarker = "";
            }
            continue;
        }
        if (inFence) continue;

        // Match ATX headings: `## Text` or `### Text` (H2/H3 only for the TOC).
        const match = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
        if (!match) continue;
        const [, hashes, text] = match;
        if (!hashes || !text) continue;
        const level = hashes.length;
        if (level !== 2 && level !== 3) continue;

        // Strip inline Markdown (links, emphasis, code) for the TOC label.
        const cleanText = text
            .replace(/`([^`]+)`/g, "$1")
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .trim();

        headings.push({
            id: slugger.slug(cleanText),
            text: cleanText,
            level,
        });
    }

    return headings;
}

/**
 * Compute reading time in minutes from a Markdown/MDX body
 * (blog-page-design §9.2). Counts words in prose only (code fences excluded),
 * divides by 200 wpm, rounds up, and floors at 1 minute.
 */
export function computeReadingTime(body: string): number {
    // Strip fenced code blocks so code-only content doesn't inflate the count.
    const withoutCode = body.replace(/```[\s\S]*?```/g, " ");
    // Strip inline code, markdown syntax, and frontmatter markers.
    const prose = withoutCode
        .replace(/`[^`]+`/g, " ")
        .replace(/[#*_>\-\[\]()!]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!prose) return 1;
    const words = prose.split(" ").filter(Boolean).length;
    return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** Strip Markdown syntax to plain text for excerpts / word counts. */
export function stripMarkdown(body: string): string {
    return body
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`[^`]+`/g, " ")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/^\s*>\s?/gm, "")
        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/\s+/g, " ")
        .trim();
}

/** A raw frontmatter payload read from disk before validation. */
interface RawFrontmatter {
    title: unknown;
    unit: unknown;
    priority: unknown;
    date: unknown;
    pid: unknown;
    excerpt: unknown;
    tags: unknown;
    draft?: unknown;
}

/**
 * Parse a single `.mdx` file into a validated `BlogPost`. Throws on a
 * malformed entry so the build fails fast in dev rather than rendering a
 * broken journal — mirroring the projects/experience loader pattern.
 */
function parsePost(filePath: string, slug: string): BlogPost {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const fm = data as RawFrontmatter;

    const post = blogPostSchema.parse({
        slug,
        title: fm.title,
        unit: fm.unit,
        priority: fm.priority,
        date: fm.date,
        pid: fm.pid,
        excerpt: fm.excerpt,
        tags: fm.tags,
        readingTime: computeReadingTime(content),
        body: content,
        headings: extractHeadings(content),
        draft: fm.draft ?? false,
    });

    return post;
}

/** Cache for the full post list — read once per process. */
let postsCache: BlogPost[] | null = null;

/**
 * All posts, newest-first, drafts excluded (blog-page-design §1.1 — the
 * index is a reverse-chronological log stream). Reads + validates the
 * content directory on first call, then memoizes.
 */
export function getAllPosts(): BlogPost[] {
    if (postsCache) return postsCache;

    if (!fs.existsSync(CONTENT_DIR)) {
        postsCache = [];
        return postsCache;
    }

    const files = fs
        .readdirSync(CONTENT_DIR)
        .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));

    const posts = files
        .map((file) => {
            const slug = file.replace(/\.mdx?$/, "");
            const filePath = path.join(CONTENT_DIR, file);
            try {
                return parsePost(filePath, slug);
            } catch (error) {
                // Re-throw with the filename so the author knows which post
                // has malformed frontmatter.
                const message =
                    error instanceof Error ? error.message : String(error);
                throw new Error(
                    `Failed to parse blog post "${file}": ${message}`,
                );
            }
        })
        .filter((post) => !post.draft)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    postsCache = posts;
    return posts;
}

/** All posts as lightweight metadata (no body) — for index/related/tag views. */
export function getAllPostMetas(): BlogPostMeta[] {
    return getAllPosts().map(({ body: _body, ...meta }) => meta);
}

/** A single post by slug, or `null` if not found / draft. */
export function getPostBySlug(slug: string): BlogPost | null {
    return getAllPosts().find((post) => post.slug === slug) ?? null;
}

/**
 * The chronological neighbors of a post — the previous (older) and next
 * (newer) entries by date (blog-page-design §16). Returns `null` for either
 * slot at the ends of the journal.
 */
export function getPostNeighbors(slug: string): {
    previous: BlogPostMeta | null;
    next: BlogPostMeta | null;
} {
    const posts = getAllPosts();
    const index = posts.findIndex((post) => post.slug === slug);
    if (index === -1) return { previous: null, next: null };

    // Posts are newest-first, so "previous" (←) is the older entry (index+1)
    // and "next" (→) is the newer entry (index-1).
    const older = index + 1 < posts.length ? posts[index + 1] : undefined;
    const newer = index - 1 >= 0 ? posts[index - 1] : undefined;
    const previous = older ? stripBody(older) : null;
    const next = newer ? stripBody(newer) : null;
    return { previous, next };
}

/** Related entries for a post — correlated by shared tags + unit (§15.3). */
export function getRelatedPosts(slug: string, count = 3): BlogPostMeta[] {
    const posts = getAllPosts();
    const current = posts.find((post) => post.slug === slug);
    if (!current) return [];

    const candidates = posts.filter((post) => post.slug !== slug);

    const scored = candidates.map((post) => {
        let score = 0;
        for (const tag of current.tags) {
            if (post.tags.includes(tag)) score += 2;
        }
        if (post.unit === current.unit) score += 1;
        return { post, score };
    });

    const related = scored
        .filter((entry) => entry.score > 0)
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.post.date < b.post.date ? 1 : -1; // newer-first tiebreak
        })
        .slice(0, count)
        .map((entry) => stripBody(entry.post));

    // Fallback: fill with most-recent posts in any unit if not enough related.
    if (related.length < count) {
        const used = new Set([slug, ...related.map((p) => p.slug)]);
        for (const post of posts) {
            if (related.length >= count) break;
            if (used.has(post.slug)) continue;
            related.push(stripBody(post));
            used.add(post.slug);
        }
    }

    return related;
}

/** All posts carrying a given tag. */
export function getPostsByTag(tag: string): BlogPostMeta[] {
    return getAllPostMetas().filter((post) => post.tags.includes(tag));
}

/** All posts in a given unit (category). */
export function getPostsByUnit(unit: string): BlogPostMeta[] {
    return getAllPostMetas().filter((post) => post.unit === unit);
}

/** Every unique tag across all posts, with its post count (§8.3). */
export function getAllTags(): { tag: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const post of getAllPosts()) {
        for (const tag of post.tags) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
    }
    return [...counts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Every unit that has at least one post, with its post count. */
export function getUsedUnits(): { unit: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const post of getAllPosts()) {
        counts.set(post.unit, (counts.get(post.unit) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([unit, count]) => ({ unit, count }))
        .sort((a, b) => b.count - a.count);
}

/** Total word count across all posts — for the journal stats pill (§2.3). */
export function getTotalWordCount(): number {
    return getAllPosts().reduce(
        (sum, post) =>
            sum + stripMarkdown(post.body).split(" ").filter(Boolean).length,
        0,
    );
}

/** Strip the body from a post to produce its lightweight metadata shape. */
function stripBody(post: BlogPost): BlogPostMeta {
    const { body: _body, ...meta } = post;
    return meta;
}
