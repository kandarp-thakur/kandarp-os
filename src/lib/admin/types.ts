/**
 * Admin domain models — the relational schema for the Internal Engineering
 * Console.
 *
 * These are the CMS entities: Projects, Blog, Experience, Skills,
 * Infrastructure, Awards, Education, Certificates, Services, Resume, Media,
 * Users, Settings, SiteCustomization, Analytics, Categories, Tags, SEO,
 * ActivityLog.
 *
 * Every entity carries audit fields (`id`, `createdAt`, `updatedAt`,
 * `createdBy`) and a soft-delete flag where appropriate. Zod schemas are the
 * source of truth (mirrors the public-site convention); types are inferred.
 *
 * The public site's `src/data/*.ts` files are the *seed* source — on first
 * boot the store imports them so the console starts populated. After that,
 * the JSON store is the source of truth and the public site reads from it
 * (via the repository) so edits in the console appear on the site without
 * touching code.
 *
 * Every content entity also carries:
 *   • `archivedAt` — soft-archive (restore-able) timestamp.
 *   • `versionHistory` — append-only snapshots for undo / version history.
 *   • bidirectional relationship id arrays (synced by the relationship engine).
 */

import { z } from "zod";

/* ── Shared primitives ─────────────────────────────────────────────────── */

/** ISO-8601 timestamp string. */
const iso = z.string().datetime();

/** A slug — lowercase, kebab-case. */
const slug = z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be kebab-case");

/** Audit fields shared by every entity. */
const audit = {
    id: z.string(),
    createdAt: iso,
    updatedAt: iso,
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
};

/** Soft-archive fields — present on every content entity. */
const archivable = {
    archivedAt: z.string().nullable().default(null),
    archivedBy: z.string().optional(),
};

/** A key/value spec line (reused from the public infra/projects models). */
const specPair = z.object({ label: z.string(), value: z.string() });

/** A labeled metric. */
const metricPair = z.object({ label: z.string(), value: z.string() });

/** A labeled external link with a CTA variant. */
const linkPair = z.object({
    label: z.string(),
    url: z.string().url(),
    variant: z.enum(["primary", "secondary"]).default("secondary"),
});

/** A version-history snapshot entry (undo / version history). */
export const versionEntrySchema = z.object({
    version: z.number().int(),
    /** Deep snapshot of the entity at save time (minus versionHistory). */
    snapshot: z.record(z.unknown()),
    savedAt: iso,
    savedBy: z.string().optional(),
    label: z.string().optional(),
});
export type VersionEntry = z.infer<typeof versionEntrySchema>;

/* ── SEO metadata (embedded on every publishable entity) ───────────────── */

export const seoMetaSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    canonicalUrl: z.string().url().optional(),
    ogImage: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    twitterCard: z.enum(["summary", "summary_large_image"]).default("summary"),
    noindex: z.boolean().default(false),
    jsonLd: z.record(z.unknown()).optional(),
});
export type SeoMeta = z.infer<typeof seoMetaSchema>;

/* ── Publish state ─────────────────────────────────────────────────────── */

export const publishStatusSchema = z.enum([
    "draft",
    "published",
    "scheduled",
    "archived",
]);
export type PublishStatus = z.infer<typeof publishStatusSchema>;

/* ── Project ───────────────────────────────────────────────────────────── */

export const projectSchema = z.object({
    ...audit,
    ...archivable,
    title: z.string(),
    slug: slug,
    description: z.string(),
    longDescription: z.string(),
    category: z.string().default("General"),
    categories: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    githubUrl: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    architectureDiagram: z.string().optional(),
    features: z.array(z.string()).default([]),
    challenges: z.array(z.string()).default([]),
    solutions: z.array(z.string()).default([]),
    status: publishStatusSchema.default("draft"),
    featured: z.boolean().default(false),
    displayOrder: z.number().int().default(0),
    publishedDate: z.string().optional(),
    /** Container-fleet metadata (preserved from the public model). */
    containerStatus: z
        .enum(["running", "exited", "created"])
        .default("created"),
    statusDetail: z.string().default("Created"),
    image: z.string().default(""),
    created: z.string().optional(),
    ports: z
        .array(
            z.object({
                port: z.string(),
                label: z.string(),
                url: z.string().url(),
            }),
        )
        .default([]),
    metrics: z.array(metricPair).default([]),
    changelog: z
        .array(z.object({ version: z.string(), text: z.string() }))
        .default([]),
    links: z.array(linkPair).default([]),
    seo: seoMetaSchema.default({}),
    /** Relationship ids — synced bidirectionally by the relationship engine. */
    relatedBlogIds: z.array(z.string()).default([]),
    relatedSkillIds: z.array(z.string()).default([]),
    relatedExperienceIds: z.array(z.string()).default([]),
    relatedInfraIds: z.array(z.string()).default([]),
    versionHistory: z.array(versionEntrySchema).default([]),
});
export type Project = z.infer<typeof projectSchema>;

/* ── Blog post ─────────────────────────────────────────────────────────── */

export const blogPostSchema = z.object({
    ...audit,
    ...archivable,
    title: z.string(),
    slug: slug,
    excerpt: z.string(),
    /** MDX body — rendered with the existing next-mdx-remote pipeline. */
    content: z.string().default(""),
    /** Optional rich-text (HTML) body for non-markdown authoring. */
    richText: z.string().default(""),
    /** Extracted/embedded code blocks (for syntax-highlighted previews). */
    codeBlocks: z
        .array(z.object({ language: z.string(), code: z.string() }))
        .default([]),
    /** Mermaid diagram sources embedded in the post. */
    mermaid: z.array(z.string()).default([]),
    category: z.string().default("General"),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featuredImage: z.string().optional(),
    coverImage: z.string().optional(),
    status: publishStatusSchema.default("draft"),
    featured: z.boolean().default(false),
    publishedDate: z.string().optional(),
    scheduledDate: z.string().optional(),
    readingTime: z.number().int().default(0),
    canonicalUrl: z.string().url().optional(),
    relatedPostIds: z.array(z.string()).default([]),
    seo: seoMetaSchema.default({}),
    authorId: z.string().optional(),
    /** Relationship ids — synced bidirectionally. */
    relatedProjectIds: z.array(z.string()).default([]),
    relatedSkillIds: z.array(z.string()).default([]),
    relatedInfraIds: z.array(z.string()).default([]),
    versionHistory: z.array(versionEntrySchema).default([]),
});
export type BlogPost = z.infer<typeof blogPostSchema>;

/* ── Experience (deployment) ───────────────────────────────────────────── */

export const experienceSchema = z.object({
    ...audit,
    ...archivable,
    role: z.string(),
    company: z.string(),
    companyUrl: z.string().url().optional(),
    companyLogo: z.string().optional(),
    employmentType: z
        .enum(["full-time", "part-time", "contract", "internship", "freelance"])
        .default("full-time"),
    location: z.string().default(""),
    startDate: z.string(),
    endDate: z.string().nullable().default(null),
    currentCompany: z.boolean().default(false),
    status: z.enum(["active", "completed"]).default("completed"),
    summary: z.string(),
    description: z.string().default(""),
    responsibilities: z.array(z.string()).default([]),
    achievements: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
    version: z.string().default("v1.0"),
    image: z.string().default(""),
    replicas: z.string().default("1/1"),
    uptime: z.string().default(""),
    links: z.array(linkPair).default([]),
    displayOrder: z.number().int().default(0),
    /** Relationship ids — synced bidirectionally. */
    relatedProjectIds: z.array(z.string()).default([]),
    relatedSkillIds: z.array(z.string()).default([]),
    versionHistory: z.array(versionEntrySchema).default([]),
});
export type Experience = z.infer<typeof experienceSchema>;

/* ── Skill (mesh node) ─────────────────────────────────────────────────── */

export const skillSchema = z.object({
    ...audit,
    ...archivable,
    name: z.string(),
    abbr: z.string().default(""),
    slug: slug,
    domain: z
        .enum(["frontend", "backend", "devops", "data", "design"])
        .default("devops"),
    category: z.string().default("General"),
    color: z.string().default("#6366f1"),
    description: z.string().default(""),
    status: z.enum(["active", "idle", "learning"]).default("active"),
    tagline: z.string().default(""),
    icon: z.string().optional(),
    /** Experience level 0–100 (drives a proficiency bar in the editor). */
    level: z.number().int().min(0).max(100).default(80),
    years: z.number().min(0).default(1),
    featured: z.boolean().default(false),
    priority: z.number().int().default(0),
    projectsUsingSkill: z.array(z.string()).default([]),
    /** Grid position 0–100 (resolution-independent layout). */
    x: z.number().min(0).max(100).default(50),
    y: z.number().min(0).max(100).default(50),
    /** Symmetric connection ids — edges are derived. */
    connections: z.array(z.string()).default([]),
    displayOrder: z.number().int().default(0),
    /** Relationship ids — synced bidirectionally. */
    relatedProjectIds: z.array(z.string()).default([]),
    relatedBlogIds: z.array(z.string()).default([]),
    relatedInfraIds: z.array(z.string()).default([]),
    versionHistory: z.array(versionEntrySchema).default([]),
});
export type Skill = z.infer<typeof skillSchema>;

/* ── Infrastructure node ───────────────────────────────────────────────── */

export const infraNodeSchema = z.object({
    ...audit,
    ...archivable,
    name: z.string(),
    slug: slug,
    icon: z.string().default("server"),
    color: z.string().default("#22d3ee"),
    role: z.string(),
    status: z.enum(["active", "standby", "maintenance"]).default("active"),
    statusDetail: z.string().default("Up"),
    x: z.number().min(0).max(100).default(50),
    y: z.number().min(0).max(100).default(50),
    description: z.string(),
    stack: z.array(z.string()).default([]),
    specs: z.array(specPair).default([]),
    metrics: z.array(metricPair).default([]),
    notes: z.array(z.string()).default([]),
    links: z.array(linkPair).default([]),
    connections: z.array(z.string()).default([]),
    displayOrder: z.number().int().default(0),
    /** Relationship ids — synced bidirectionally. */
    relatedProjectIds: z.array(z.string()).default([]),
    relatedBlogIds: z.array(z.string()).default([]),
    relatedSkillIds: z.array(z.string()).default([]),
    versionHistory: z.array(versionEntrySchema).default([]),
});
export type InfraNode = z.infer<typeof infraNodeSchema>;

/** An infrastructure edge — an explicit labelled relationship. */
export const infraEdgeSchema = z.object({
    ...audit,
    from: z.string(),
    to: z.string(),
    label: z.string().default(""),
});
export type InfraEdge = z.infer<typeof infraEdgeSchema>;

/* ── Award ─────────────────────────────────────────────────────────────── */

export const awardSchema = z.object({
    ...audit,
    ...archivable,
    title: z.string(),
    organization: z.string().default(""),
    description: z.string(),
    tier: z.enum(["legendary", "epic", "rare", "common"]).default("common"),
    date: z.string(),
    icon: z.string().default("Award"),
    category: z.string().default("General"),
    image: z.string().optional(),
    certificate: z.string().optional(),
    link: z.string().url().optional(),
    featured: z.boolean().default(false),
    displayOrder: z.number().int().default(0),
});
export type Award = z.infer<typeof awardSchema>;

/* ── Education ─────────────────────────────────────────────────────────── */

export const educationSchema = z.object({
    ...audit,
    ...archivable,
    institution: z.string(),
    degree: z.string(),
    field: z.string().default(""),
    stream: z.string().default(""),
    startDate: z.string(),
    endDate: z.string().nullable().default(null),
    status: z.enum(["ongoing", "completed"]).default("completed"),
    grade: z.string().default(""),
    description: z.string().default(""),
    logo: z.string().optional(),
    certificates: z.array(z.string()).default([]),
    displayOrder: z.number().int().default(0),
});
export type Education = z.infer<typeof educationSchema>;

/* ── Certificate ───────────────────────────────────────────────────────── */

export const certificateSchema = z.object({
    ...audit,
    ...archivable,
    title: z.string(),
    issuer: z.string(),
    provider: z.string().default(""),
    issueDate: z.string(),
    expiryDate: z.string().nullable().default(null),
    credentialId: z.string().default(""),
    credentialUrl: z.string().url().optional(),
    verificationUrl: z.string().url().optional(),
    image: z.string().optional(),
    skills: z.array(z.string()).default([]),
    description: z.string().default(""),
    displayOrder: z.number().int().default(0),
});
export type Certificate = z.infer<typeof certificateSchema>;

/* ── Service ───────────────────────────────────────────────────────────── */

export const serviceSchema = z.object({
    ...audit,
    ...archivable,
    title: z.string(),
    name: z.string().default(""),
    slug: slug,
    description: z.string(),
    icon: z.string().default("Wrench"),
    features: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
    cta: z
        .object({
            label: z.string().default("Learn more"),
            url: z.string().default(""),
        })
        .default({}),
    price: z.string().default(""),
    featured: z.boolean().default(false),
    displayOrder: z.number().int().default(0),
});
export type Service = z.infer<typeof serviceSchema>;

/* ── Resume ────────────────────────────────────────────────────────────── */

export const resumeSchema = z.object({
    ...audit,
    ...archivable,
    version: z.string(),
    label: z.string().default("Resume"),
    fileUrl: z.string(),
    fileSize: z.number().default(0),
    mimeType: z.string().default("application/pdf"),
    isPrimary: z.boolean().default(false),
    notes: z.string().default(""),
});
export type Resume = z.infer<typeof resumeSchema>;

/* ── Profile (singleton) ───────────────────────────────────────────────── */

/**
 * A social link on the public profile. Reuses the same shape as the settings
 * socials so the profile can carry its own set independent of site settings.
 */
export const profileSocialLinkSchema = z.object({
    id: z.string(),
    platform: z.string(),
    url: z.string().url(),
    icon: z.string().optional(),
    /** Display label override (falls back to the platform name). */
    label: z.string().optional(),
});
export type ProfileSocialLink = z.infer<typeof profileSocialLinkSchema>;

/**
 * The public profile — the single record that powers the hero, about, and
 * contact sections. This is the CMS source of truth for the person behind
 * the portfolio.
 *
 * The profile image is stored as a Media Library id (`profileImageId`), never
 * as a raw URL. The public site resolves the id → MediaAsset at render time
 * so deleting the asset automatically falls back to the placeholder. This is
 * the same reusable media-picker contract every other CMS entity will use
 * (blog covers, project thumbnails, logos, …).
 */
export const profileSchema = z.object({
    ...audit,
    /** Singleton id — always "singleton". */
    id: z.string().default("singleton"),
    /** Full display name. */
    name: z.string(),
    /** Professional title / designation (e.g. "DevOps Engineer"). */
    designation: z.string().default(""),
    /** Short biography / summary. */
    bio: z.string().default(""),
    /**
     * Profile image — a Media Library asset id. Resolved to a MediaAsset at
     * render time. Null/empty → the hero renders its monogram placeholder.
     */
    profileImageId: z.string().nullable().default(null),
    /** Contact email. */
    email: z.string().email().default(""),
    /** Contact phone. */
    phone: z.string().default(""),
    /** GitHub profile URL. */
    github: z.string().url().optional(),
    /** LinkedIn profile URL. */
    linkedin: z.string().url().optional(),
    /** Resume URL (relative path or absolute). */
    resume: z.string().default(""),
    /** Additional social links (Twitter/X, website, etc.). */
    socialLinks: z.array(profileSocialLinkSchema).default([]),
});
export type Profile = z.infer<typeof profileSchema>;

/* ── Media asset ───────────────────────────────────────────────────────── */

/**
 * A responsive image variant. Generated server-side by the image-optimization
 * pipeline (sharp). Each variant is a fixed width bucket; the public site
 * picks the smallest variant that satisfies the rendered size via `srcset`.
 *
 * Variants are produced in the original format (kept) AND in WebP + AVIF so
 * the browser can negotiate the best codec through a `<picture>` source set.
 */
export const mediaVariantSchema = z.object({
    /** Variant width key: "thumbnail" | "medium" | "large". */
    size: z.enum(["thumbnail", "medium", "large"]),
    /** Pixel width of this variant. */
    width: z.number().int(),
    /** Pixel height of this variant (preserves aspect ratio). */
    height: z.number().int(),
    /** Original-format variant path (relative to public root). */
    path: z.string(),
    /** WebP variant path (relative to public root). */
    webp: z.string().optional(),
    /** AVIF variant path (relative to public root). */
    avif: z.string().optional(),
    /** File size in bytes of the original-format variant. */
    bytes: z.number().int().default(0),
});
export type MediaVariant = z.infer<typeof mediaVariantSchema>;

/**
 * A focal point — the subject of the image. Stored as normalized 0–1
 * coordinates so it survives re-crops and re-optimizations. The public site
 * uses it for `object-position` so cover-fit keeps the subject in frame.
 */
export const focalPointSchema = z.object({
    /** Horizontal position, 0 (left) → 1 (right). */
    x: z.number().min(0).max(1),
    /** Vertical position, 0 (top) → 1 (bottom). */
    y: z.number().min(0).max(1),
});
export type FocalPoint = z.infer<typeof focalPointSchema>;

export const mediaAssetSchema = z.object({
    ...audit,
    ...archivable,
    name: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number(),
    /** Relative path under the media root (served statically). */
    path: z.string(),
    /** Optional thumbnail path for image previews (legacy + quick grid view). */
    thumbnail: z.string().optional(),
    alt: z.string().default(""),
    folder: z.string().default("/"),
    width: z.number().optional(),
    height: z.number().optional(),
    tags: z.array(z.string()).default([]),
    /** Arbitrary metadata (EXIF, source, etc.). */
    metadata: z.record(z.unknown()).default({}),
    /** Number of entities referencing this asset (denormalized). */
    usageCount: z.number().int().default(0),
    /** Whether the asset has been compressed/optimized. */
    optimized: z.boolean().default(false),
    /**
     * Generated responsive variants (thumbnail/medium/large). Empty for
     * non-image assets. Populated by the image-optimization pipeline.
     */
    variants: z.array(mediaVariantSchema).default([]),
    /**
     * Tiny inline blur placeholder — a base64 data URI (a heavily downscaled,
     * blurred JPEG). Shown by the public site while the real image loads,
     * then cross-faded. Empty string for non-image assets.
     */
    blurDataUrl: z.string().default(""),
    /**
     * Optional focal point (normalized 0–1). Drives `object-position` on the
     * public site so cover-fit keeps the subject centered after cropping.
     */
    focalPoint: focalPointSchema.nullable().default(null),
});
export type MediaAsset = z.infer<typeof mediaAssetSchema>;

/* ── User ──────────────────────────────────────────────────────────────── */

export const userSchema = z.object({
    ...audit,
    name: z.string(),
    email: z.string().email(),
    /** scrypt hash — never the plaintext. */
    passwordHash: z.string(),
    role: z.enum(["owner", "admin", "editor", "viewer"]).default("viewer"),
    avatar: z.string().optional(),
    bio: z.string().default(""),
    /** 2FA — base32 TOTP secret. Null until enrolled. */
    totpSecret: z.string().nullable().default(null),
    totpEnabled: z.boolean().default(false),
    status: z.enum(["active", "suspended", "invited"]).default("active"),
    lastLoginAt: z.string().nullable().default(null),
    /** Active sessions (token id → metadata). */
    sessions: z
        .array(
            z.object({
                id: z.string(),
                createdAt: iso,
                ip: z.string().default(""),
                userAgent: z.string().default(""),
            }),
        )
        .default([]),
});
export type User = z.infer<typeof userSchema>;

/** A user with secrets stripped — safe to send to the client. */
export type SafeUser = Omit<User, "passwordHash" | "totpSecret">;

/* ── Settings (singleton) ──────────────────────────────────────────────── */

/** A navigation item for the public site (editable, reorderable). */
export const navItemSchema = z.object({
    id: z.string(),
    label: z.string(),
    href: z.string(),
    icon: z.string().optional(),
    /** Show/hide toggle. */
    visible: z.boolean().default(true),
    /** Open in a new tab. */
    external: z.boolean().default(false),
    /** Optional dropdown children. */
    children: z
        .array(
            z.object({
                id: z.string(),
                label: z.string(),
                href: z.string(),
                external: z.boolean().default(false),
            }),
        )
        .default([]),
});
export type NavItem = z.infer<typeof navItemSchema>;

/** A footer column (editable). */
export const footerColumnSchema = z.object({
    id: z.string(),
    title: z.string(),
    links: z
        .array(
            z.object({
                id: z.string(),
                label: z.string(),
                href: z.string(),
                external: z.boolean().default(false),
            }),
        )
        .default([]),
});
export type FooterColumn = z.infer<typeof footerColumnSchema>;

/** A social link. */
export const socialLinkSchema = z.object({
    id: z.string(),
    platform: z.string(),
    url: z.string().url(),
    icon: z.string().optional(),
});
export type SocialLink = z.infer<typeof socialLinkSchema>;

/** A named integration (e.g. GitHub, Vercel, Analytics). */
export const integrationSchema = z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean().default(false),
    config: z.record(z.unknown()).default({}),
});
export type Integration = z.infer<typeof integrationSchema>;

export const settingsSchema = z.object({
    ...audit,
    siteName: z.string().default("Kandarp OS"),
    ownerName: z.string().default("Kandarp Kumar Thakur"),
    logo: z.string().optional(),
    favicon: z.string().optional(),
    /** Hero portrait photo — uploaded via the admin media uploader. */
    heroPortrait: z.string().optional(),
    email: z.string().email(),
    phone: z.string().default(""),
    /** Contact information block. */
    contact: z
        .object({
            email: z.string().default(""),
            phone: z.string().default(""),
            address: z.string().default(""),
            location: z.string().default(""),
        })
        .default({}),
    socials: z.array(socialLinkSchema).default([]),
    /** Brand. */
    brand: z
        .object({
            primaryColor: z.string().default("#6366f1"),
            accentColor: z.string().default("#22d3ee"),
            tagline: z.string().default(""),
            description: z.string().default(""),
        })
        .default({}),
    /** Theme. */
    theme: z.enum(["dark", "light"]).default("dark"),
    /** Typography. */
    typography: z
        .object({
            headingFont: z.string().default("Space Grotesk"),
            bodyFont: z.string().default("Inter"),
            monoFont: z.string().default("JetBrains Mono"),
            baseSize: z.string().default("16px"),
            scale: z.string().default("1.25"),
        })
        .default({}),
    /** Color palette (editable design tokens). */
    colors: z
        .object({
            background: z.string().default("#0a0a0f"),
            surface: z.string().default("#12121a"),
            text: z.string().default("#e5e7eb"),
            textMuted: z.string().default("#9ca3af"),
            border: z.string().default("#27272a"),
            success: z.string().default("#22c55e"),
            warning: z.string().default("#f59e0b"),
            error: z.string().default("#ef4444"),
        })
        .default({}),
    /** Public-site navigation (editable, reorderable). */
    navigation: z.array(navItemSchema).default([]),
    /** Public-site footer (editable). */
    footer: z
        .object({
            columns: z.array(footerColumnSchema).default([]),
            copyright: z.string().default(""),
            showSocials: z.boolean().default(true),
        })
        .default({}),
    animationsEnabled: z.boolean().default(true),
    performanceMode: z.enum(["auto", "high", "eco"]).default("auto"),
    maintenanceMode: z.boolean().default(false),
    maintenanceMessage: z.string().default(""),
    globalSeo: seoMetaSchema.default({}),
    apiKeys: z
        .array(
            z.object({
                id: z.string(),
                name: z.string(),
                key: z.string(),
                enabled: z.boolean(),
            }),
        )
        .default([]),
    /** Environment variables (stored encrypted-at-rest conceptually; values masked in UI). */
    environmentVariables: z
        .array(
            z.object({
                id: z.string(),
                key: z.string(),
                value: z.string(),
                description: z.string().default(""),
            }),
        )
        .default([]),
    /** Cache + performance settings. */
    cache: z
        .object({
            enabled: z.boolean().default(true),
            ttlSeconds: z.number().int().default(300),
            strategy: z
                .enum(["memory", "filesystem", "none"])
                .default("filesystem"),
        })
        .default({}),
    /** Third-party integrations. */
    integrations: z.array(integrationSchema).default([]),
    /** Custom code injected into the public site. */
    customScripts: z.string().default(""),
    customCss: z.string().default(""),
    customJavaScript: z.string().default(""),
    /** Notification email recipients. */
    notificationEmails: z.array(z.string()).default([]),
});
export type Settings = z.infer<typeof settingsSchema>;

/* ── Site customization (Website Builder) ──────────────────────────────── */

/** A single configurable website section (Hero, About, Projects, …). */
export const sectionConfigSchema = z.object({
    id: z.string(),
    /** Section type key: hero | about | projects | experience | skills | … */
    type: z.string(),
    label: z.string(),
    visible: z.boolean().default(true),
    /** Display order (drag & drop). */
    order: z.number().int().default(0),
    /** Layout variant key (e.g. "grid" | "list" | "terminal"). */
    layout: z.string().default("default"),
    /** Background setting (color | gradient | image | video | none). */
    background: z
        .object({
            type: z
                .enum(["none", "color", "gradient", "image", "video"])
                .default("none"),
            color: z.string().optional(),
            gradient: z.string().optional(),
            image: z.string().optional(),
            video: z.string().optional(),
        })
        .default({ type: "none" }),
    /** Section-level colors. */
    colors: z
        .object({
            heading: z.string().optional(),
            text: z.string().optional(),
            accent: z.string().optional(),
        })
        .default({}),
    /** Section icon (lucide name or url). */
    icon: z.string().optional(),
    /** Animation setting. */
    animation: z
        .object({
            enabled: z.boolean().default(true),
            type: z.string().default("fade-up"),
            duration: z.number().default(600),
            delay: z.number().default(0),
        })
        .default({ enabled: true, type: "fade-up", duration: 600, delay: 0 }),
    /** Arbitrary content overrides (eyebrow, title, subtitle, etc.). */
    content: z.record(z.unknown()).default({}),
    /** CTA buttons. */
    buttons: z
        .array(
            z.object({
                id: z.string(),
                label: z.string(),
                href: z.string(),
                variant: z.string().default("primary"),
            }),
        )
        .default([]),
    /** Visibility rules (device + auth). */
    visibility: z
        .object({
            desktop: z.boolean().default(true),
            tablet: z.boolean().default(true),
            mobile: z.boolean().default(true),
            requireAuth: z.boolean().default(false),
        })
        .default({}),
});
export type SectionConfig = z.infer<typeof sectionConfigSchema>;

export const siteCustomizationSchema = z.object({
    ...audit,
    /** Singleton id. */
    id: z.string().default("singleton"),
    /** Ordered list of configurable sections. */
    sections: z.array(sectionConfigSchema).default([]),
    /** Global page-level settings (max width, spacing, etc.). */
    page: z
        .object({
            maxWidth: z.string().default("max-w-5xl"),
            sectionSpacing: z.string().default("py-16"),
            containerPadding: z.string().default("px-4 sm:px-6"),
        })
        .default({}),
});
export type SiteCustomization = z.infer<typeof siteCustomizationSchema>;

/* ── Analytics event ───────────────────────────────────────────────────── */

export const analyticsEventSchema = z.object({
    ...audit,
    timestamp: iso,
    type: z.enum([
        "pageview",
        "project_click",
        "github_click",
        "resume_download",
        "blog_read",
        "contact_submit",
        "search",
    ]),
    path: z.string().default(""),
    referrer: z.string().default(""),
    country: z.string().default(""),
    device: z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
    browser: z.string().default(""),
    duration: z.number().default(0),
    meta: z.record(z.unknown()).default({}),
});
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

/* ── Activity log (audit trail) ────────────────────────────────────────── */

export const activityLogSchema = z.object({
    ...audit,
    timestamp: iso,
    userId: z.string(),
    userName: z.string(),
    action: z.string(),
    entity: z.string().default(""),
    entityId: z.string().default(""),
    details: z.string().default(""),
    level: z.enum(["info", "warning", "error", "success"]).default("info"),
    ip: z.string().default(""),
});
export type ActivityLog = z.infer<typeof activityLogSchema>;

/* ── Category + Tag (shared taxonomy) ──────────────────────────────────── */

export const categorySchema = z.object({
    ...audit,
    name: z.string(),
    slug: slug,
    description: z.string().default(""),
    color: z.string().default("#6366f1"),
    entityTypes: z.array(z.string()).default([]),
});
export type Category = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
    ...audit,
    name: z.string(),
    slug: slug,
    color: z.string().default("#64748b"),
    usageCount: z.number().int().default(0),
});
export type Tag = z.infer<typeof tagSchema>;

/* ── Collection names (the store's table list) ─────────────────────────── */

export type CollectionName =
    | "projects"
    | "blogPosts"
    | "experience"
    | "skills"
    | "infraNodes"
    | "infraEdges"
    | "awards"
    | "education"
    | "certificates"
    | "services"
    | "resumes"
    | "media"
    | "users"
    | "settings"
    | "siteCustomization"
    | "analytics"
    | "activityLogs"
    | "categories"
    | "tags"
    | "profiles";

/**
 * The set of content collections that support archiving, version history,
 * and the relationship engine. Settings/siteCustomization/users are excluded
 * (they are singletons or special-purpose).
 */
export const CONTENT_COLLECTIONS: CollectionName[] = [
    "projects",
    "blogPosts",
    "experience",
    "skills",
    "infraNodes",
    "awards",
    "education",
    "certificates",
    "services",
    "resumes",
    "media",
];
