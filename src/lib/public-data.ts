/**
 * Public data access layer — frontend-only edition.
 *
 * This module is the single source of truth the public site's server components
 * call to resolve content (projects, experience, infrastructure, skills,
 * achievements, blog, site identity, SEO metadata, derived stats).
 *
 * In the previous full-stack architecture this layer read from a Prisma-backed
 * JSON store with a fallback to the hardcoded `src/data/*.ts` seed files. For
 * the Phase 1 frontend-only rebuild the store has been removed, so every
 * function returns the seed data directly. The function signatures are
 * preserved verbatim so the consuming pages (`app/page.tsx`, `app/layout.tsx`,
 * the `(public)` route group, `sitemap.ts`) require no changes.
 *
 * Phase 2 (Admin Panel) will reintroduce a CMS-backed implementation behind
 * this same interface; until then, edit content in `src/data/*.ts`.
 */

import { ACHIEVEMENTS, ACHIEVEMENT_STATS } from "@/data/achievements";
import { DEPLOYMENTS, DEPLOYMENT_STATS } from "@/data/experience";
import { INFRA_EDGES, INFRA_NODES, INFRA_STATS } from "@/data/infrastructure";
import { CONTAINERS, FLEET_STATS } from "@/data/projects";
import { SKILL_NODES } from "@/data/skills";
import { socials as SOCIALS } from "@/data/socials";
import { SITE } from "@utils/constants";
import {
    computeReadingTime,
    extractHeadings,
    getAllPosts,
    getPostBySlug,
    stripMarkdown,
} from "@/lib/blog";
import { formatWordCount } from "@/data/blog";

import type { Achievement } from "@packages/types/achievements";
import type { Deployment } from "@packages/types/experience";
import type { InfraEdge, InfraNode } from "@packages/types/infrastructure";
import type { Container } from "@packages/types/projects";
import type { SkillNode } from "@packages/types/skills";
import type { BlogPost, BlogPostMeta } from "@packages/types/blog";
import type {
    FooterColumn,
    NavItem,
    SectionConfig,
    SocialLink,
} from "@/lib/site-types";

/* ── Public view-models for media ──────────────────────────────────────── */

/**
 * A single responsive image source for a `<picture>`/`<img>` srcset.
 */
export interface PublicImageVariant {
    size: "thumbnail" | "medium" | "original";
    width: number;
    height: number;
    /** Original-format variant path. */
    path: string;
    /** WebP variant path. */
    webp?: string;
    /** AVIF variant path. */
    avif?: string;
}

/**
 * A resolved image descriptor — the public-site view-model for any image.
 * `null` means "no image / fallback to placeholder".
 */
export interface PublicImage {
    id: string;
    alt: string;
    width: number;
    height: number;
    variants: PublicImageVariant[];
    blurDataUrl: string;
    focalPoint: { x: number; y: number } | null;
    mimeType: string;
}

/**
 * Resolve a media id into a public image descriptor.
 *
 * Frontend-only build has no media library, so this always returns `null`
 * (callers fall back to their placeholder). Phase 2 will wire this to the CMS
 * media store.
 */
export async function resolveMediaAsset(
    _mediaId: string | null | undefined,
): Promise<PublicImage | null> {
    return null;
}

/* ── Entity collections ────────────────────────────────────────────────── */

/** All published projects as containers. */
export async function getPublicProjects(): Promise<Container[]> {
    return CONTAINERS;
}

/** All experience entries as deployments. */
export async function getPublicExperience(): Promise<Deployment[]> {
    return DEPLOYMENTS;
}

/** All skills as mesh nodes. */
export async function getPublicSkills(): Promise<SkillNode[]> {
    return SKILL_NODES;
}

/** All infrastructure nodes. */
export async function getPublicInfraNodes(): Promise<InfraNode[]> {
    return INFRA_NODES;
}

/** All infrastructure edges. */
export async function getPublicInfraEdges(): Promise<InfraEdge[]> {
    return INFRA_EDGES;
}

/** All awards as achievements. */
export async function getPublicAwards(): Promise<Achievement[]> {
    return ACHIEVEMENTS;
}

/* ── Singletons (always null in the frontend-only build) ───────────────── */

/**
 * Settings singleton. The frontend-only build has no CMS, so this returns
 * `null` and consumers fall back to the `SITE` constants.
 */
export async function getPublicSettings(): Promise<null> {
    return null;
}

/**
 * Profile singleton. Returns `null`; consumers fall back to `SITE`.
 */
export async function getPublicProfile(): Promise<null> {
    return null;
}

/**
 * Hero portrait image. No media library in the frontend-only build, so always
 * `null` (the hero renders its placeholder).
 */
export async function getPublicHeroPortrait(): Promise<PublicImage | null> {
    return null;
}

/**
 * Site-customization singleton (Website Builder config). Returns `null`; the
 * home page uses its default section order.
 */
export async function getPublicSiteCustomization(): Promise<{
    sections: SectionConfig[];
} | null> {
    return null;
}

/* ── Blog ──────────────────────────────────────────────────────────────── */

/** All published blog posts (MDX pipeline), newest-first. */
export async function getPublicBlogPosts(): Promise<BlogPost[]> {
    return getAllPosts();
}

/** Lightweight post metadata (no body) for index/related/tag views. */
export async function getPublicBlogPostMetas(): Promise<BlogPostMeta[]> {
    const posts = await getPublicBlogPosts();
    return posts.map(({ body: _body, ...meta }) => meta);
}

/** A single published post by slug. */
export async function getPublicBlogPostBySlug(
    slug: string,
): Promise<BlogPost | null> {
    return getPostBySlug(slug);
}

/** Chronological neighbors (previous/next) of a post. */
export async function getPublicBlogPostNeighbors(
    slug: string,
): Promise<{ previous: BlogPostMeta | null; next: BlogPostMeta | null }> {
    const posts = await getPublicBlogPostMetas();
    const index = posts.findIndex((post) => post.slug === slug);
    if (index === -1) return { previous: null, next: null };

    const older = index + 1 < posts.length ? posts[index + 1] : null;
    const newer = index - 1 >= 0 ? posts[index - 1] : null;
    return { previous: older ?? null, next: newer ?? null };
}

/** Related posts for a slug (shared tags + unit), with a recency fallback. */
export async function getPublicRelatedPosts(
    slug: string,
    count = 3,
): Promise<BlogPostMeta[]> {
    const posts = await getPublicBlogPostMetas();
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
            return a.post.date < b.post.date ? 1 : -1;
        })
        .slice(0, count)
        .map((entry) => entry.post);

    if (related.length < count) {
        const used = new Set([slug, ...related.map((p) => p.slug)]);
        for (const post of posts) {
            if (related.length >= count) break;
            if (used.has(post.slug)) continue;
            related.push(post);
            used.add(post.slug);
        }
    }

    return related;
}

/** Every post carrying a given tag. */
export async function getPublicPostsByTag(
    tag: string,
): Promise<BlogPostMeta[]> {
    const posts = await getPublicBlogPostMetas();
    return posts.filter((post) => post.tags.includes(tag));
}

/** Every unique tag with its post count, sorted by count then name. */
export async function getPublicBlogTags(): Promise<
    { tag: string; count: number }[]
> {
    const posts = await getPublicBlogPosts();
    const counts = new Map<string, number>();
    for (const post of posts) {
        for (const tag of post.tags) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
    }
    return [...counts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Every blog unit with at least one post, with its post count. */
export async function getPublicBlogUnits(): Promise<
    { unit: string; count: number }[]
> {
    const posts = await getPublicBlogPosts();
    const counts = new Map<string, number>();
    for (const post of posts) {
        counts.set(post.unit, (counts.get(post.unit) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([unit, count]) => ({ unit, count }))
        .sort((a, b) => b.count - a.count);
}

/** Total word count across all published posts. */
export async function getPublicBlogWordCount(): Promise<number> {
    const posts = await getPublicBlogPosts();
    return posts.reduce(
        (sum, post) =>
            sum + stripMarkdown(post.body).split(" ").filter(Boolean).length,
        0,
    );
}

/* ── Education / Certificates / Services / Resumes (empty in FE-only) ──── */

export async function getPublicEducation(): Promise<unknown[]> {
    return [];
}

export async function getPublicCertificates(): Promise<unknown[]> {
    return [];
}

export async function getPublicServices(): Promise<unknown[]> {
    return [];
}

export async function getPublicResumes(): Promise<unknown[]> {
    return [];
}

export async function getPublicPrimaryResume(): Promise<null> {
    return null;
}

/* ── Navigation / Footer / Socials ─────────────────────────────────────── */

/** Public navigation items. Returns `null` (callers use hardcoded nav). */
export async function getPublicNavigation(): Promise<NavItem[] | null> {
    return null;
}

/** Footer configuration. Returns `null` (callers use hardcoded footer). */
export async function getPublicFooter(): Promise<{
    columns: FooterColumn[];
    copyright: string;
    showSocials: boolean;
} | null> {
    return null;
}

/** Social links. Returns the hardcoded socials. */
export async function getPublicSocials(): Promise<SocialLink[] | null> {
    if (SOCIALS.length === 0) return null;
    return SOCIALS.map((s) => ({
        id: s.id,
        platform: s.id,
        url: s.url,
        label: s.label,
    }));
}

/* ── Site identity (resolved) ──────────────────────────────────────────── */

/**
 * The resolved site identity — a denormalized view-model merging the site
 * constants into the shape the public chrome consumes. Every field falls back
 * to the hardcoded `SITE` constant.
 */
export interface PublicSiteIdentity {
    name: string;
    owner: string;
    shortName: string;
    host: string;
    userAtHost: string;
    description: string;
    url: string;
    email: string;
    phone: string;
    logo: string | null;
    favicon: string | null;
    theme: "dark" | "light";
    brand: {
        primaryColor: string;
        accentColor: string;
        tagline: string;
        description: string;
    };
    typography: {
        headingFont: string;
        bodyFont: string;
        monoFont: string;
        baseSize: string;
        scale: string;
    };
    colors: {
        background: string;
        surface: string;
        text: string;
        textMuted: string;
        border: string;
        success: string;
        warning: string;
        error: string;
    };
    maintenanceMode: boolean;
    maintenanceMessage: string;
    animationsEnabled: boolean;
    heroAvatar: {
        avatarUrl: string;
        avatarScale: number;
        avatarPosition: [number, number, number];
        avatarRotation: [number, number, number];
        animationSpeed: number;
        idleAnimation: boolean;
        mouseFollow: boolean;
        enableShadows: boolean;
        enableBloom: boolean;
    };
    socials: SocialLink[];
    navigation: NavItem[];
    footer: {
        columns: FooterColumn[];
        copyright: string;
        showSocials: boolean;
    };
    profile: {
        name: string;
        designation: string;
        bio: string;
        email: string;
        phone: string;
        github: string | null;
        linkedin: string | null;
        resume: string;
        socialLinks: {
            id: string;
            platform: string;
            url: string;
            icon?: string;
            label?: string;
        }[];
    } | null;
}

/** Resolve the full site identity from the `SITE` constants. */
export async function getPublicSiteIdentity(): Promise<PublicSiteIdentity> {
    const socials = (await getPublicSocials()) ?? [];
    return {
        name: SITE.name,
        owner: SITE.owner,
        shortName: SITE.shortName,
        host: SITE.host,
        userAtHost: SITE.userAtHost,
        description: SITE.description,
        url: SITE.url,
        email: SITE.email,
        phone: SITE.phone,
        logo: null,
        favicon: null,
        theme: "dark",
        brand: {
            primaryColor: "#2496ED",
            accentColor: "#22d3ee",
            tagline: "",
            description: SITE.description,
        },
        typography: {
            headingFont: "Space Grotesk",
            bodyFont: "Inter",
            monoFont: "JetBrains Mono",
            baseSize: "16px",
            scale: "1.25",
        },
        colors: {
            background: "#0a0a0f",
            surface: "#12121a",
            text: "#e5e7eb",
            textMuted: "#9ca3af",
            border: "#27272a",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
        },
        maintenanceMode: false,
        maintenanceMessage: "",
        animationsEnabled: true,
        heroAvatar: {
            avatarUrl: "",
            avatarScale: 1,
            avatarPosition: [0, -1.35, 0],
            avatarRotation: [0, 0, 0],
            animationSpeed: 1,
            idleAnimation: true,
            mouseFollow: true,
            enableShadows: true,
            enableBloom: true,
        },
        socials,
        navigation: [],
        footer: {
            columns: [],
            copyright: "",
            showSocials: true,
        },
        profile: null,
    };
}

/* ── Stats (derived from seed data) ────────────────────────────────────── */

/** Deployment (experience) stats. */
export async function getPublicDeploymentStats(): Promise<
    { label: string; value: string }[]
> {
    return DEPLOYMENT_STATS;
}

/** Fleet (projects) stats. */
export async function getPublicFleetStats(): Promise<
    { key: string; label: string; value: string }[]
> {
    return FLEET_STATS;
}

/** Infrastructure stats. */
export async function getPublicInfraStats(): Promise<
    { key: string; label: string; value: string }[]
> {
    return INFRA_STATS;
}

/** Skill stats, derived from the seed nodes. */
export async function getPublicSkillStats(): Promise<
    { key: string; label: string; value: string }[]
> {
    const nodes = SKILL_NODES;
    const active = nodes.filter((n) => n.status === "active").length;
    const idle = nodes.filter((n) => n.status === "idle").length;
    const learning = nodes.filter((n) => n.status === "learning").length;
    return [
        { key: "nodes", label: "Nodes", value: String(nodes.length) },
        { key: "active", label: "Active", value: String(active) },
        { key: "idle", label: "Idle", value: String(idle) },
        { key: "learning", label: "Learning", value: String(learning) },
    ];
}

/** Achievement stats. */
export async function getPublicAchievementStats(): Promise<
    { key: string; label: string; value: string }[]
> {
    return [...ACHIEVEMENT_STATS];
}

/** Journal (blog) stats. */
export async function getPublicJournalStats(): Promise<
    { key: string; label: string; value: string }[]
> {
    const [posts, units, tags, words] = await Promise.all([
        getPublicBlogPosts(),
        getPublicBlogUnits(),
        getPublicBlogTags(),
        getPublicBlogWordCount(),
    ]);

    return [
        { key: "entries", label: "Entries", value: String(posts.length) },
        { key: "units", label: "Units", value: String(units.length) },
        { key: "tags", label: "Tags", value: String(tags.length) },
        { key: "words", label: "Words", value: formatWordCount(words) },
    ];
}

/* ── SEO metadata ──────────────────────────────────────────────────────── */

/** Resolve global SEO metadata into a Next.js-shaped object. */
export async function getPublicMetadata(): Promise<{
    title: { default: string; template: string };
    description: string;
    openGraph: {
        title: string;
        description: string;
        url: string;
        siteName: string;
        type: string;
        locale: string;
    };
    twitter: {
        card: string;
        title: string;
        description: string;
    };
}> {
    const identity = await getPublicSiteIdentity();
    const seoTitle = `${identity.name} — ${identity.owner}`;
    const seoDescription = identity.description;

    return {
        title: {
            default: seoTitle,
            template: `%s | ${identity.name}`,
        },
        description: seoDescription,
        openGraph: {
            title: seoTitle,
            description: seoDescription,
            url: identity.url,
            siteName: identity.name,
            type: "website",
            locale: "en_US",
        },
        twitter: {
            card: "summary_large_image",
            title: seoTitle,
            description: seoDescription,
        },
    };
}

/* ── Helpers re-exported for callers that previously imported from here ─── */

export { computeReadingTime, extractHeadings, stripMarkdown };
