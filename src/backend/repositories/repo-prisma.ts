/**
 * Prisma-backed repository — the production data-access layer.
 *
 * This implements the EXACT public API of the original JSON-backed `repo.ts`
 * (list, query, findById, findByField, create, update, remove, duplicate,
 * count, replaceAll, bulk*, reorder, restoreVersion, exportCollection,
 * exportAll, importCollection) so the ~120 route handlers and the
 * relationship engine keep working unchanged.
 *
 * The adapter bridges two representations:
 *
 *   Existing Entity contract (what routes expect):
 *     • `createdAt` / `updatedAt` / `archivedAt` as ISO-8601 strings.
 *     • `createdBy` / `updatedBy` / `archivedBy` as user-id strings.
 *     • `related*Ids` as string arrays (bidirectional, mirrored by the
 *       relationship engine).
 *     • `versionHistory` as an embedded array of snapshots.
 *     • `id` as a cuid string.
 *
 *   Prisma schema (normalized, in the DB):
 *     • `createdAt` / `updatedAt` / `archivedAt` as DateTime.
 *     • `createdById` / `updatedById` / `archivedById` as FK to User.
 *     • Relationships as join tables (ProjectBlog, ProjectSkill, …).
 *     • Version history as a separate VersionHistory table.
 *     • `id` as a cuid (Prisma default).
 *
 * The `toEntity` / `fromPrisma` mappers convert at the boundary so the rest
 * of the app never sees Prisma's raw shape. This is the "anti-corruption
 * layer" pattern — it keeps the domain model stable while the storage engine
 * is swapped.
 *
 * @see docs/backend/repository.md — the full API + the mapping table.
 */

import { Prisma } from "@prisma/client";

import { prisma } from "@backend/database/db";
import { logger } from "@backend/logging/logger";
import type { CollectionName, VersionEntry } from "@backend/schemas/types";
import {
    toPrismaEnum,
    fromPrismaEnum,
    ENUM_FIELDS,
} from "@backend/repositories/enum-mapping";

/** Type guard: is this a Prisma "record not found" error (P2025)? */
function isNotFound(err: unknown): boolean {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return err.code === "P2025";
    }
    return false;
}

/* ── Types ──────────────────────────────────────────────────────────────── */

/** A row with the audit fields the repository manages. */
interface Entity {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
    [key: string]: unknown;
}

/** Query options — pagination + sorting + filtering + search. */
export interface QueryOptions {
    page?: number;
    pageSize?: number;
    sort?: string;
    order?: "asc" | "desc";
    search?: string;
    filters?: Record<string, unknown>;
    includeArchived?: boolean;
}

export interface PagedResult<T> {
    rows: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

const now = () => new Date().toISOString();

/* ── Collection → Prisma delegate mapping ───────────────────────────────── */

/**
 * Maps a `CollectionName` to its Prisma delegate key. This is the single
 * switch-point that routes a collection name to the right Prisma model.
 */
const DELEGATES: Record<CollectionName, string> = {
    projects: "project",
    blogPosts: "blogPost",
    experience: "experience",
    skills: "skill",
    infraNodes: "infraNode",
    infraEdges: "infraEdge",
    awards: "award",
    education: "education",
    certificates: "certificate",
    services: "service",
    resumes: "resume",
    media: "mediaAsset",
    users: "user",
    settings: "settings",
    siteCustomization: "siteCustomization",
    analytics: "analyticsEvent",
    activityLogs: "activityLog",
    categories: "category",
    tags: "tag",
    profiles: "profile",
};

/** The set of content collections that support archiving + version history. */
const ARCHIVABLE: ReadonlySet<CollectionName> = new Set([
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
]);

/** Collections that carry relationships (join tables in Prisma). */
const RELATIONAL: ReadonlySet<CollectionName> = new Set([
    "projects",
    "blogPosts",
    "experience",
    "skills",
    "infraNodes",
]);

/**
 * Enum fields grouped by collection — the read-side companion to
 * `enum-mapping.ts`. Built once at module load from `ENUM_FIELDS` so the
 * `toEntity` hot path is a single `Map.get` + a short loop, not a scan of the
 * full `ENUM_FIELDS` array for every row.
 */
const ENUM_FIELDS_BY_COLLECTION: ReadonlyMap<
    CollectionName,
    readonly string[]
> = (() => {
    const map = new Map<CollectionName, string[]>();
    for (const { collection, field } of ENUM_FIELDS) {
        const list = map.get(collection);
        if (list) list.push(field);
        else map.set(collection, [field]);
    }
    return map;
})();

/**
 * Cache of `roleId` → role machine name. Populated lazily on first lookup
 * (and refreshed if a miss is encountered, so a role created after the cache
 * was filled is still resolved). The Role table is tiny (4 system rows + any
 * custom roles), so a full re-fetch on a miss is cheap.
 *
 * This exists because the `users` collection's `toEntity` needs the role
 * *name* even when the caller didn't `include: { role: true }` (the default
 * `includeFor("users")` returns `{}`). Resolving via a lookup avoids forcing
 * every user read to pay for a join.
 */
const roleNameCache = new Map<string, string>();

/**
 * Cache of role machine name → `roleId`. The write-side companion to
 * `roleNameCache`: when the app layer hands us `role: "owner"` we must resolve
 * it to a `roleId` before writing to Prisma (the User model stores `roleId`,
 * not `role`). Kept in sync with `roleNameCache` so a single DB fetch warms
 * both directions.
 */
const roleIdCache = new Map<string, string>();

/** True while a cache refresh is in flight (de-dupe concurrent refreshes). */
let roleCacheRefreshing: Promise<void> | null = null;

/**
 * Fire-and-forget refresh of both role caches from the DB. Safe to call from
 * the synchronous `toEntity` hot path — it returns `void` and never blocks the
 * caller. A miss usually means the cache is empty (cold start) or a new role
 * was added since the last refresh. Concurrent calls are de-duped so a burst
 * of cache misses triggers a single `findMany`.
 */
function refreshRoleCache(_roleId?: string): void {
    if (roleCacheRefreshing) return;
    roleCacheRefreshing = (async () => {
        try {
            const roles = await prisma.role.findMany({
                select: { id: true, name: true },
            });
            for (const r of roles) {
                roleNameCache.set(r.id, r.name);
                roleIdCache.set(r.name, r.id);
            }
        } catch (err) {
            logger.warn({ err }, "role_cache.refresh_failed");
        } finally {
            roleCacheRefreshing = null;
        }
    })();
    void _roleId; // accepted for API symmetry; the refresh fetches all roles.
}

/**
 * Resolve a role machine name ("owner" | "admin" | …) to its `roleId`.
 * Used by the write side (`fromEntity`) to translate the app-layer `role`
 * string into the `roleId` FK Prisma expects. Throws if the role can't be
 * resolved — a missing role is a real error (the RBAC seed must run first),
 * not something to silently default.
 */
async function resolveRoleId(roleName: string): Promise<string> {
    const cached = roleIdCache.get(roleName);
    if (cached) return cached;
    // Cold cache — fetch all roles and warm both caches, then retry.
    refreshRoleCache();
    await roleCacheRefreshing;
    const resolved = roleIdCache.get(roleName);
    if (!resolved) {
        throw new Error(
            `Role "${roleName}" not found in the database. ` +
                `Ensure the RBAC seed (prisma/seed.ts) has run before seeding users.`,
        );
    }
    return resolved;
}

/* ── Field helpers ──────────────────────────────────────────────────────── */

/** Resolve a (possibly nested) field path like `"seo.title"` from a row. */
function getField(row: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce<unknown>((acc, key) => {
        if (acc && typeof acc === "object" && key in acc) {
            return (acc as Record<string, unknown>)[key];
        }
        return undefined;
    }, row);
}

/** Compare two values for sorting (string/number aware). */
function compare(a: unknown, b: unknown, order: "asc" | "desc"): number {
    const dir = order === "asc" ? 1 : -1;
    if (a === null && b === null) return 0;
    if (a === null || a === undefined) return 1 * dir;
    if (b === null || b === undefined) return -1 * dir;
    if (typeof a === "number" && typeof b === "number") return (a - b) * dir;
    return String(a).localeCompare(String(b)) * dir;
}

/** Does a row match a set of equality filters? */
function matchesFilters(
    row: Record<string, unknown>,
    filters?: Record<string, unknown>,
): boolean {
    if (!filters) return true;
    return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === "") return true;
        const field = getField(row, key);
        if (Array.isArray(field)) return field.includes(value);
        return field === value;
    });
}

/** Does a row match a search term across its string fields? */
function matchesSearch(row: Record<string, unknown>, term: string): boolean {
    const needle = term.toLowerCase();
    return Object.values(row).some((value) => {
        if (typeof value === "string")
            return value.toLowerCase().includes(needle);
        if (Array.isArray(value)) {
            return value.some(
                (v) =>
                    typeof v === "string" && v.toLowerCase().includes(needle),
            );
        }
        return false;
    });
}

/** Is a row archived? */
function isArchived(row: Record<string, unknown>): boolean {
    return row.archivedAt !== null && row.archivedAt !== undefined;
}

/* ── Prisma ↔ Entity mappers ────────────────────────────────────────────── */

/**
 * Convert a Prisma row to the Entity contract.
 * - DateTime → ISO string.
 * - `createdById` → `createdBy`, `updatedById` → `updatedBy`.
 * - Join-table relations → `related*Ids` arrays.
 * - VersionHistory rows → embedded `versionHistory` array.
 */
function toEntity(name: CollectionName, row: Record<string, unknown>): Entity {
    const entity: Record<string, unknown> = { ...row };

    // DateTime → ISO string.
    if (entity.createdAt instanceof Date)
        entity.createdAt = (entity.createdAt as Date).toISOString();
    if (entity.updatedAt instanceof Date)
        entity.updatedAt = (entity.updatedAt as Date).toISOString();
    if (entity.archivedAt instanceof Date)
        entity.archivedAt = (entity.archivedAt as Date).toISOString();
    else if (entity.archivedAt === null) entity.archivedAt = null;

    // FK id fields → legacy names.
    if ("createdById" in entity) {
        entity.createdBy = entity.createdById;
        delete entity.createdById;
    }
    if ("updatedById" in entity) {
        entity.updatedBy = entity.updatedById;
        delete entity.updatedById;
    }
    if ("archivedById" in entity) {
        entity.archivedBy = entity.archivedById;
        delete entity.archivedById;
    }

    // Users: resolve the `role` relation (Role.name) → the app-layer `role`
    // string. The Prisma User model stores `roleId` (FK to Role) and exposes
    // `role` as a relation object; the app layer expects `role` to be the
    // lowercase machine name ("owner" | "admin" | "editor" | "viewer").
    // `includeFor("users")` always includes `{ role: true }`, so the relation
    // is normally present. The sync `roleNameCache` is a fallback for the rare
    // case a caller reads a user row without the include (it is refreshed
    // fire-and-forget on a miss by `refreshRoleCache`).
    if (name === "users") {
        const roleRel = entity.role as { name?: string } | undefined;
        if (roleRel && typeof roleRel.name === "string") {
            entity.role = roleRel.name;
            // Keep the cache warm for the fallback path.
            if (typeof entity.roleId === "string") {
                roleNameCache.set(entity.roleId, roleRel.name);
            }
        } else if (typeof entity.roleId === "string") {
            const cached = roleNameCache.get(entity.roleId);
            if (cached) {
                entity.role = cached;
            } else {
                // Cache miss — use a safe default and refresh in the
                // background so the next read resolves correctly.
                entity.role = "viewer";
                void refreshRoleCache(entity.roleId);
            }
        } else {
            entity.role = "viewer";
        }
        delete entity.roleId;
    }

    // Prisma enum (UPPER_SNAKE_CASE) → app-layer (lowercase) for every enum
    // field on this collection. See `enum-mapping.ts` for the full table.
    translateEnumsToApp(name, entity);

    // Relationship join tables → related*Ids arrays.
    if (RELATIONAL.has(name)) {
        mapRelationsToIds(name, entity);
    }

    // Version history (separate table) → embedded array.
    if (ARCHIVABLE.has(name) && Array.isArray(entity.versionHistory)) {
        // Already mapped below via include.
    } else if (ARCHIVABLE.has(name)) {
        entity.versionHistory = [];
    }

    // Strip Prisma relation objects we don't want to leak.
    stripPrismaRelations(name, entity);

    return entity as unknown as Entity;
}

/**
 * In-place Prisma→app enum translation for every enum field on `collection`.
 * Iterates only the known enum fields (from `enum-mapping.ts`) so non-enum
 * rows pay no per-key cost. Unknown values pass through unchanged.
 */
function translateEnumsToApp(
    name: CollectionName,
    entity: Record<string, unknown>,
): void {
    const fields = ENUM_FIELDS_BY_COLLECTION.get(name);
    if (!fields) return;
    for (const field of fields) {
        if (field in entity) {
            entity[field] = fromPrismaEnum(name, field, entity[field]);
        }
    }
}

/** Map join-table relation arrays on a Prisma row to `related*Ids`. */
function mapRelationsToIds(
    name: CollectionName,
    entity: Record<string, unknown>,
): void {
    const map: Record<CollectionName, Array<[string, string]>> = {
        projects: [
            ["relatedBlogs", "relatedBlogIds"],
            ["relatedSkills", "relatedSkillIds"],
            ["relatedExperience", "relatedExperienceIds"],
            ["relatedInfra", "relatedInfraIds"],
        ],
        blogPosts: [
            ["relatedProjects", "relatedProjectIds"],
            ["relatedSkills", "relatedSkillIds"],
            ["relatedInfra", "relatedInfraIds"],
        ],
        experience: [["relatedProjects", "relatedProjectIds"]],
        skills: [
            ["relatedProjects", "relatedProjectIds"],
            ["relatedBlogs", "relatedBlogIds"],
            ["relatedInfra", "relatedInfraIds"],
        ],
        infraNodes: [
            ["relatedProjects", "relatedProjectIds"],
            ["relatedBlogs", "relatedBlogIds"],
            ["relatedSkills", "relatedSkillIds"],
        ],
        infraEdges: [],
        awards: [],
        education: [],
        certificates: [],
        services: [],
        resumes: [],
        media: [],
        users: [],
        settings: [],
        siteCustomization: [],
        analytics: [],
        activityLogs: [],
        categories: [],
        tags: [],
        profiles: [],
    };
    const specs = map[name] ?? [];
    for (const [relField, idField] of specs) {
        const rel = entity[relField];
        if (Array.isArray(rel)) {
            // Each join-table row has the target id on a known field.
            entity[idField] = rel.map((r) =>
                extractTargetId(name, relField, r),
            );
        } else if (!(idField in entity)) {
            entity[idField] = [];
        }
        delete entity[relField];
    }
}

/** Extract the target id from a join-table row (field name varies). */
function extractTargetId(
    _source: CollectionName,
    relField: string,
    row: unknown,
): string {
    if (!row || typeof row !== "object") return "";
    const r = row as Record<string, unknown>;
    // Join rows carry the target id on a field named after the target model.
    const candidates = [
        "blogId",
        "projectId",
        "skillId",
        "experienceId",
        "infraId",
    ];
    for (const c of candidates) {
        if (typeof r[c] === "string") return r[c] as string;
    }
    // Fallback: the relation field minus "related" + "Id".
    void relField;
    return "";
}

/** Remove Prisma relation objects that shouldn't leak into the Entity. */
function stripPrismaRelations(
    name: CollectionName,
    entity: Record<string, unknown>,
): void {
    const relFields: Record<CollectionName, string[]> = {
        projects: [
            "relatedBlogs",
            "relatedSkills",
            "relatedExperience",
            "relatedInfra",
            "createdBy",
            "updatedBy",
        ],
        blogPosts: [
            "relatedProjects",
            "relatedSkills",
            "relatedInfra",
            "createdBy",
            "updatedBy",
        ],
        experience: ["relatedProjects", "createdBy", "updatedBy"],
        skills: [
            "relatedProjects",
            "relatedBlogs",
            "relatedInfra",
            "createdBy",
            "updatedBy",
        ],
        infraNodes: [
            "relatedProjects",
            "relatedBlogs",
            "relatedSkills",
            "createdBy",
            "updatedBy",
        ],
        infraEdges: ["createdBy", "updatedBy"],
        awards: ["createdBy", "updatedBy"],
        education: ["createdBy", "updatedBy"],
        certificates: ["createdBy", "updatedBy"],
        services: ["createdBy", "updatedBy"],
        resumes: ["createdBy", "updatedBy"],
        media: ["createdBy", "updatedBy"],
        users: ["role", "permissions", "sessions", "refreshTokens", "accounts"],
        settings: [],
        siteCustomization: [],
        analytics: ["user"],
        activityLogs: ["user"],
        categories: ["createdBy", "updatedBy"],
        tags: ["createdBy", "updatedBy"],
        profiles: [],
    };
    for (const f of relFields[name] ?? []) delete entity[f];
}

/**
 * Convert an Entity (from the API) to a Prisma `create` / `update` payload.
 * - ISO strings → Date (Prisma handles DateTime).
 * - `createdBy` → `createdById`, etc.
 * - `related*Ids` → join-table `create` payloads (handled by `syncRelationships`).
 * - `versionHistory` is ignored here (managed via the VersionHistory table).
 * - App-layer enums (lowercase) → Prisma enums (UPPER_SNAKE_CASE).
 * - `users.role` (string machine name) → `roleId` (FK to Role), resolved via
 *   the role cache. `role` and `sessions` (relations) are stripped.
 *
 * This is the WRITE side of the anti-corruption layer — it is the function
 * that actually prevents the `PrismaClientValidationError` that caused the
 * login 500: every enum field is translated from the app's lowercase
 * convention to Prisma's UPPER_SNAKE_CASE before the payload reaches the
 * delegate.
 *
 * Async because `users.role` → `roleId` may require a DB lookup on a cold
 * cache. All call sites (`create`, `update`, `bulkUpdate`, `restoreVersion`,
 * `importCollection`) are async and `await` this function.
 */
async function fromEntity(
    name: CollectionName,
    entity: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = { ...entity };

    // Audit field renames. (Users have no createdById/updatedById columns —
    // the `create` wrapper skips setting them for the `users` collection, and
    // we strip any stray ones here so Prisma doesn't reject the payload.)
    if ("createdBy" in out) {
        out.createdById = out.createdBy ?? null;
        delete out.createdBy;
    }
    if ("updatedBy" in out) {
        out.updatedById = out.updatedBy ?? null;
        delete out.updatedBy;
    }
    if ("archivedBy" in out) {
        out.archivedById = out.archivedBy ?? null;
        delete out.archivedBy;
    }

    // Users: translate the app-layer `role` string → `roleId` FK, and strip
    // relation fields Prisma doesn't accept as scalars on create/update.
    if (name === "users") {
        if (typeof out.role === "string") {
            out.roleId = await resolveRoleId(out.role);
        }
        // `role` is a relation object, `sessions`/`permissions`/`accounts`/
        // `refreshTokens` are relations — none are writable as scalars.
        delete out.role;
        delete out.sessions;
        delete out.permissions;
        delete out.accounts;
        delete out.refreshTokens;
        // The User model has no createdById/updatedById columns (it is the
        // root of the audit provenance graph), so strip them if present.
        delete out.createdById;
        delete out.updatedById;
    }

    // App-layer enums (lowercase) → Prisma enums (UPPER_SNAKE_CASE).
    translateEnumsToPrisma(name, out);

    // Drop fields Prisma doesn't store on the row.
    delete out.versionHistory;
    delete out.relatedBlogIds;
    delete out.relatedProjectIds;
    delete out.relatedSkillIds;
    delete out.relatedExperienceIds;
    delete out.relatedInfraIds;
    delete out.relatedPostIds;

    return out;
}

/**
 * In-place app→Prisma enum translation for every enum field on `collection`.
 * The write-side companion to `translateEnumsToApp`. Iterates only the known
 * enum fields (from `enum-mapping.ts`) so non-enum rows pay no per-key cost.
 * Unknown values pass through unchanged — Prisma will reject them with a
 * clear validation error if they are genuinely invalid.
 */
function translateEnumsToPrisma(
    name: CollectionName,
    out: Record<string, unknown>,
): void {
    const fields = ENUM_FIELDS_BY_COLLECTION.get(name);
    if (!fields) return;
    for (const field of fields) {
        if (field in out) {
            out[field] = toPrismaEnum(name, field, out[field]);
        }
    }
}

/** Build the Prisma `include` for relations + version history. */
function includeFor(name: CollectionName): Record<string, boolean> {
    // Users: always include the `role` relation so `toEntity` can resolve the
    // role machine name synchronously (the app layer reads `user.role` as a
    // string, but Prisma stores it as a FK to the Role table).
    if (name === "users") {
        return { role: true };
    }
    if (!RELATIONAL.has(name) && !ARCHIVABLE.has(name)) return {};
    const include: Record<string, boolean> = {};
    if (name === "projects") {
        include.relatedBlogs = true;
        include.relatedSkills = true;
        include.relatedExperience = true;
        include.relatedInfra = true;
    } else if (name === "blogPosts") {
        include.relatedProjects = true;
        include.relatedSkills = true;
        include.relatedInfra = true;
    } else if (name === "experience") {
        include.relatedProjects = true;
    } else if (name === "skills") {
        include.relatedProjects = true;
        include.relatedBlogs = true;
        include.relatedInfra = true;
    } else if (name === "infraNodes") {
        include.relatedProjects = true;
        include.relatedBlogs = true;
        include.relatedSkills = true;
    }
    return include;
}

/** A loosely-typed Prisma model delegate (findMany, create, update, …). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PrismaDelegate {
    findMany(args?: unknown): Promise<unknown[]>;
    findUnique(args: unknown): Promise<unknown>;
    findFirst(args: unknown): Promise<unknown>;
    count(args?: unknown): Promise<number>;
    create(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<{ count: number }>;
    delete(args: unknown): Promise<unknown>;
    deleteMany(args: unknown): Promise<{ count: number }>;
    upsert(args: unknown): Promise<unknown>;
}

/** Get the Prisma delegate for a collection (typed loosely for flexibility). */
function delegate(name: CollectionName): PrismaDelegate {
    const key = DELEGATES[name];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = (prisma as unknown as Record<string, any>)[key] as
        PrismaDelegate | undefined;
    if (!table)
        throw new Error(`Unknown Prisma delegate for collection "${name}"`);
    return table;
}

/* ── Read operations ────────────────────────────────────────────────────── */

/** Read all rows of a collection (mapped to the Entity contract). */
export async function list<T extends Entity>(
    name: CollectionName,
): Promise<T[]> {
    const rows = (await delegate(name).findMany({
        include: includeFor(name),
    })) as Record<string, unknown>[];
    return rows.map((r) => toEntity(name, r) as unknown as T);
}

/** Query a collection with pagination/sort/filter/search. */
export async function query<T extends Entity>(
    name: CollectionName,
    options: QueryOptions = {},
): Promise<PagedResult<T>> {
    const {
        page = 1,
        pageSize = 20,
        sort,
        order = "asc",
        search,
        filters,
        includeArchived = false,
    } = options;

    // Fetch all (with relations) then filter/sort/paginate in JS — the
    // admin is a low-volume, single-operator tool, so this is fine and keeps
    // the filter/search semantics identical to the original implementation.
    let rows = await list<T>(name);
    if (!includeArchived) {
        rows = rows.filter(
            (r) => !isArchived(r as unknown as Record<string, unknown>),
        );
    }
    if (filters)
        rows = rows.filter((r) =>
            matchesFilters(r as unknown as Record<string, unknown>, filters),
        );
    if (search)
        rows = rows.filter((r) =>
            matchesSearch(r as unknown as Record<string, unknown>, search),
        );
    if (sort) {
        rows.sort((a, b) =>
            compare(
                getField(a as unknown as Record<string, unknown>, sort),
                getField(b as unknown as Record<string, unknown>, sort),
                order,
            ),
        );
    }
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize);
    return { rows: paged, total, page, pageSize, totalPages };
}

/** Find a single row by id. */
export async function findById<T extends Entity>(
    name: CollectionName,
    id: string,
): Promise<T | null> {
    const row = (await delegate(name).findUnique({
        where: { id },
        include: includeFor(name),
    })) as Record<string, unknown> | null;
    return row ? (toEntity(name, row) as unknown as T) : null;
}

/** Find a single row by a field value (first match). */
export async function findByField<T extends Entity>(
    name: CollectionName,
    field: string,
    value: unknown,
): Promise<T | null> {
    const rows = await list<T>(name);
    return (
        rows.find(
            (r) =>
                getField(r as unknown as Record<string, unknown>, field) ===
                value,
        ) ?? null
    );
}

/* ── Version history helpers ────────────────────────────────────────────── */

/** The entity-type label stored on VersionHistory rows. */
const ENTITY_TYPE: Record<CollectionName, string> = {
    projects: "project",
    blogPosts: "blog",
    experience: "experience",
    skills: "skill",
    infraNodes: "infra",
    infraEdges: "infraEdge",
    awards: "award",
    education: "education",
    certificates: "certificate",
    services: "service",
    resumes: "resume",
    media: "media",
    users: "user",
    settings: "settings",
    siteCustomization: "siteCustomization",
    analytics: "analytics",
    activityLogs: "activityLog",
    categories: "category",
    tags: "tag",
    profiles: "profile",
};

/** Load version history for an entity as the embedded array shape. */
async function loadVersionHistory(
    name: CollectionName,
    entityId: string,
): Promise<VersionEntry[]> {
    if (!ARCHIVABLE.has(name)) return [];
    const rows = await prisma.versionHistory.findMany({
        where: { entityType: ENTITY_TYPE[name], entityId },
        orderBy: { version: "asc" },
    });
    return rows.map((r) => ({
        version: r.version,
        snapshot: r.snapshot as Record<string, unknown>,
        savedAt: r.savedAt.toISOString(),
        savedBy: r.savedById ?? undefined,
        label: r.label ?? undefined,
    }));
}

/** Append a version snapshot for an entity. */
async function pushVersion(
    name: CollectionName,
    entity: Entity,
    actorId?: string,
    label?: string,
): Promise<void> {
    if (!ARCHIVABLE.has(name)) return;
    const { versionHistory: _vh, ...snapshot } = entity as Record<
        string,
        unknown
    >;
    void _vh;
    const existing = await prisma.versionHistory.count({
        where: { entityType: ENTITY_TYPE[name], entityId: entity.id },
    });
    await prisma.versionHistory.create({
        data: {
            entityType: ENTITY_TYPE[name],
            entityId: entity.id,
            version: existing + 1,
            snapshot: snapshot as unknown as Prisma.InputJsonValue,
            label: label ?? null,
            savedById: actorId ?? null,
        },
    });
}

/* ── Relationship sync (join tables) ─────────────────────────────────────── */

/**
 * Synchronize join-table rows from an entity's `related*Ids` arrays.
 * Replaces the join rows for the entity to match the id arrays exactly.
 */
async function syncRelationships(
    name: CollectionName,
    entity: Entity,
): Promise<void> {
    if (!RELATIONAL.has(name)) return;
    const e = entity as unknown as Record<string, unknown>;

    if (name === "projects") {
        await syncJoin(
            "projectBlogs",
            "projectId",
            entity.id,
            "blogId",
            e.relatedBlogIds,
        );
        await syncJoin(
            "projectSkills",
            "projectId",
            entity.id,
            "skillId",
            e.relatedSkillIds,
        );
        await syncJoin(
            "projectExperience",
            "projectId",
            entity.id,
            "experienceId",
            e.relatedExperienceIds,
        );
        await syncJoin(
            "projectInfra",
            "projectId",
            entity.id,
            "infraId",
            e.relatedInfraIds,
        );
    } else if (name === "blogPosts") {
        await syncJoin(
            "projectBlogs",
            "blogId",
            entity.id,
            "projectId",
            e.relatedProjectIds,
        );
        await syncJoin(
            "blogSkills",
            "blogId",
            entity.id,
            "skillId",
            e.relatedSkillIds,
        );
        await syncJoin(
            "blogInfra",
            "blogId",
            entity.id,
            "infraId",
            e.relatedInfraIds,
        );
    } else if (name === "experience") {
        await syncJoin(
            "projectExperience",
            "experienceId",
            entity.id,
            "projectId",
            e.relatedProjectIds,
        );
    } else if (name === "skills") {
        await syncJoin(
            "projectSkills",
            "skillId",
            entity.id,
            "projectId",
            e.relatedProjectIds,
        );
        await syncJoin(
            "blogSkills",
            "skillId",
            entity.id,
            "blogId",
            e.relatedBlogIds,
        );
        await syncJoin(
            "skillInfra",
            "skillId",
            entity.id,
            "infraId",
            e.relatedInfraIds,
        );
    } else if (name === "infraNodes") {
        await syncJoin(
            "projectInfra",
            "infraId",
            entity.id,
            "projectId",
            e.relatedProjectIds,
        );
        await syncJoin(
            "blogInfra",
            "infraId",
            entity.id,
            "blogId",
            e.relatedBlogs,
        );
        await syncJoin(
            "skillInfra",
            "infraId",
            entity.id,
            "skillId",
            e.relatedSkills,
        );
    }
}

/** Replace all join rows for (sourceField=sourceId) with the given target ids. */
async function syncJoin(
    table: string,
    sourceField: string,
    sourceId: string,
    targetField: string,
    targetIds: unknown,
): Promise<void> {
    const ids = Array.isArray(targetIds) ? (targetIds as string[]) : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (prisma as any)[table];
    if (!model) return;
    await model.deleteMany({ where: { [sourceField]: sourceId } });
    if (ids.length === 0) return;
    await model.createMany({
        data: ids.map((tid) => ({
            [sourceField]: sourceId,
            [targetField]: tid,
        })),
        skipDuplicates: true,
    });
}

/** Remove all join rows referencing a deleted entity. */
async function cleanupRelationships(
    name: CollectionName,
    id: string,
): Promise<void> {
    if (!RELATIONAL.has(name)) return;
    const tables: Record<string, Array<[string, string]>> = {
        projects: [
            ["projectBlogs", "projectId"],
            ["projectSkills", "projectId"],
            ["projectExperience", "projectId"],
            ["projectInfra", "projectId"],
        ],
        blogPosts: [
            ["projectBlogs", "blogId"],
            ["blogSkills", "blogId"],
            ["blogInfra", "blogId"],
        ],
        experience: [["projectExperience", "experienceId"]],
        skills: [
            ["projectSkills", "skillId"],
            ["blogSkills", "skillId"],
            ["skillInfra", "skillId"],
        ],
        infraNodes: [
            ["projectInfra", "infraId"],
            ["blogInfra", "infraId"],
            ["skillInfra", "infraId"],
        ],
    };
    for (const [table, field] of tables[name] ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const model = (prisma as any)[table];
        if (model) await model.deleteMany({ where: { [field]: id } });
    }
}

/* ── Write operations ───────────────────────────────────────────────────── */

/** Create a new row. Returns the persisted entity (with generated id + audit). */
export async function create<T extends Entity>(
    name: CollectionName,
    data: Omit<T, "id" | "createdAt" | "updatedAt">,
    actorId?: string,
): Promise<T> {
    const payload = await fromEntity(name, data as Record<string, unknown>);
    payload.createdAt = now();
    payload.updatedAt = now();
    if (ARCHIVABLE.has(name)) {
        payload.archivedAt = null;
        payload.archivedById = null;
    }
    // The User model has no createdById/updatedById columns (it is the root
    // of the audit provenance graph), so only set them for other collections.
    if (actorId && name !== "users") {
        payload.createdById = actorId;
        payload.updatedById = actorId;
    }
    const row = (await delegate(name).create({
        data: payload as Record<string, unknown>,
        include: includeFor(name),
    })) as Record<string, unknown>;
    const entity = toEntity(name, row) as unknown as Entity;
    await syncRelationships(name, entity);
    return entity as unknown as T;
}

/** Update a row by id (partial merge). Returns the updated entity or null. */
export async function update<T extends Entity>(
    name: CollectionName,
    id: string,
    patch: Partial<T>,
    actorId?: string,
    versionLabel?: string,
): Promise<T | null> {
    const prev = await findById<Entity>(name, id);
    if (!prev) return null;
    // Snapshot the previous state for version history.
    if (
        versionLabel ||
        hasMeaningfulChange(prev, patch as Record<string, unknown>)
    ) {
        await pushVersion(name, prev, actorId, versionLabel);
    }
    const payload = await fromEntity(name, patch as Record<string, unknown>);
    payload.updatedAt = now();
    if (actorId && name !== "users") payload.updatedById = actorId;
    try {
        const row = (await delegate(name).update({
            where: { id },
            data: payload as Record<string, unknown>,
            include: includeFor(name),
        })) as Record<string, unknown>;
        const entity = toEntity(name, row) as unknown as Entity;
        await syncRelationships(name, entity);
        return entity as unknown as T;
    } catch (err) {
        // Prisma throws P2025 if the record was deleted between read + update.
        if (isNotFound(err)) return null;
        throw err;
    }
}

/** Does the patch change anything beyond audit fields? */
function hasMeaningfulChange<T extends Entity>(
    prev: T,
    patch: Record<string, unknown>,
): boolean {
    const skip = new Set([
        "updatedAt",
        "updatedBy",
        "versionHistory",
        "createdAt",
        "createdBy",
        "id",
    ]);
    for (const key of Object.keys(patch)) {
        if (skip.has(key)) continue;
        if ((prev as Record<string, unknown>)[key] !== patch[key]) {
            return true;
        }
    }
    return false;
}

/** Soft-delete (archive) a row by id. Returns true if a row was archived. */
export async function remove(
    name: CollectionName,
    id: string,
    actorId?: string,
): Promise<boolean> {
    if (ARCHIVABLE.has(name)) {
        try {
            await delegate(name).update({
                where: { id },
                data: {
                    archivedAt: now(),
                    archivedById: actorId ?? null,
                    updatedAt: now(),
                    updatedById: actorId ?? null,
                },
            });
            return true;
        } catch (err) {
            if (isNotFound(err)) return false;
            throw err;
        }
    }
    // Non-archivable collections (users, settings, logs) hard-delete.
    try {
        await delegate(name).delete({ where: { id } });
        await cleanupRelationships(name as CollectionName, id);
        return true;
    } catch (err) {
        if (isNotFound(err)) return false;
        throw err;
    }
}

/** Duplicate a row by id (deep clone with a new id + cleared audit). */
export async function duplicate<T extends Entity>(
    name: CollectionName,
    id: string,
    overrides: Partial<T> = {},
    actorId?: string,
): Promise<T | null> {
    const source = await findById<T>(name, id);
    if (!source) return null;
    const {
        id: _id,
        createdAt: _c,
        updatedAt: _u,
        createdBy: _cb,
        updatedBy: _ub,
        archivedAt: _a,
        archivedBy: _ab,
        versionHistory: _vh,
        ...rest
    } = source as Record<string, unknown>;
    void _id;
    void _c;
    void _u;
    void _cb;
    void _ub;
    void _a;
    void _ab;
    void _vh;
    return create<T>(
        name,
        { ...rest, ...overrides } as Omit<T, "id" | "createdAt" | "updatedAt">,
        actorId,
    );
}

/** Count rows in a collection (optionally filtered). */
export async function count(
    name: CollectionName,
    filters?: Record<string, unknown>,
): Promise<number> {
    const rows = await list<Entity>(name);
    const visible = rows.filter(
        (r) => !isArchived(r as unknown as Record<string, unknown>),
    );
    if (!filters) return visible.length;
    return visible.filter((r) =>
        matchesFilters(r as unknown as Record<string, unknown>, filters),
    ).length;
}

/** Bulk replace a collection (used by backup/restore). */
export async function replaceAll<T extends Entity>(
    name: CollectionName,
    rows: T[],
): Promise<void> {
    // Destructive: delete all then re-create. Used only by backup/restore.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any)[DELEGATES[name]].deleteMany({});
    for (const row of rows) {
        await create(name, row as Omit<T, "id" | "createdAt" | "updatedAt">);
    }
}

/* ── Bulk actions ──────────────────────────────────────────────────────── */

/** Bulk delete by ids. Returns the number of rows removed. */
export async function bulkDelete(
    name: CollectionName,
    ids: string[],
): Promise<number> {
    if (ARCHIVABLE.has(name)) {
        const res = await delegate(name).updateMany({
            where: { id: { in: ids } },
            data: { archivedAt: now(), updatedAt: now() },
        });
        return res.count;
    }
    const res = await delegate(name).deleteMany({
        where: { id: { in: ids } },
    });
    for (const id of ids) await cleanupRelationships(name, id);
    return res.count;
}

/** Bulk archive by ids (soft-delete). Returns the number of rows archived. */
export async function bulkArchive(
    name: CollectionName,
    ids: string[],
    actorId?: string,
): Promise<number> {
    if (!ARCHIVABLE.has(name)) return 0;
    const res = await delegate(name).updateMany({
        where: { id: { in: ids }, archivedAt: null },
        data: {
            archivedAt: now(),
            archivedById: actorId ?? null,
            updatedAt: now(),
            updatedById: actorId ?? null,
        },
    });
    return res.count;
}

/** Bulk restore by ids (un-archive). Returns the number of rows restored. */
export async function bulkRestore(
    name: CollectionName,
    ids: string[],
    actorId?: string,
): Promise<number> {
    if (!ARCHIVABLE.has(name)) return 0;
    const res = await delegate(name).updateMany({
        where: { id: { in: ids }, archivedAt: { not: null } },
        data: {
            archivedAt: null,
            archivedById: null,
            updatedAt: now(),
            updatedById: actorId ?? null,
        },
    });
    return res.count;
}

/** Bulk update (apply the same patch to many ids). Returns the number updated. */
export async function bulkUpdate<T extends Entity>(
    name: CollectionName,
    ids: string[],
    patch: Partial<T>,
    actorId?: string,
): Promise<number> {
    const payload = await fromEntity(name, patch as Record<string, unknown>);
    payload.updatedAt = now();
    if (actorId && name !== "users") payload.updatedById = actorId;
    const res = await delegate(name).updateMany({
        where: { id: { in: ids } },
        data: payload as Record<string, unknown>,
    });
    return res.count;
}

/* ── Drag & drop reordering ────────────────────────────────────────────── */

/** Reorder rows by id. Assigns `displayOrder` 0..n-1 to each id in order. */
export async function reorder(
    name: CollectionName,
    orderedIds: string[],
    actorId?: string,
): Promise<void> {
    const updates = orderedIds.map((id, i) =>
        delegate(name).update({
            where: { id },
            data: {
                displayOrder: i,
                updatedAt: now(),
                updatedById: actorId ?? null,
            },
        }),
    );
    await Promise.all(updates);
}

/* ── Version history / undo ─────────────────────────────────────────────── */

/** Restore an entity to a previous version (by version number). */
export async function restoreVersion<T extends Entity>(
    name: CollectionName,
    id: string,
    version: number,
    actorId?: string,
): Promise<T | null> {
    if (!ARCHIVABLE.has(name)) return null;
    const entry = await prisma.versionHistory.findFirst({
        where: { entityType: ENTITY_TYPE[name], entityId: id, version },
    });
    if (!entry) return null;
    // Snapshot the current state first (so the restore is itself undoable).
    const current = await findById<Entity>(name, id);
    if (!current) return null;
    await pushVersion(name, current, actorId, `Restored v${version}`);
    const snapshot = entry.snapshot as Record<string, unknown>;
    const payload = await fromEntity(name, { ...snapshot });
    payload.updatedAt = now();
    if (actorId && name !== "users") payload.updatedById = actorId;
    delete payload.id;
    delete payload.createdAt;
    try {
        const row = (await delegate(name).update({
            where: { id },
            data: payload as Record<string, unknown>,
            include: includeFor(name),
        })) as Record<string, unknown>;
        const entity = toEntity(name, row) as unknown as Entity;
        await syncRelationships(name, entity);
        return entity as unknown as T;
    } catch (err) {
        logger.error({ err, name, id, version }, "restoreVersion failed");
        throw err;
    }
}

/* ── Import / Export ───────────────────────────────────────────────────── */

/** Export a collection as a JSON array (deep copy). */
export async function exportCollection<T extends Entity>(
    name: CollectionName,
): Promise<T[]> {
    const rows = await list<T>(name);
    // Hydrate version history for archivable collections.
    if (ARCHIVABLE.has(name)) {
        for (const row of rows) {
            (row as Record<string, unknown>).versionHistory =
                await loadVersionHistory(name, row.id);
        }
    }
    return JSON.parse(JSON.stringify(rows)) as T[];
}

/** Export every collection as a keyed object (for full backup). */
export async function exportAll(): Promise<Record<string, unknown[]>> {
    const names: CollectionName[] = [
        "projects",
        "blogPosts",
        "experience",
        "skills",
        "infraNodes",
        "infraEdges",
        "awards",
        "education",
        "certificates",
        "services",
        "resumes",
        "media",
        "users",
        "settings",
        "siteCustomization",
        "analytics",
        "activityLogs",
        "categories",
        "tags",
        "profiles",
    ];
    const out: Record<string, unknown[]> = {};
    for (const name of names) {
        out[name] = await exportCollection(name);
    }
    return out;
}

/**
 * Import rows into a collection. Modes:
 *   • "replace"  — overwrite the collection entirely.
 *   • "merge"    — upsert by id (existing ids updated, new ids appended).
 *   • "append"   — add all rows with fresh ids (no id collisions).
 * Returns the resulting row count.
 */
export async function importCollection<T extends Entity>(
    name: CollectionName,
    incoming: T[],
    mode: "replace" | "merge" | "append" = "merge",
    actorId?: string,
): Promise<number> {
    if (mode === "replace") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any)[DELEGATES[name]].deleteMany({});
        for (const row of incoming) {
            await create(
                name,
                row as Omit<T, "id" | "createdAt" | "updatedAt">,
                actorId,
            );
        }
        return incoming.length;
    }
    if (mode === "append") {
        let n = 0;
        for (const row of incoming) {
            const { id: _id, ...rest } = row as Record<string, unknown>;
            void _id;
            await create(
                name,
                rest as Omit<T, "id" | "createdAt" | "updatedAt">,
                actorId,
            );
            n++;
        }
        return n;
    }
    // merge — upsert by id.
    let n = 0;
    for (const row of incoming) {
        const payload = await fromEntity(name, row as Record<string, unknown>);
        payload.updatedAt = now();
        if (actorId && name !== "users") payload.updatedById = actorId;
        try {
            await delegate(name).upsert({
                where: { id: row.id },
                create: { ...payload, createdAt: now() },
                update: payload,
            });
            n++;
        } catch (err) {
            logger.warn(
                { err, name, id: row.id },
                "import merge upsert failed",
            );
        }
    }
    return n;
}
