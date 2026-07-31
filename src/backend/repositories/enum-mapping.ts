/**
 * Enum case-translation — the bridge between the app-layer (lowercase) and
 * Prisma (UPPERCASE) enum conventions.
 *
 * The application's Zod schemas (`src/backend/schemas/types.ts`) define every
 * enum with lowercase, kebab/snake-case strings (`"published"`, `"full-time"`,
 * `"project_click"`, `"owner"`, …). The Prisma schema, by contrast, defines
 * every enum in UPPER_SNAKE_CASE (`PUBLISHED`, `FULL_TIME`, `PROJECT_CLICK`,
 * …) — the PostgreSQL convention.
 *
 * Without translation, every Prisma write of an enum field throws
 * `PrismaClientValidationError: Invalid value for argument <field>. Expected
 * <EnumName>.`, which surfaces as an HTTP 500. This was the root cause of the
 * login failure: `ensureSeeded()` → `seedStore()` → `create("projects", …)`
 * passed `status: "published"` straight through to Prisma, which rejected it.
 *
 * This module is the single source of truth for the mapping. It is consumed
 * only by the repository's anti-corruption layer (`repo-prisma.ts`), so the
 * rest of the app keeps its lowercase convention and never sees Prisma's
 * UPPER_SNAKE_CASE values.
 *
 * Two transforms:
 *   • `toPrismaEnum(collection, field, value)`  — app → DB (lowercase → UPPER)
 *   • `fromPrismaEnum(collection, field, value)` — DB → app (UPPER → lowercase)
 *
 * Both are total: an unknown value is passed through unchanged (and Prisma
 * will reject it with a clear validation error if it is genuinely invalid),
 * so a typo doesn't silently corrupt data.
 *
 * @see docs/backend/repository.md — the anti-corruption layer + enum mapping.
 */

import type { CollectionName } from "@backend/schemas/types";

/**
 * Per-collection enum field map. Each entry lists the fields on that
 * collection whose values must be translated, plus the lowercase ↔ UPPER
 * value pairs. The pairs are written out in full (rather than derived with
 * `.toUpperCase()`) so the mapping is explicit, auditable, and resilient to
 * values that don't round-trip through simple case folding (e.g.
 * `"full-time"` → `FULL_TIME`, which requires hyphen→underscore too).
 */
const ENUM_MAP: Record<
    CollectionName,
    Record<string, Record<string, string>>
> = {
    projects: {
        status: {
            draft: "DRAFT",
            published: "PUBLISHED",
            scheduled: "SCHEDULED",
            archived: "ARCHIVED",
        },
        containerStatus: {
            running: "RUNNING",
            exited: "EXITED",
            created: "CREATED",
        },
    },
    blogPosts: {
        status: {
            draft: "DRAFT",
            published: "PUBLISHED",
            scheduled: "SCHEDULED",
            archived: "ARCHIVED",
        },
    },
    experience: {
        employmentType: {
            "full-time": "FULL_TIME",
            "part-time": "PART_TIME",
            contract: "CONTRACT",
            internship: "INTERNSHIP",
            freelance: "FREELANCE",
        },
        status: {
            active: "ACTIVE",
            completed: "COMPLETED",
        },
    },
    skills: {
        domain: {
            frontend: "FRONTEND",
            backend: "BACKEND",
            devops: "DEVOPS",
            data: "DATA",
            design: "DESIGN",
        },
        status: {
            active: "ACTIVE",
            idle: "IDLE",
            learning: "LEARNING",
        },
    },
    infraNodes: {
        status: {
            active: "ACTIVE",
            standby: "STANDBY",
            maintenance: "MAINTENANCE",
        },
    },
    awards: {
        tier: {
            legendary: "LEGENDARY",
            epic: "EPIC",
            rare: "RARE",
            common: "COMMON",
        },
    },
    education: {
        status: {
            ongoing: "ONGOING",
            completed: "COMPLETED",
        },
    },
    analytics: {
        type: {
            pageview: "PAGEVIEW",
            project_click: "PROJECT_CLICK",
            github_click: "GITHUB_CLICK",
            resume_download: "RESUME_DOWNLOAD",
            blog_read: "BLOG_READ",
            contact_submit: "CONTACT_SUBMIT",
            search: "SEARCH",
        },
        device: {
            desktop: "DESKTOP",
            mobile: "MOBILE",
            tablet: "TABLET",
        },
    },
    activityLogs: {
        level: {
            info: "INFO",
            warning: "WARNING",
            error: "ERROR",
            success: "SUCCESS",
        },
    },
    users: {
        status: {
            active: "ACTIVE",
            suspended: "SUSPENDED",
            invited: "INVITED",
        },
    },
    // Collections with no enum fields.
    infraEdges: {},
    certificates: {},
    services: {},
    resumes: {},
    media: {},
    settings: {},
    siteCustomization: {},
    categories: {},
    tags: {},
    profiles: {},
};

/**
 * Translate an app-layer (lowercase) enum value to its Prisma (UPPER) form.
 * Unknown values pass through unchanged — Prisma will reject them with a
 * clear validation error if they are genuinely invalid, which is preferable
 * to silently dropping or defaulting them.
 *
 * @param collection The collection name (e.g. "projects").
 * @param field      The enum field name (e.g. "status").
 * @param value      The app-layer value (e.g. "published").
 * @returns The Prisma enum value (e.g. "PUBLISHED"), or the input unchanged.
 */
export function toPrismaEnum(
    collection: CollectionName,
    field: string,
    value: unknown,
): unknown {
    if (value === undefined || value === null) return value;
    const fieldMap = ENUM_MAP[collection]?.[field];
    if (!fieldMap) return value;
    if (typeof value !== "string") return value;
    return fieldMap[value] ?? value;
}

/**
 * Translate a Prisma (UPPER) enum value back to its app-layer (lowercase) form.
 * The reverse lookup is built lazily per (collection, field) and cached so the
 * common read path stays allocation-free after the first hit.
 *
 * @param collection The collection name (e.g. "projects").
 * @param field      The enum field name (e.g. "status").
 * @param value      The Prisma value (e.g. "PUBLISHED").
 * @returns The app-layer value (e.g. "published"), or the input unchanged.
 */
export function fromPrismaEnum(
    collection: CollectionName,
    field: string,
    value: unknown,
): unknown {
    if (value === undefined || value === null) return value;
    const fieldMap = ENUM_MAP[collection]?.[field];
    if (!fieldMap) return value;
    if (typeof value !== "string") return value;
    // Direct lowercase of an UPPER enum value matches the app-layer value for
    // every enum EXCEPT employmentType ("FULL_TIME" → "full_time" ≠ "full-time")
    // and analytics.type ("PROJECT_CLICK" → "project_click" ✓ — happens to
    // match). Use the explicit reverse map to be safe.
    const reverse = reverseMap(collection, field, fieldMap);
    return reverse[value] ?? value;
}

/** Cached reverse maps: `${collection}.${field}` → `{ UPPER: lower }`. */
const reverseCache = new Map<string, Record<string, string>>();

/** Build (and cache) the reverse lookup for a (collection, field) pair. */
function reverseMap(
    collection: CollectionName,
    field: string,
    fieldMap: Record<string, string>,
): Record<string, string> {
    const key = `${collection}.${field}`;
    const cached = reverseCache.get(key);
    if (cached) return cached;
    const reverse: Record<string, string> = {};
    for (const [lower, upper] of Object.entries(fieldMap)) {
        reverse[upper] = lower;
    }
    reverseCache.set(key, reverse);
    return reverse;
}

/**
 * The set of (collection, field) pairs that are enum fields. Used by the
 * repository mapper to iterate only the relevant fields instead of scanning
 * every key of every row.
 */
export const ENUM_FIELDS: ReadonlyArray<{
    collection: CollectionName;
    field: string;
}> = Object.entries(ENUM_MAP).flatMap(([collection, fields]) =>
    Object.keys(fields).map((field) => ({
        collection: collection as CollectionName,
        field,
    })),
);
