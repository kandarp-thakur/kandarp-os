/**
 * Cache revalidation engine — the "live updates" seam.
 *
 * Every admin mutation (create/update/delete/archive/restore/reorder/import)
 * flows through here. It maps the affected collection to a set of ISR cache
 * tags + paths and calls Next's `revalidateTag` / `revalidatePath` so the
 * public site picks up the change on the next request (or immediately when
 * using the on-demand revalidation API).
 *
 * Tag strategy
 * ------------
 * Each collection owns a stable tag (e.g. `public:projects`). Public server
 * components fetch data with `{ next: { tags: [...] } }`, so invalidating a
 * tag purges every route that consumed it. Singletons (settings, profile,
 * site-customization) get their own tags because they affect the entire site
 * (layout, navigation, theme, footer) — invalidating them revalidates the
 * root layout and every page.
 *
 * Relationship-aware
 * ------------------
 * Because the relationship engine mirrors ids bidirectionally, editing a
 * project that is linked to blogs/skills/infra also changes those mirror
 * collections. We therefore revalidate the tags of every collection that
 * participates in relationships with the mutated one, so "Related Projects"
 * sections on blog/skill/infra pages refresh too.
 *
 * This module is server-only (uses `next/cache`).
 */

import { revalidatePath, revalidateTag } from "next/cache";

import type { CollectionName } from "@/lib/admin/types";

/* ── Tag registry ──────────────────────────────────────────────────────── */

/**
 * The canonical ISR tag for each collection's public read path. Public server
 * components and the public-data repositories pass these into `unstable_cache`
 * / `fetch` / `cache()` options so a single `revalidateTag` purges them all.
 */
export const PUBLIC_TAGS: Record<CollectionName, string> = {
    projects: "public:projects",
    blogPosts: "public:blog",
    experience: "public:experience",
    skills: "public:skills",
    infraNodes: "public:infra",
    infraEdges: "public:infra",
    awards: "public:awards",
    education: "public:education",
    certificates: "public:certificates",
    services: "public:services",
    resumes: "public:resumes",
    media: "public:media",
    users: "public:users",
    settings: "public:settings",
    siteCustomization: "public:site-builder",
    analytics: "public:analytics",
    activityLogs: "public:activity",
    categories: "public:categories",
    tags: "public:tags",
    profiles: "public:profile",
};

/**
 * Collections whose mutation affects the global chrome (layout, navigation,
 * footer, theme, SEO, identity). Invalidating these revalidates the root
 * layout + every public route, because the root layout reads settings +
 * profile to render metadata, fonts, and theme tokens.
 */
const GLOBAL_COLLECTIONS: ReadonlySet<CollectionName> = new Set([
    "settings",
    "profiles",
    "siteCustomization",
    "media", // media is referenced everywhere images render
]);

/**
 * Relationship adjacency — when collection A is mutated, the mirror collections
 * that may have gained/lost a back-reference are also revalidated so "Related
 * X" sections refresh. Mirrors the relationship engine's MIRRORS map.
 */
const RELATIONSHIP_NEIGHBORS: Partial<Record<CollectionName, CollectionName[]>> = {
    projects: ["blogPosts", "skills", "experience", "infraNodes"],
    blogPosts: ["projects", "skills", "infraNodes"],
    experience: ["projects", "skills"],
    skills: ["projects", "blogPosts", "infraNodes"],
    infraNodes: ["projects", "blogPosts", "skills"],
};

/* ── Public routes per collection ──────────────────────────────────────── */

/**
 * The public route paths affected by a collection mutation. Used for
 * `revalidatePath` as a belt-and-suspenders complement to tag revalidation
 * (tags cover `unstable_cache`; paths cover server-component renders that
 * read the store directly without a cache wrapper).
 */
const PUBLIC_PATHS: Partial<Record<CollectionName, string[]>> = {
    projects: ["/", "/projects"],
    blogPosts: ["/", "/blog", "/blog/[slug]", "/blog/tags", "/blog/tags/[tag]"],
    experience: ["/", "/experience"],
    skills: ["/", "/skills"],
    infraNodes: ["/", "/infrastructure"],
    infraEdges: ["/", "/infrastructure"],
    awards: ["/"],
    education: ["/", "/about"],
    certificates: ["/", "/about"],
    services: ["/"],
    resumes: ["/", "/about", "/contact"],
    media: ["/"],
    settings: ["/"],
    profiles: ["/", "/about", "/contact"],
    siteCustomization: ["/"],
};

/** The full set of public route paths (for global revalidations). */
const ALL_PUBLIC_PATHS = [
    "/",
    "/projects",
    "/experience",
    "/skills",
    "/infrastructure",
    "/blog",
    "/blog/[slug]",
    "/blog/tags",
    "/blog/tags/[tag]",
    "/about",
    "/contact",
];

/* ── Revalidation API ──────────────────────────────────────────────────── */

/**
 * Revalidate the public cache for a single collection.
 *
 * - Invalidates the collection's ISR tag (purges every `unstable_cache` reader).
 * - Invalidates the tags of relationship-neighbor collections (so related
 *   sections refresh).
 * - Revalidates the affected public route paths.
 *
 * Safe to call from any server context (route handler, server action). It is
 * fire-and-forget — errors are swallowed because a failed revalidation must
 * never break a successful write (the next request will simply serve stale
 * data until the next mutation).
 */
export function revalidateCollection(collection: CollectionName): void {
    try {
        // 1. The collection's own tag.
        revalidateTag(PUBLIC_TAGS[collection]);

        // 2. Relationship-neighbor tags (back-references may have changed).
        const neighbors = RELATIONSHIP_NEIGHBORS[collection] ?? [];
        for (const neighbor of neighbors) {
            revalidateTag(PUBLIC_TAGS[neighbor]);
        }

        // 3. Affected route paths.
        const paths = PUBLIC_PATHS[collection] ?? [];
        for (const p of paths) {
            revalidatePath(p);
        }

        // 4. Global chrome collections revalidate everything.
        if (GLOBAL_COLLECTIONS.has(collection)) {
            revalidateAll();
        }
    } catch {
        // Swallow — see JSDoc. Stale data is preferable to a failed write.
    }
}

/**
 * Revalidate every public route + tag. Used by global mutations (settings,
 * profile, site-customization, backup restore, import-replace) that can
 * affect the entire site.
 */
export function revalidateAll(): void {
    try {
        for (const tag of Object.values(PUBLIC_TAGS)) {
            revalidateTag(tag);
        }
        for (const p of ALL_PUBLIC_PATHS) {
            revalidatePath(p);
        }
        // Revalidate the layout so metadata/theme/identity refresh.
        revalidatePath("/", "layout");
    } catch {
        // Swallow.
    }
}

/**
 * Revalidate a specific blog post by slug (for per-post ISR when a single
 * post is edited). Falls back to full blog revalidation if the slug is empty.
 */
export function revalidateBlogPost(slug?: string): void {
    try {
        revalidateTag(PUBLIC_TAGS.blogPosts);
        if (slug) {
            revalidatePath(`/blog/${slug}`);
        } else {
            revalidatePath("/blog");
            revalidatePath("/blog/[slug]");
        }
        revalidatePath("/");
    } catch {
        // Swallow.
    }
}

/**
 * Revalidate a specific project by slug. Mirrors `revalidateBlogPost`.
 */
export function revalidateProject(slug?: string): void {
    try {
        revalidateTag(PUBLIC_TAGS.projects);
        if (slug) {
            revalidatePath(`/projects/${slug}`);
        }
        revalidatePath("/");
        revalidatePath("/projects");
    } catch {
        // Swallow.
    }
}
