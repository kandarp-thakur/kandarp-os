/**
 * Repository — the public data-access API for the admin console.
 *
 * This module is now a thin re-export of the Prisma-backed implementation in
 * `repo-prisma.ts`. The original implementation used a file-based JSON store;
 * it has been replaced with PostgreSQL + Prisma while preserving the exact
 * public API (function names + signatures) so the ~120 route handlers, the
 * CRUD factory, the relationship engine, and the public-data layer keep
 * working.
 *
 * IMPORTANT change from the JSON-store era: every read function is now
 * **async** (returns a Promise) because database I/O is inherently
 * asynchronous. Callers that previously did `const rows = list<T>(name)` must
 * now do `const rows = await list<T>(name)`. The CRUD factory and all route
 * handlers have been updated accordingly.
 *
 * The store is no longer the swappable seam — Prisma is. This module remains
 * the public contract so future storage changes (read replicas, a cache
 * layer, etc.) can be inserted here without touching callers.
 *
 * @see repo-prisma.ts for the implementation.
 * @see docs/backend/repository.md for the full API.
 */

export {
    list,
    query,
    findById,
    findByField,
    create,
    update,
    remove,
    duplicate,
    count,
    replaceAll,
    bulkDelete,
    bulkArchive,
    bulkRestore,
    bulkUpdate,
    reorder,
    restoreVersion,
    exportCollection,
    exportAll,
    importCollection,
} from "@backend/repositories/repo-prisma";

export type {
    QueryOptions,
    PagedResult,
} from "@backend/repositories/repo-prisma";
