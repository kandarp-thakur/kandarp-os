/**
 * Public data access layer — maps persisted CMS entities to public view models.
 * PostgreSQL is the runtime source of truth; static data is used only by the
 * idempotent seed service and is never imported by this public read path.
 */
import { unstable_cache } from "next/cache";

import type { Achievement } from "@packages/types/achievements";
import type { Deployment } from "@packages/types/experience";
import type { InfraEdge, InfraNode } from "@packages/types/infrastructure";
import type { Container } from "@packages/types/projects";
import type { SkillNode } from "@packages/types/skills";
import type { BlogPost, BlogPostMeta } from "@packages/types/blog";
import { blogUnitSchema } from "@packages/types/blog";

import { PUBLIC_TAGS } from "@backend/cache/revalidate";
import { env } from "@backend/config/env-schema";
import { query, findByField } from "@backend/repositories/repo";
import {
    heroSchema,
    type Award,
    type BlogPost as AdminBlogPost,
    type Certificate,
    type Education,
    type Experience,
    type FooterColumn,
    type HeroConfig,
    type InfraNode as AdminInfraNode,
    type MediaAsset,
    type MediaVariant,
    type NavItem,
    type Profile,
    type Project,
    type Resume,
    type Service,
    type Settings,
    type SiteCustomization,
    type Skill,
    type SocialLink,
} from "@backend/schemas/types";
import { findById, list } from "@backend/repositories/repo";
import { computeReadingTime, extractHeadings, stripMarkdown } from "@/lib/blog";
import { SITE } from "@utils/constants";

/* ── Public view-models for media ──────────────────────────────────────── */

/**
 * A single responsive image source for a `<picture>`/`<img>` srcset.
 * Mirrors `MediaVariant` but trimmed to what the public site needs.
 */
export interface PublicImageVariant {
    size: MediaVariant["size"];
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
 * A resolved image descriptor — the public-site view-model for any Media
 * Library image. The hero, blog covers, project thumbnails, etc. all consume
 * this shape. `null` means "no image / fallback to placeholder".
 *
 * This is the contract that makes the Media Library reusable: every CMS
 * entity that stores a Media id resolves to this via `resolveMediaAsset`.
 */
export interface PublicImage {
    /** The Media Library asset id (for cache keys / debugging). */
    id: string;
    /** Alt text (accessibility). */
    alt: string;
    /** Source pixel dimensions. */
    width: number;
    height: number;
    /** Responsive variants (smallest → largest). */
    variants: PublicImageVariant[];
    /** Inline blur placeholder (base64 data URI) for progressive loading. */
    blurDataUrl: string;
    /** Focal point (normalized 0–1) for cover-fit object-position. */
    focalPoint: { x: number; y: number } | null;
    /** MIME type of the original. */
    mimeType: string;
}

/**
 * Resolve a Media Library asset id into a public image descriptor.
 * Returns `null` if the id is missing, the asset was deleted, or it isn't an
 * image — the caller falls back to its placeholder. This is the "fallback"
 * guarantee: a deleted image never breaks the layout.
 */
export async function resolveMediaAsset(
    mediaId: string | null | undefined,
): Promise<PublicImage | null> {
    if (!mediaId || !hasDatabase()) return null;
    const asset = await findById<MediaAsset>("media", mediaId);
    if (!asset) return null;
    if (!asset.mimeType.startsWith("image/")) return null;

    return {
        id: asset.id,
        alt: asset.alt || asset.originalName,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
        variants: (asset.variants ?? []).map((v) => ({
            size: v.size,
            width: v.width,
            height: v.height,
            path: v.path,
            webp: v.webp,
            avif: v.avif,
        })),
        blurDataUrl: asset.blurDataUrl ?? "",
        focalPoint: asset.focalPoint ?? null,
        mimeType: asset.mimeType,
    };
}

/* ── Store-readiness guard ──────────────────────────────────────────────── */

/**
 * Return whether the CMS database is configured.
 *
 * Public reads must not lazily seed the entire store. Seeding RBAC and every
 * collection from a request path makes a blog page depend on unrelated writes
 * and can block the request behind a database failure.
 */
function hasDatabase(): boolean {
    return Boolean(env.DATABASE_URL);
}

/* ── Mappers: admin entity → public view-model ──────────────────────────── */

function projectToContainer(p: Project): Container {
    return {
        id: p.id,
        name: p.title,
        status: p.containerStatus,
        statusDetail: p.statusDetail,
        image: p.image,
        created: p.created ?? p.publishedDate ?? "",
        description: p.description,
        longDescription: p.longDescription,
        stack: p.stack,
        ports: p.ports,
        metrics: p.metrics,
        changelog: p.changelog,
        links: p.links,
        exitCode: null,
    };
}

function experienceToDeployment(e: Experience): Deployment {
    return {
        id: e.id,
        version: e.version,
        role: e.role,
        company: e.company,
        companyUrl: e.companyUrl,
        startDate: e.startDate,
        endDate: e.endDate,
        status: e.status,
        image: e.image,
        replicas: e.replicas,
        uptime: e.uptime,
        summary: e.summary,
        changelog: e.achievements,
        stack: e.technologies,
        links: e.links,
    };
}

function skillToNode(s: Skill): SkillNode {
    return {
        id: s.id,
        name: s.name,
        abbr: s.abbr,
        domain: s.domain,
        status: s.status,
        tagline: s.tagline,
        x: s.x,
        y: s.y,
        connections: s.connections,
    };
}

function infraNodeToPublic(n: AdminInfraNode): InfraNode {
    return {
        id: n.id,
        name: n.name,
        icon: n.icon as InfraNode["icon"],
        role: n.role,
        status: n.status,
        statusDetail: n.statusDetail,
        x: n.x,
        y: n.y,
        description: n.description,
        stack: n.stack,
        specs: n.specs,
        metrics: n.metrics,
        notes: n.notes,
        links: n.links,
    };
}

function awardToAchievement(a: Award): Achievement {
    return {
        id: a.id,
        title: a.title,
        description: a.description,
        tier: a.tier,
        date: a.date,
        icon: a.icon,
        category: a.category,
    };
}

/* ── Public API ─────────────────────────────────────────────────────────── */

async function loadPublicCollection<TAdmin, TPublic>(
    collection: Parameters<
        typeof query<
            TAdmin & { id: string; createdAt: string; updatedAt: string }
        >
    >[0],
    mapper: (row: TAdmin) => TPublic,
    filters?: Record<string, unknown>,
): Promise<TPublic[]> {
    if (!hasDatabase()) return [];

    const { rows } = await query<
        TAdmin & { id: string; createdAt: string; updatedAt: string }
    >(collection, {
        filters,
        includeArchived: false,
        sort: "displayOrder",
        order: "asc",
        page: 1,
        pageSize: 1000,
    });
    return rows.map(mapper);
}

const cachedProjects = unstable_cache(
    () =>
        loadPublicCollection<Project, Container>(
            "projects",
            projectToContainer,
            { status: "published" },
        ),
    ["public-projects"],
    { tags: [PUBLIC_TAGS.projects] },
);
const cachedExperience = unstable_cache(
    () =>
        loadPublicCollection<Experience, Deployment>(
            "experience",
            experienceToDeployment,
        ),
    ["public-experience"],
    { tags: [PUBLIC_TAGS.experience] },
);
const cachedSkills = unstable_cache(
    () => loadPublicCollection<Skill, SkillNode>("skills", skillToNode),
    ["public-skills"],
    { tags: [PUBLIC_TAGS.skills] },
);
const cachedInfraNodes = unstable_cache(
    () =>
        loadPublicCollection<AdminInfraNode, InfraNode>(
            "infraNodes",
            infraNodeToPublic,
        ),
    ["public-infra-nodes"],
    { tags: [PUBLIC_TAGS.infraNodes] },
);
const cachedInfraEdges = unstable_cache(
    async (): Promise<InfraEdge[]> => {
        if (!hasDatabase()) return [];
        const rows = await list<
            { from: string; to: string; label?: string } & {
                id: string;
                createdAt: string;
                updatedAt: string;
            }
        >("infraEdges");
        return rows.map((edge) => ({
            from: edge.from,
            to: edge.to,
            label: edge.label,
        }));
    },
    ["public-infra-edges"],
    { tags: [PUBLIC_TAGS.infraEdges] },
);
const cachedAwards = unstable_cache(
    () =>
        loadPublicCollection<Award, Achievement>("awards", awardToAchievement),
    ["public-awards"],
    { tags: [PUBLIC_TAGS.awards] },
);

/** Tag-aware PostgreSQL reads invalidated by every corresponding admin mutation. */
export async function getPublicProjects(): Promise<Container[]> {
    return cachedProjects();
}

export async function getPublicExperience(): Promise<Deployment[]> {
    return cachedExperience();
}

export async function getPublicSkills(): Promise<SkillNode[]> {
    return cachedSkills();
}

export async function getPublicInfraNodes(): Promise<InfraNode[]> {
    return cachedInfraNodes();
}

export async function getPublicInfraEdges(): Promise<InfraEdge[]> {
    return cachedInfraEdges();
}

export async function getPublicAwards(): Promise<Achievement[]> {
    return cachedAwards();
}

/**
 * Fetch the settings singleton. Returns null if unavailable (caller falls
 * back to SITE constants).
 */
const cachedSettings = unstable_cache(
    async (): Promise<Settings | null> => {
        if (!hasDatabase()) return null;
        const rows = await list<Settings>("settings");
        return rows[0] ?? null;
    },
    ["public-settings"],
    { tags: [PUBLIC_TAGS.settings] },
);

export async function getPublicSettings(): Promise<Settings | null> {
    return cachedSettings();
}

/**
 * Fetch the profile singleton. Returns null if unavailable (caller uses
 * SITE constants as the fallback).
 */
const cachedProfile = unstable_cache(
    async (): Promise<Profile | null> => {
        if (!hasDatabase()) return null;
        const rows = await list<Profile>("profiles");
        return rows[0] ?? null;
    },
    ["public-profile"],
    { tags: [PUBLIC_TAGS.profiles] },
);

export async function getPublicProfile(): Promise<Profile | null> {
    return cachedProfile();
}

/**
 * Fetch the hero portrait as a resolved image descriptor.
 *
 * Resolves Profile.profileImageId → MediaAsset → PublicImage. Returns null
 * if no profile exists, no image is selected, or the selected image was
 * deleted (the hero renders its monogram placeholder). This is the
 * "fallback" guarantee: a deleted image never breaks the layout.
 *
 * No image URLs are stored on the Profile — only the Media Library id. The
 * path is resolved here at render time so deleting the asset automatically
 * restores the placeholder.
 */
export async function getPublicHeroPortrait(): Promise<PublicImage | null> {
    const profile = await getPublicProfile();
    if (!profile) return null;
    return await resolveMediaAsset(profile.profileImageId);
}

/**
 * Fetch the site-customization singleton (Website Builder config). Returns
 * null if unavailable (caller uses defaults).
 */
const cachedSiteCustomization = unstable_cache(
    async (): Promise<SiteCustomization | null> => {
        if (!hasDatabase()) return null;
        const rows = await list<SiteCustomization>("siteCustomization");
        return rows[0] ?? null;
    },
    ["public-site-customization"],
    { tags: [PUBLIC_TAGS.siteCustomization] },
);

export async function getPublicSiteCustomization(): Promise<SiteCustomization | null> {
    return cachedSiteCustomization();
}

/* ── Blog ──────────────────────────────────────────────────────────────── */

/**
 * Map an admin BlogPost to the public BlogPost view-model.
 *
 * The admin entity stores `content` (MDX body) and `tags` (array). The public
 * model expects `body`, `headings` (auto-derived), `readingTime` (computed),
 * `unit` (category as a systemd unit), `priority` (featured → notice), `pid`
 * (numeric), and `draft` (status !== published).
 *
 * If the admin post has no MDX body, we fall back to the richText (HTML) so the
 * post still renders. Reading time + headings are derived from whichever body
 * is present.
 */
function blogPostToPublic(p: AdminBlogPost): BlogPost {
    const body = p.content || p.richText || "";
    const headings = extractHeadings(body);
    const readingTime = p.readingTime || computeReadingTime(body) || 1;

    // Map the admin category to a valid blog unit. If the category matches a
    // known unit key, use it; otherwise default to "devops".
    const unitParse = blogUnitSchema.safeParse(p.category);
    const unit = unitParse.success ? unitParse.data : "devops";

    // Featured posts render as "notice"; deep-dives as "debug"; everything else "info".
    const priority = p.featured ? "notice" : "info";

    // Derive a numeric PID from the id (hash → positive int).
    const pid =
        Math.abs(
            p.id
                .split("")
                .reduce(
                    (hash, char) => (hash << 5) - hash + char.charCodeAt(0),
                    0,
                ),
        ) % 100000;

    return {
        slug: p.slug,
        title: p.title,
        unit,
        priority,
        date: p.publishedDate ?? p.createdAt.slice(0, 10),
        pid,
        excerpt: p.excerpt,
        tags: p.tags,
        readingTime,
        body,
        headings,
        draft: p.status !== "published",
    };
}

/** Fetch all published PostgreSQL blog posts, newest first. */
const cachedBlogPosts = unstable_cache(
    async (): Promise<BlogPost[]> => {
        if (!hasDatabase()) return [];
        const { rows } = await query<AdminBlogPost>("blogPosts", {
            filters: { status: "published" },
            includeArchived: false,
            sort: "publishedDate",
            order: "desc",
            page: 1,
            pageSize: 1000,
        });
        return rows.map(blogPostToPublic);
    },
    ["public-blog-posts"],
    { tags: [PUBLIC_TAGS.blogPosts] },
);

export async function getPublicBlogPosts(): Promise<BlogPost[]> {
    return cachedBlogPosts();
}

/**
 * Fetch all published blog posts as lightweight metadata (no body) — for the
 * index stream, related-entries cards, and tag pages. Falls back to the MDX
 * pipeline if the store is empty.
 */
export async function getPublicBlogPostMetas(): Promise<BlogPostMeta[]> {
    const posts = await getPublicBlogPosts();
    return posts.map(({ body: _body, ...meta }) => meta);
}

/** Fetch a single published PostgreSQL blog post by slug. */
export async function getPublicBlogPostBySlug(
    slug: string,
): Promise<BlogPost | null> {
    if (!hasDatabase()) return null;

    const post = await findByField<AdminBlogPost>("blogPosts", "slug", slug);
    if (!post || post.status !== "published" || post.archivedAt) return null;
    return blogPostToPublic(post);
}

/**
 * Fetch the chronological neighbors (previous/next) of a blog post by slug.
 * Falls back to the MDX pipeline.
 */
export async function getPublicBlogPostNeighbors(
    slug: string,
): Promise<{ previous: BlogPostMeta | null; next: BlogPostMeta | null }> {
    const posts = await getPublicBlogPostMetas();
    const index = posts.findIndex((post) => post.slug === slug);
    if (index === -1) return { previous: null, next: null };

    // Posts are newest-first, so "previous" (←) is the older entry (index+1)
    // and "next" (→) is the newer entry (index-1).
    const older = index + 1 < posts.length ? posts[index + 1] : null;
    const newer = index - 1 >= 0 ? posts[index - 1] : null;
    return { previous: older ?? null, next: newer ?? null };
}

/**
 * Fetch related blog posts for a given slug (by shared tags + unit). Falls
 * back to the MDX pipeline.
 */
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

    // Fallback: fill with most-recent posts if not enough related.
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

/**
 * Fetch all blog posts carrying a given tag. Falls back to the MDX pipeline.
 */
export async function getPublicPostsByTag(
    tag: string,
): Promise<BlogPostMeta[]> {
    const posts = await getPublicBlogPostMetas();
    return posts.filter((post) => post.tags.includes(tag));
}

/**
 * Every unique tag across all published blog posts, with its post count.
 * Falls back to the MDX pipeline.
 */
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

/**
 * Every blog unit that has at least one published post, with its post count.
 * Falls back to the MDX pipeline.
 */
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

/**
 * Total word count across all published blog posts. Falls back to the MDX
 * pipeline.
 */
export async function getPublicBlogWordCount(): Promise<number> {
    const posts = await getPublicBlogPosts();
    return posts.reduce(
        (sum, post) =>
            sum + stripMarkdown(post.body).split(" ").filter(Boolean).length,
        0,
    );
}

/* ── Education ─────────────────────────────────────────────────────────── */

/**
 * Fetch all education entries from the store. Returns an empty array if the
 * store is unavailable (the about section omits the education block).
 */
export async function getPublicEducation(): Promise<Education[]> {
    if (!hasDatabase()) return [];

    const { rows } = await query<Education>("education", {
        includeArchived: false,
        sort: "displayOrder",
        order: "asc",
        page: 1,
        pageSize: 1000,
    });

    return rows;
}

/* ── Certificates ──────────────────────────────────────────────────────── */

/**
 * Fetch all certificates from the store. Returns an empty array if the store
 * is unavailable.
 */
export async function getPublicCertificates(): Promise<Certificate[]> {
    if (!hasDatabase()) return [];

    const { rows } = await query<Certificate>("certificates", {
        includeArchived: false,
        sort: "displayOrder",
        order: "asc",
        page: 1,
        pageSize: 1000,
    });

    return rows;
}

/* ── Services ──────────────────────────────────────────────────────────── */

/**
 * Fetch all services from the store. Returns an empty array if the store is
 * unavailable.
 */
export async function getPublicServices(): Promise<Service[]> {
    if (!hasDatabase()) return [];

    const { rows } = await query<Service>("services", {
        includeArchived: false,
        sort: "displayOrder",
        order: "asc",
        page: 1,
        pageSize: 1000,
    });

    return rows;
}

/* ── Resumes ───────────────────────────────────────────────────────────── */

/**
 * Fetch all resumes from the store. Returns an empty array if the store is
 * unavailable.
 */
export async function getPublicResumes(): Promise<Resume[]> {
    if (!hasDatabase()) return [];

    const { rows } = await query<Resume>("resumes", {
        includeArchived: false,
        page: 1,
        pageSize: 1000,
    });

    return rows;
}

/**
 * Fetch the primary resume (the one flagged `isPrimary`, or the first one).
 * Returns null if no resumes exist.
 */
export async function getPublicPrimaryResume(): Promise<Resume | null> {
    const resumes = await getPublicResumes();
    return resumes.find((r) => r.isPrimary) ?? resumes[0] ?? null;
}

/* ── Navigation ────────────────────────────────────────────────────────── */

/**
 * Fetch the public navigation items from Settings. Returns null if the store
 * is unavailable or no navigation is configured (the caller falls back to the
 * hardcoded `navItems`).
 *
 * The admin NavItem schema stores `label`, `href`, `icon` (lucide name string),
 * `visible`, `external`, and optional `children`. The public site's NavItem
 * expects a `sectionId` and a resolved `icon` (LucideIcon component). Because
 * the public NavItem type uses component references, this function returns the
 * raw admin shape — the caller (a server component) resolves the icon name to
 * a component at render time.
 */
export async function getPublicNavigation(): Promise<NavItem[] | null> {
    const settings = await getPublicSettings();
    if (!settings) return null;
    if (!settings.navigation || settings.navigation.length === 0) return null;

    // Filter out hidden items.
    return settings.navigation.filter((item) => item.visible);
}

/* ── Footer ────────────────────────────────────────────────────────────── */

/**
 * Fetch the footer configuration from Settings. Returns null if the store is
 * unavailable (the caller falls back to the hardcoded footer).
 */
export async function getPublicFooter(): Promise<{
    columns: FooterColumn[];
    copyright: string;
    showSocials: boolean;
} | null> {
    const settings = await getPublicSettings();
    if (!settings) return null;
    return settings.footer;
}

/* ── Socials ───────────────────────────────────────────────────────────── */

/**
 * Fetch the social links from Settings. Returns null if the store is
 * unavailable (the caller falls back to the hardcoded `socials`).
 */
export async function getPublicSocials(): Promise<SocialLink[] | null> {
    const settings = await getPublicSettings();
    if (!settings) return null;
    if (!settings.socials || settings.socials.length === 0) return null;
    return settings.socials;
}

/* ── Site identity (resolved) ───────────────────────────────────────────── */

/**
 * The resolved site identity — a denormalized view-model that merges Settings
 * + Profile into the shape the public site's components actually consume
 * (SITE constants, navigation, socials, hero, about, contact).
 *
 * Every field falls back to the hardcoded `SITE` constant so the site never
 * breaks, even before first seed. This is the single function the root layout,
 * navbar, footer, and hero call to get "who am I, what's my name, what links
 * do I show."
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
    /** Complete CMS-owned Hero content and terminal behavior. */
    hero: HeroConfig;
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
    /** Resolved social links (settings.socials or profile.socialLinks). */
    socials: SocialLink[];
    /** Resolved navigation items (settings.navigation). */
    navigation: NavItem[];
    /** Resolved footer config. */
    footer: {
        columns: FooterColumn[];
        copyright: string;
        showSocials: boolean;
    };
    /** Profile-level fields (bio, designation, profile image). */
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

/**
 * Resolve the full site identity from Settings + Profile, with every field
 * falling back to the hardcoded `SITE` constant. This is the single source of
 * truth the root layout, navbar, footer, and hero consume.
 */
export async function getPublicSiteIdentity(): Promise<PublicSiteIdentity> {
    const [settings, profile] = await Promise.all([
        getPublicSettings(),
        getPublicProfile(),
    ]);

    // Settings can contain legacy or partially saved JSON (for example, a hero
    // object without `visual`). Normalize it through the schema so nested
    // defaults are applied before any public component consumes the config.
    const heroResult = heroSchema.safeParse(settings?.hero ?? {});
    const hero = heroResult.success
        ? heroResult.data
        : heroSchema.parse({ title: settings?.ownerName ?? SITE.owner });

    // Resolve socials: prefer settings.socials, fall back to profile.socialLinks.
    let socials: SocialLink[] = [];
    if (settings?.socials && settings.socials.length > 0) {
        socials = settings.socials;
    } else if (profile?.socialLinks && profile.socialLinks.length > 0) {
        socials = profile.socialLinks.map((s) => ({
            id: s.id,
            platform: s.platform,
            url: s.url,
            icon: s.icon,
        }));
    }

    return {
        name: settings?.siteName ?? SITE.name,
        owner: settings?.ownerName ?? SITE.owner,
        shortName: SITE.shortName,
        host: SITE.host,
        userAtHost: SITE.userAtHost,
        description: settings?.brand?.description || SITE.description,
        url: SITE.url,
        email: settings?.email || profile?.email || SITE.email,
        phone: settings?.phone || profile?.phone || SITE.phone,
        logo: settings?.logo ?? null,
        favicon: settings?.favicon ?? null,
        theme: settings?.theme ?? "dark",
        brand: {
            primaryColor: settings?.brand?.primaryColor ?? "#2496ED",
            accentColor: settings?.brand?.accentColor ?? "#22d3ee",
            tagline: settings?.brand?.tagline ?? "",
            description: settings?.brand?.description ?? SITE.description,
        },
        typography: {
            headingFont: settings?.typography?.headingFont ?? "Space Grotesk",
            bodyFont: settings?.typography?.bodyFont ?? "Inter",
            monoFont: settings?.typography?.monoFont ?? "JetBrains Mono",
            baseSize: settings?.typography?.baseSize ?? "16px",
            scale: settings?.typography?.scale ?? "1.25",
        },
        colors: {
            background: settings?.colors?.background ?? "#0a0a0f",
            surface: settings?.colors?.surface ?? "#12121a",
            text: settings?.colors?.text ?? "#e5e7eb",
            textMuted: settings?.colors?.textMuted ?? "#9ca3af",
            border: settings?.colors?.border ?? "#27272a",
            success: settings?.colors?.success ?? "#22c55e",
            warning: settings?.colors?.warning ?? "#f59e0b",
            error: settings?.colors?.error ?? "#ef4444",
        },
        maintenanceMode: settings?.maintenanceMode ?? false,
        maintenanceMessage: settings?.maintenanceMessage ?? "",
        animationsEnabled: settings?.animationsEnabled ?? true,
        hero: {
            ...hero,
            title: hero.title || settings?.ownerName || SITE.owner,
        },
        heroAvatar: {
            avatarUrl: settings?.heroAvatar?.avatarUrl ?? "",
            avatarScale: settings?.heroAvatar?.avatarScale ?? 1,
            avatarPosition: settings?.heroAvatar?.avatarPosition ?? [
                0, -1.35, 0,
            ],
            avatarRotation: settings?.heroAvatar?.avatarRotation ?? [0, 0, 0],
            animationSpeed: settings?.heroAvatar?.animationSpeed ?? 1,
            idleAnimation: settings?.heroAvatar?.idleAnimation ?? true,
            mouseFollow: settings?.heroAvatar?.mouseFollow ?? true,
            enableShadows: settings?.heroAvatar?.enableShadows ?? true,
            enableBloom: settings?.heroAvatar?.enableBloom ?? true,
        },
        socials,
        navigation: settings?.navigation ?? [],
        footer: settings?.footer ?? {
            columns: [],
            copyright: "",
            showSocials: true,
        },
        profile: profile
            ? {
                  name: profile.name,
                  designation: profile.designation,
                  bio: profile.bio,
                  email: profile.email,
                  phone: profile.phone,
                  github: profile.github ?? null,
                  linkedin: profile.linkedin ?? null,
                  resume: profile.resume,
                  socialLinks: profile.socialLinks,
              }
            : null,
    };
}

/* ── Stats (derived from CMS) ──────────────────────────────────────────── */

/**
 * Derive the deployment (experience) stats from the persisted CMS data.
 * Empty collections intentionally produce empty-derived values; public reads
 * never fall back to static seed content.
 */
export async function getPublicDeploymentStats(): Promise<
    { label: string; value: string }[]
> {
    const deployments = await getPublicExperience();
    const active = deployments.filter((d) => d.status === "active").length;
    return [
        { label: "Deployments", value: String(deployments.length) },
        { label: "Uptime", value: deployments[0]?.uptime ?? "—" },
        { label: "Current", value: `${active} active` },
        {
            label: "Focus",
            value: deployments[0]?.stack?.[0] ?? "Cloud + Security",
        },
    ];
}

/**
 * Derive the fleet (projects) stats from the persisted CMS data.
 */
export async function getPublicFleetStats(): Promise<
    { key: string; label: string; value: string }[]
> {
    const containers = await getPublicProjects();
    const running = containers.filter((c) => c.status === "running").length;
    const exited = containers.filter((c) => c.status === "exited").length;
    const created = containers.filter((c) => c.status === "created").length;
    return [
        { key: "total", label: "Containers", value: String(containers.length) },
        { key: "running", label: "Running", value: String(running) },
        { key: "exited", label: "Exited", value: String(exited) },
        { key: "created", label: "Created", value: String(created) },
    ];
}

/**
 * Derive the infrastructure stats from the persisted CMS data.
 */
export async function getPublicInfraStats(): Promise<
    { key: string; label: string; value: string }[]
> {
    const [nodes, edges] = await Promise.all([
        getPublicInfraNodes(),
        getPublicInfraEdges(),
    ]);
    const active = nodes.filter((n) => n.status === "active").length;
    return [
        { key: "nodes", label: "Nodes", value: String(nodes.length) },
        { key: "active", label: "Active", value: String(active) },
        { key: "edges", label: "Links", value: String(edges.length) },
        { key: "uptime", label: "Uptime", value: "—" },
    ];
}

/**
 * Derive the skill stats from the persisted CMS data.
 */
export async function getPublicSkillStats(): Promise<
    { key: string; label: string; value: string }[]
> {
    const nodes = await getPublicSkills();
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

/**
 * Derive the achievement stats from the persisted CMS data.
 */
export async function getPublicAchievementStats(): Promise<
    { key: string; label: string; value: string }[]
> {
    const achievements = await getPublicAwards();
    const legendary = achievements.filter((a) => a.tier === "legendary").length;
    const epic = achievements.filter((a) => a.tier === "epic").length;
    const rare = achievements.filter((a) => a.tier === "rare").length;
    return [
        { key: "total", label: "Badges", value: String(achievements.length) },
        { key: "legendary", label: "Legendary", value: String(legendary) },
        { key: "epic", label: "Epic", value: String(epic) },
        { key: "rare", label: "Rare", value: String(rare) },
    ];
}

/**
 * Derive the journal (blog) stats from the persisted CMS data. Blog bodies are
 * loaded through the CMS service, then word counts are formatted locally.
 */
export async function getPublicJournalStats(): Promise<
    { key: string; label: string; value: string }[]
> {
    const [posts, units, tags, words] = await Promise.all([
        getPublicBlogPosts(),
        getPublicBlogUnits(),
        getPublicBlogTags(),
        getPublicBlogWordCount(),
    ]);

    const formatWordCount = (count: number): string => {
        if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
        if (count >= 1_000) return `${(count / 1_000).toFixed(0)}k`;
        return String(count);
    };

    return [
        { key: "entries", label: "Entries", value: String(posts.length) },
        { key: "units", label: "Units", value: String(units.length) },
        { key: "tags", label: "Tags", value: String(tags.length) },
        { key: "words", label: "Words", value: formatWordCount(words) },
    ];
}

/* ── SEO metadata ───────────────────────────────────────────────────────── */

/**
 * Resolve the global SEO metadata from Settings, merged into a Next.js
 * `Metadata` object. Falls back to the hardcoded `siteMetadata` if the store
 * is unavailable.
 */
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
    const settings = await getPublicSettings();

    const seoTitle =
        settings?.globalSeo?.title ?? `${identity.name} — ${identity.owner}`;
    const seoDescription =
        settings?.globalSeo?.description ?? identity.description;

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
            card: settings?.globalSeo?.twitterCard ?? "summary_large_image",
            title: seoTitle,
            description: seoDescription,
        },
    };
}
