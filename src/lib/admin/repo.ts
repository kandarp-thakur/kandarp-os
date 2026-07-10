/**
 * Repository — the public data-access API for the admin console.
 *
 * Every API route and server component reads/writes through this layer. It
 * wraps the raw JSON store with typed CRUD, pagination, filtering, sorting,
 * full-text search, bulk actions, drag & drop reordering, archive/restore,
 * import/export, version history, and relationship synchronization.
 *
 * The store is the swappable seam; this is the contract.
 *
 * Concurrency: writes are serialized per-collection by the store's mutex.
 * Reads return a shallow copy so callers can't mutate the cache by accident.
 */

import { randomUUID } from "crypto";

import { readCollection, writeCollection } from "@/lib/admin/store";
import {
    cleanupRelationships,
    syncRelationships,
} from "@/lib/admin/relationships";
import type { CollectionName, VersionEntry } from "@/lib/admin/types";

const now = () => new Date().toISOString();

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
    /** Arbitrary field filters, e.g. `{ status: "published" }`. */
    filters?: Record<string, unknown>;
    /** Include archived rows (default false — archived rows are hidden). */
    includeArchived?: boolean;
}

export interface PagedResult<T> {
    rows: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

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

/** Read all rows of a collection (shallow-copied). */
export function list<T extends Entity>(name: CollectionName): T[] {
    return [...readCollection<T>(name)];
}

/** Query a collection with pagination/sort/filter/search. */
export function query<T extends Entity>(
    name: CollectionName,
    options: QueryOptions = {},
): PagedResult<T> {
    const {
        page = 1,
        pageSize = 20,
        sort,
        order = "asc",
        search,
        filters,
        includeArchived = false,
    } = options;
    let rows = list<T>(name);

    // Hide archived rows unless explicitly requested.
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
export function findById<T extends Entity>(
    name: CollectionName,
    id: string,
): T | null {
    return list<T>(name).find((r) => r.id === id) ?? null;
}

/** Find a single row by a field value (first match). */
export function findByField<T extends Entity>(
    name: CollectionName,
    field: string,
    value: unknown,
): T | null {
    return (
        list<T>(name).find(
            (r) =>
                getField(r as unknown as Record<string, unknown>, field) ===
                value,
        ) ?? null
    );
}

/** Build a version-history snapshot (entity minus its own versionHistory). */
function snapshotOf<T extends Entity>(entity: T): Record<string, unknown> {
    const { versionHistory: _vh, ...rest } = entity as Record<
        string,
        unknown
    > & { versionHistory?: unknown };
    void _vh;
    return rest;
}

/** Append a version-history entry for an entity. */
function pushVersion<T extends Entity>(
    entity: T,
    actorId?: string,
    label?: string,
): VersionEntry[] {
    const existing =
        (entity.versionHistory as VersionEntry[] | undefined) ?? [];
    const version = existing.length + 1;
    return [
        ...existing,
        {
            version,
            snapshot: snapshotOf(entity),
            savedAt: now(),
            savedBy: actorId,
            label,
        },
    ];
}

/** Create a new row. Returns the persisted entity (with generated id + audit). */
export async function create<T extends Entity>(
    name: CollectionName,
    data: Omit<T, "id" | "createdAt" | "updatedAt">,
    actorId?: string,
): Promise<T> {
    const rows = list<T>(name);
    const entity = {
        ...(data as object),
        id: randomUUID(),
        createdAt: now(),
        updatedAt: now(),
        createdBy: actorId,
        updatedBy: actorId,
        versionHistory: [],
    } as unknown as T;
    rows.push(entity);
    await writeCollection(name, rows);
    // Sync relationships (prev = null on create).
    await syncRelationships(
        name,
        entity as unknown as Record<string, unknown> & { id: string },
        null,
        actorId,
    );
    return entity;
}

/** Update a row by id (partial merge). Returns the updated entity or null. */
export async function update<T extends Entity>(
    name: CollectionName,
    id: string,
    patch: Partial<T>,
    actorId?: string,
    /** Optional label for the version-history entry. */
    versionLabel?: string,
): Promise<T | null> {
    const rows = list<T>(name);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const prev = rows[idx] as Entity;
    const updated = {
        ...prev,
        ...patch,
        id,
        updatedAt: now(),
        updatedBy: actorId,
    } as unknown as T;
    // Append a version snapshot of the *previous* state (undo target).
    if (
        versionLabel ||
        hasMeaningfulChange(prev, updated as unknown as Entity)
    ) {
        (updated as Record<string, unknown>).versionHistory = pushVersion(
            prev,
            actorId,
            versionLabel,
        );
    }
    rows[idx] = updated;
    await writeCollection(name, rows);
    // Sync relationships (prev = the pre-update entity).
    await syncRelationships(
        name,
        updated as unknown as Record<string, unknown> & { id: string },
        prev as unknown as Record<string, unknown> & { id: string },
        actorId,
    );
    return updated;
}

/** Does the patch change anything beyond audit fields? */
function hasMeaningfulChange<T extends Entity>(prev: T, next: T): boolean {
    const skip = new Set(["updatedAt", "updatedBy", "versionHistory"]);
    const prevKeys = Object.keys(prev as Record<string, unknown>).filter(
        (k) => !skip.has(k),
    );
    for (const key of prevKeys) {
        if (
            (prev as Record<string, unknown>)[key] !==
            (next as Record<string, unknown>)[key]
        ) {
            return true;
        }
    }
    return false;
}

/** Delete a row by id. Returns true if a row was removed. */
export async function remove(
    name: CollectionName,
    id: string,
): Promise<boolean> {
    const rows = list<Entity>(name);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    rows.splice(idx, 1);
    await writeCollection(name, rows);
    // Clean up dangling relationship references.
    await cleanupRelationships(name, id);
    return true;
}

/** Duplicate a row by id (deep clone with a new id + cleared audit). */
export async function duplicate<T extends Entity>(
    name: CollectionName,
    id: string,
    overrides: Partial<T> = {},
    actorId?: string,
): Promise<T | null> {
    const source = findById<T>(name, id);
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
export function count(
    name: CollectionName,
    filters?: Record<string, unknown>,
): number {
    const rows = list<Entity>(name);
    const visible = rows.filter(
        (r) => !isArchived(r as unknown as Record<string, unknown>),
    );
    if (!filters) return visible.length;
    return visible.filter((r) =>
        matchesFilters(r as unknown as Record<string, unknown>, filters),
    ).length;
}

/** Bulk replace a collection (used by backup/restore + reordering). */
export async function replaceAll<T extends Entity>(
    name: CollectionName,
    rows: T[],
): Promise<void> {
    await writeCollection(name, rows);
}

/* ── Bulk actions ─────────────────────────────────────────────────────── */

/** Bulk delete by ids. Returns the number of rows removed. */
export async function bulkDelete(
    name: CollectionName,
    ids: string[],
): Promise<number> {
    const rows = list<Entity>(name);
    const idSet = new Set(ids);
    const remaining = rows.filter((r) => !idSet.has(r.id));
    const removed = rows.length - remaining.length;
    if (removed === 0) return 0;
    await writeCollection(name, remaining);
    // Clean up relationships for each removed entity.
    for (const id of ids) {
        await cleanupRelationships(name, id);
    }
    return removed;
}

/** Bulk archive by ids (soft-delete). Returns the number of rows archived. */
export async function bulkArchive(
    name: CollectionName,
    ids: string[],
    actorId?: string,
): Promise<number> {
    const rows = list<Entity>(name);
    const idSet = new Set(ids);
    let count = 0;
    for (const row of rows) {
        if (
            idSet.has(row.id) &&
            (row.archivedAt === null || row.archivedAt === undefined)
        ) {
            row.archivedAt = now();
            row.archivedBy = actorId;
            row.updatedAt = now();
            row.updatedBy = actorId;
            count++;
        }
    }
    if (count > 0) await writeCollection(name, rows);
    return count;
}

/** Bulk restore by ids (un-archive). Returns the number of rows restored. */
export async function bulkRestore(
    name: CollectionName,
    ids: string[],
    actorId?: string,
): Promise<number> {
    const rows = list<Entity>(name);
    const idSet = new Set(ids);
    let count = 0;
    for (const row of rows) {
        if (
            idSet.has(row.id) &&
            row.archivedAt !== null &&
            row.archivedAt !== undefined
        ) {
            row.archivedAt = null;
            row.archivedBy = undefined;
            row.updatedAt = now();
            row.updatedBy = actorId;
            count++;
        }
    }
    if (count > 0) await writeCollection(name, rows);
    return count;
}

/** Bulk update (apply the same patch to many ids). Returns the number updated. */
export async function bulkUpdate<T extends Entity>(
    name: CollectionName,
    ids: string[],
    patch: Partial<T>,
    actorId?: string,
): Promise<number> {
    const rows = list<T>(name);
    const idSet = new Set(ids);
    let count = 0;
    for (const row of rows) {
        if (idSet.has(row.id)) {
            Object.assign(row, patch, { updatedAt: now(), updatedBy: actorId });
            count++;
        }
    }
    if (count > 0) await writeCollection(name, rows);
    return count;
}

/* ── Drag & drop reordering ────────────────────────────────────────────── */

/**
 * Reorder rows by id. Given an ordered list of ids, assigns `displayOrder`
 * 0..n-1 to each. Ids not in the list keep their existing order.
 */
export async function reorder<T extends Entity>(
    name: CollectionName,
    orderedIds: string[],
    actorId?: string,
): Promise<void> {
    const rows = list<T>(name);
    const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
    for (const row of rows) {
        if (orderMap.has(row.id)) {
            (row as Record<string, unknown>).displayOrder = orderMap.get(
                row.id,
            );
            (row as Record<string, unknown>).updatedAt = now();
            (row as Record<string, unknown>).updatedBy = actorId;
        }
    }
    await writeCollection(name, rows);
}

/* ── Version history / undo ────────────────────────────────────────────── */

/** Restore an entity to a previous version (by version number). */
export async function restoreVersion<T extends Entity>(
    name: CollectionName,
    id: string,
    version: number,
    actorId?: string,
): Promise<T | null> {
    const entity = findById<T>(name, id);
    if (!entity) return null;
    const history = (entity.versionHistory as VersionEntry[] | undefined) ?? [];
    const entry = history.find((v) => v.version === version);
    if (!entry) return null;
    // Snapshot the current state first (so the restore is itself undoable).
    const restored = {
        ...entry.snapshot,
        id,
        updatedAt: now(),
        updatedBy: actorId,
        versionHistory: pushVersion(
            entity as unknown as Entity,
            actorId,
            `Restored v${version}`,
        ),
    } as unknown as T;
    const rows = list<T>(name);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    rows[idx] = restored;
    await writeCollection(name, rows);
    await syncRelationships(
        name,
        restored as unknown as Record<string, unknown> & { id: string },
        entity as unknown as Record<string, unknown> & { id: string },
        actorId,
    );
    return restored;
}

/* ── Import / Export ───────────────────────────────────────────────────── */

/** Export a collection as a JSON array (deep copy). */
export function exportCollection<T extends Entity>(name: CollectionName): T[] {
    return JSON.parse(JSON.stringify(list<T>(name))) as T[];
}

/** Export every collection as a keyed object (for full backup). */
export function exportAll(): Record<string, unknown[]> {
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
    ];
    const out: Record<string, unknown[]> = {};
    for (const name of names) {
        out[name] = exportCollection(name);
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
        await writeCollection(name, incoming);
        return incoming.length;
    }
    if (mode === "append") {
        const rows = list<T>(name);
        for (const row of incoming) {
            const { id: _id, ...rest } = row as Record<string, unknown>;
            void _id;
            rows.push({
                ...rest,
                id: randomUUID(),
                createdAt: now(),
                updatedAt: now(),
                updatedBy: actorId,
            } as T);
        }
        await writeCollection(name, rows);
        return rows.length;
    }
    // merge
    const rows = list<T>(name);
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const row of incoming) {
        const existing = byId.get(row.id);
        if (existing) {
            byId.set(row.id, {
                ...existing,
                ...row,
                updatedAt: now(),
                updatedBy: actorId,
            });
        } else {
            byId.set(row.id, {
                ...row,
                createdAt: now(),
                updatedAt: now(),
                updatedBy: actorId,
            });
        }
    }
    await writeCollection(name, [...byId.values()]);
    return byId.size;
}
