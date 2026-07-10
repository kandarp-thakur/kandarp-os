/**
 * Store seeder — imports the existing public-site data into the admin JSON
 * store on first boot.
 *
 * The public site's `src/data/*.ts` files are the *seed* source. On first
 * boot (when a collection file does not yet exist), the seeder reads the
 * public data, transforms it into the admin schema, and persists it. After
 * that, the JSON store is the source of truth — edits in the console flow
 * back to the public site via the repository, without touching code.
 *
 * Idempotent: seeding only runs when a collection is empty/missing.
 */

import { randomUUID } from "crypto";

import { ACHIEVEMENTS } from "@/data/achievements";
import { DEPLOYMENTS } from "@/data/experience";
import { INFRA_NODES, INFRA_EDGES } from "@/data/infrastructure";
import { CONTAINERS } from "@/data/projects";
import { SKILL_NODES } from "@/data/skills";
import { SECTIONS, SITE } from "@/utils/constants";
import { hashPassword } from "@/lib/admin/auth";
import { adminEnv } from "@/lib/admin/env";
import { readCollection, writeCollection } from "@/lib/admin/store";
import type {
    ActivityLog,
    Award,
    BlogPost,
    Category,
    Certificate,
    Education,
    Experience,
    InfraEdge,
    InfraNode,
    MediaAsset,
    Profile,
    Project,
    Resume,
    Service,
    Settings,
    SiteCustomization,
    Skill,
    Tag,
    User,
} from "@/lib/admin/types";

const now = () => new Date().toISOString();

/** Generate a stable id. */
const uid = () => randomUUID();

/** A blank SEO block with all required defaults populated. */
const emptySeo = {
    keywords: [],
    twitterCard: "summary" as const,
    noindex: false,
};

/** Empty version history — appended to by the repo on every update. */
const emptyVersions = () => [] as never[];

/* ── Per-collection seeders ────────────────────────────────────────────── */

function seedProjects(): Project[] {
    return CONTAINERS.map((c) => ({
        id: c.id,
        createdAt: now(),
        updatedAt: now(),
        title: c.name,
        slug: c.id,
        description: c.description,
        longDescription: c.longDescription,
        category: "DevOps",
        categories: ["DevOps"],
        stack: c.stack,
        tags: [],
        thumbnail: undefined,
        gallery: [],
        coverImage: undefined,
        githubUrl: c.ports.find((p) => p.label === "GitHub")?.url,
        liveUrl: c.ports.find((p) => p.label.toLowerCase().includes("demo"))
            ?.url,
        demoUrl: undefined,
        architectureDiagram: undefined,
        features: [],
        challenges: [],
        solutions: [],
        status: "published" as const,
        featured: false,
        displayOrder: 0,
        publishedDate: c.created,
        containerStatus: c.status,
        statusDetail: c.statusDetail,
        image: c.image,
        created: c.created,
        ports: c.ports,
        metrics: c.metrics,
        changelog: c.changelog,
        links: c.links.map((l) => ({
            label: l.label,
            url: l.url,
            variant: l.variant,
        })),
        seo: { ...emptySeo },
        relatedBlogIds: [],
        relatedSkillIds: [],
        relatedExperienceIds: [],
        relatedInfraIds: [],
        versionHistory: emptyVersions(),
        archivedAt: null,
    })) satisfies Project[];
}

function seedExperience(): Experience[] {
    return DEPLOYMENTS.map((d, i) => ({
        id: d.id,
        createdAt: now(),
        updatedAt: now(),
        role: d.role,
        company: d.company,
        companyUrl: d.companyUrl,
        companyLogo: undefined,
        employmentType: "full-time" as const,
        location: "",
        startDate: d.startDate,
        endDate: d.endDate,
        currentCompany: d.status === "active",
        status: d.status,
        summary: d.summary,
        description: d.summary,
        responsibilities: [],
        achievements: d.changelog,
        technologies: d.stack,
        version: d.version,
        image: d.image,
        replicas: d.replicas,
        uptime: d.uptime,
        links: d.links.map((l) => ({
            label: l.label,
            url: l.url,
            variant: "secondary" as const,
        })),
        displayOrder: i,
        relatedProjectIds: [],
        relatedSkillIds: [],
        versionHistory: emptyVersions(),
        archivedAt: null,
    })) satisfies Experience[];
}

function seedSkills(): Skill[] {
    return SKILL_NODES.map((s, i) => ({
        id: s.id,
        createdAt: now(),
        updatedAt: now(),
        name: s.name,
        abbr: s.abbr,
        slug: s.id,
        domain: s.domain,
        category: s.domain,
        color: "#6366f1",
        description: s.tagline,
        status: s.status,
        tagline: s.tagline,
        icon: undefined,
        level: s.status === "active" ? 90 : s.status === "idle" ? 65 : 35,
        years: 1,
        featured: s.status === "active",
        priority: s.status === "active" ? 10 : 0,
        projectsUsingSkill: [],
        x: s.x,
        y: s.y,
        connections: s.connections,
        displayOrder: i,
        relatedProjectIds: [],
        relatedBlogIds: [],
        relatedInfraIds: [],
        versionHistory: emptyVersions(),
        archivedAt: null,
    })) satisfies Skill[];
}

function seedInfraNodes(): InfraNode[] {
    return INFRA_NODES.map((n, i) => ({
        id: n.id,
        createdAt: now(),
        updatedAt: now(),
        name: n.name,
        slug: n.id,
        icon: n.icon,
        color: "#22d3ee",
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
        links: n.links.map((l) => ({
            label: l.label,
            url: l.url,
            variant: l.variant,
        })),
        connections: [],
        displayOrder: i,
        relatedProjectIds: [],
        relatedBlogIds: [],
        relatedSkillIds: [],
        versionHistory: emptyVersions(),
        archivedAt: null,
    })) satisfies InfraNode[];
}

function seedInfraEdges(): InfraEdge[] {
    return INFRA_EDGES.map((e) => ({
        id: uid(),
        createdAt: now(),
        updatedAt: now(),
        from: e.from,
        to: e.to,
        label: e.label ?? "",
    })) satisfies InfraEdge[];
}

function seedAwards(): Award[] {
    return ACHIEVEMENTS.map((a, i) => ({
        id: a.id,
        createdAt: now(),
        updatedAt: now(),
        title: a.title,
        organization: "",
        description: a.description,
        tier: a.tier,
        date: a.date,
        icon: a.icon,
        category: a.category ?? "General",
        image: undefined,
        certificate: undefined,
        link: undefined,
        featured: a.tier === "legendary" || a.tier === "epic",
        displayOrder: i,
        archivedAt: null,
    })) satisfies Award[];
}

function seedUsers(): User[] {
    return [
        {
            id: uid(),
            createdAt: now(),
            updatedAt: now(),
            name: SITE.owner,
            email: adminEnv.ownerEmail,
            passwordHash: hashPassword(adminEnv.ownerPassword),
            role: "owner" as const,
            avatar: undefined,
            bio: "",
            totpSecret: null,
            totpEnabled: false,
            status: "active" as const,
            lastLoginAt: null,
            sessions: [],
        },
    ] satisfies User[];
}

/* ── Profile (singleton) ───────────────────────────────────────────────── */

/**
 * Default profile — seeded from the SITE identity constants. The profile
 * image starts null (the hero renders its monogram placeholder) until the
 * admin uploads/selects one via the Media Library.
 */
function seedProfile(): Profile {
    return {
        id: "singleton",
        createdAt: now(),
        updatedAt: now(),
        name: SITE.owner,
        designation: "DevOps & Cloud Engineer",
        bio: SITE.description,
        profileImageId: null,
        email: SITE.email,
        phone: SITE.phone,
        github: undefined,
        linkedin: undefined,
        resume: "/resume.pdf",
        socialLinks: [],
    } satisfies Profile;
}

/* ── Settings (singleton) ──────────────────────────────────────────────── */

function seedSettings(): Settings {
    return {
        id: "singleton",
        createdAt: now(),
        updatedAt: now(),
        siteName: SITE.name,
        ownerName: SITE.owner,
        logo: undefined,
        favicon: "/icon.svg",
        email: SITE.email,
        phone: SITE.phone,
        contact: {
            email: SITE.email,
            phone: SITE.phone,
            address: "",
            location: SITE.timezone,
        },
        socials: [],
        brand: {
            primaryColor: "#6366f1",
            accentColor: "#22d3ee",
            tagline: SITE.description,
            description: SITE.description,
        },
        theme: "dark" as const,
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
        navigation: [
            {
                id: uid(),
                label: "Projects",
                href: "/projects",
                visible: true,
                external: false,
                children: [],
            },
            {
                id: uid(),
                label: "Experience",
                href: "/experience",
                visible: true,
                external: false,
                children: [],
            },
            {
                id: uid(),
                label: "Skills",
                href: "/skills",
                visible: true,
                external: false,
                children: [],
            },
            {
                id: uid(),
                label: "Infrastructure",
                href: "/infrastructure",
                visible: true,
                external: false,
                children: [],
            },
            {
                id: uid(),
                label: "Blog",
                href: "/blog",
                visible: true,
                external: false,
                children: [],
            },
            {
                id: uid(),
                label: "About",
                href: "/about",
                visible: true,
                external: false,
                children: [],
            },
            {
                id: uid(),
                label: "Contact",
                href: "/contact",
                visible: true,
                external: false,
                children: [],
            },
        ],
        footer: {
            columns: [
                {
                    id: uid(),
                    title: "Navigate",
                    links: [
                        {
                            id: uid(),
                            label: "Projects",
                            href: "/projects",
                            external: false,
                        },
                        {
                            id: uid(),
                            label: "Experience",
                            href: "/experience",
                            external: false,
                        },
                        {
                            id: uid(),
                            label: "Skills",
                            href: "/skills",
                            external: false,
                        },
                    ],
                },
                {
                    id: uid(),
                    title: "Resources",
                    links: [
                        {
                            id: uid(),
                            label: "Blog",
                            href: "/blog",
                            external: false,
                        },
                        {
                            id: uid(),
                            label: "Infrastructure",
                            href: "/infrastructure",
                            external: false,
                        },
                        {
                            id: uid(),
                            label: "Contact",
                            href: "/contact",
                            external: false,
                        },
                    ],
                },
            ],
            copyright: `© ${new Date().getFullYear()} ${SITE.name}. All rights reserved.`,
            showSocials: true,
        },
        animationsEnabled: true,
        performanceMode: "auto" as const,
        maintenanceMode: false,
        maintenanceMessage: "",
        globalSeo: {
            ...emptySeo,
            title: `${SITE.name} — ${SITE.owner}`,
            description: SITE.description,
            twitterCard: "summary_large_image" as const,
        },
        apiKeys: [],
        environmentVariables: [],
        cache: {
            enabled: true,
            ttlSeconds: 300,
            strategy: "filesystem",
        },
        integrations: [],
        customScripts: "",
        customCss: "",
        customJavaScript: "",
        notificationEmails: [SITE.email],
    } satisfies Settings;
}

/* ── Site customization (Website Builder) ──────────────────────────────── */

/** Default section list — mirrors the public site's section order. */
function seedSiteCustomization(): SiteCustomization {
    const sections = [
        { type: "hero", label: "Hero", anchor: SECTIONS.hero },
        { type: "about", label: "About", anchor: SECTIONS.whoami },
        { type: "projects", label: "Projects", anchor: SECTIONS.containers },
        {
            type: "experience",
            label: "Experience",
            anchor: SECTIONS.deployments,
        },
        { type: "skills", label: "Skills", anchor: SECTIONS.toolkit },
        {
            type: "infrastructure",
            label: "Infrastructure",
            anchor: SECTIONS.infrastructure,
        },
        { type: "awards", label: "Awards", anchor: SECTIONS.achievements },
        { type: "blog", label: "Blog", anchor: SECTIONS.logs },
        { type: "contact", label: "Contact", anchor: SECTIONS.ssh },
        { type: "footer", label: "Footer", anchor: "footer" },
    ];

    return {
        id: "singleton",
        createdAt: now(),
        updatedAt: now(),
        sections: sections.map((s, i) => ({
            id: uid(),
            type: s.type,
            label: s.label,
            visible: true,
            order: i,
            layout: "default",
            background: { type: "none" as const },
            colors: {},
            icon: undefined,
            animation: {
                enabled: true,
                type: "fade-up",
                duration: 600,
                delay: 0,
            },
            content: { anchor: s.anchor },
            buttons: [],
            visibility: {
                desktop: true,
                tablet: true,
                mobile: true,
                requireAuth: false,
            },
        })),
        page: {
            maxWidth: "max-w-5xl",
            sectionSpacing: "py-16",
            containerPadding: "px-4 sm:px-6",
        },
    } satisfies SiteCustomization;
}

/* ── Empty collections (start fresh) ────────────────────────────────────── */

const emptyBlog = (): BlogPost[] => [];
const emptyEducation = (): Education[] => [];
const emptyCertificates = (): Certificate[] => [];
const emptyServices = (): Service[] => [];
const emptyResumes = (): Resume[] => [];
const emptyMedia = (): MediaAsset[] => [];
const emptyAnalytics = (): never[] => [];
const emptyActivity = (): ActivityLog[] => [];
const emptyCategories = (): Category[] => [];
const emptyTags = (): Tag[] => [];

/* ── Orchestrator ───────────────────────────────────────────────────────── */

/** Seed a collection only if it is currently empty. */
async function seedIfEmpty<T>(name: string, seeder: () => T[]): Promise<void> {
    const existing = readCollection<T>(name);
    if (existing.length > 0) return;
    await writeCollection(name, seeder());
}

/** Seed the settings singleton only if it is missing. */
async function seedSettingsIfMissing(): Promise<void> {
    const existing = readCollection<Settings>("settings");
    if (existing.length > 0) return;
    await writeCollection("settings", [seedSettings()]);
}

/** Seed the profile singleton only if it is missing. */
async function seedProfileIfMissing(): Promise<void> {
    const existing = readCollection<Profile>("profiles");
    if (existing.length > 0) return;
    await writeCollection("profiles", [seedProfile()]);
}

/** Seed the site-customization singleton only if it is missing. */
async function seedSiteCustomizationIfMissing(): Promise<void> {
    const existing = readCollection<SiteCustomization>("siteCustomization");
    if (existing.length > 0) return;
    await writeCollection("siteCustomization", [seedSiteCustomization()]);
}

/** Seed every collection. Idempotent — safe to call on every boot. */
export async function seedStore(): Promise<void> {
    await seedIfEmpty("projects", seedProjects);
    await seedIfEmpty("experience", seedExperience);
    await seedIfEmpty("skills", seedSkills);
    await seedIfEmpty("infraNodes", seedInfraNodes);
    await seedIfEmpty("infraEdges", seedInfraEdges);
    await seedIfEmpty("awards", seedAwards);
    await seedIfEmpty("users", seedUsers);
    await seedSettingsIfMissing();
    await seedProfileIfMissing();
    await seedSiteCustomizationIfMissing();
    await seedIfEmpty("blogPosts", emptyBlog);
    await seedIfEmpty("education", emptyEducation);
    await seedIfEmpty("certificates", emptyCertificates);
    await seedIfEmpty("services", emptyServices);
    await seedIfEmpty("resumes", emptyResumes);
    await seedIfEmpty("media", emptyMedia);
    await seedIfEmpty("analytics", emptyAnalytics);
    await seedIfEmpty("activityLogs", emptyActivity);
    await seedIfEmpty("categories", emptyCategories);
    await seedIfEmpty("tags", emptyTags);
}

/* ── Process-wide seed singleton ─────────────────────────────────────────── */

/**
 * A module-level promise that resolves once the store has been seeded.
 *
 * In Next.js dev, route handlers and server components are evaluated lazily
 * and there is no single "app boot" hook. We therefore trigger seeding
 * lazily from the earliest entry points (login route, console layout) via
 * this singleton. The first caller kicks off `seedStore()`; every subsequent
 * caller awaits the same in-flight promise and returns immediately.
 *
 * This is safe because `seedStore()` is idempotent — it only writes when a
 * collection is empty.
 */
let seedPromise: Promise<void> | null = null;

/**
 * Ensure the store has been seeded. Call this from any admin entry point
 * (route handler or server component) before reading collections. Returns
 * immediately if seeding already completed or is in-flight elsewhere.
 */
export function ensureSeeded(): Promise<void> {
    if (!seedPromise) {
        seedPromise = seedStore().catch((err) => {
            // Reset so a future call can retry after a transient failure.
            seedPromise = null;
            throw err;
        });
    }
    return seedPromise;
}
