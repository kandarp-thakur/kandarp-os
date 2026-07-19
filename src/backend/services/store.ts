/**
 * File-based JSON store — the persistence engine for the admin console.
 *
 * A zero-dependency, server-only document store. Each collection is a single
 * JSON file under `.admin-data/`. Reads are cached in-memory (the dev server
 * is a long-running process); writes flush to disk atomically (write-temp +
 * rename) so a crash never leaves a half-written file.
 *
 * This is intentionally simple — it is the swappable seam. Replacing this
 * module with a Postgres/SQLite adapter later changes nothing upstream
 * because the repository layer (repo.ts) is the public API.
 *
 * Concurrency: a process-wide mutex serializes writes per collection. The
 * admin is a low-write, single-operator tool, so coarse locking is fine.
 */

import {
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    writeFileSync,
} from "fs";
import { dirname, join } from "path";

import { adminEnv } from "@backend/config/env";

/** In-memory cache — keyed by collection name. */
const cache = new Map<string, unknown[]>();

/** Per-collection write mutex (promise chains). */
const locks = new Map<string, Promise<unknown>>();

/** Resolve the absolute path for a collection file. */
function collectionPath(name: string): string {
    return join(process.cwd(), adminEnv.dataDir, `${name}.json`);
}

/** Ensure the data directory exists. */
function ensureDir(): void {
    const dir = join(process.cwd(), adminEnv.dataDir);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/** Read a collection from disk (or return the cached array). */
export function readCollection<T>(name: string): T[] {
    if (cache.has(name)) return cache.get(name) as T[];
    const path = collectionPath(name);
    let rows: T[];
    if (existsSync(path)) {
        try {
            rows = JSON.parse(readFileSync(path, "utf8")) as T[];
        } catch {
            rows = [];
        }
    } else {
        rows = [];
    }
    cache.set(name, rows);
    return rows;
}

/** Serialize a write behind a per-collection mutex. */
function withLock<T>(name: string, fn: () => T): Promise<T> {
    const prev = locks.get(name) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    locks.set(
        name,
        next.catch(() => undefined),
    );
    return next as Promise<T>;
}

/**
 * Persist a collection to disk atomically.
 * Updates the in-memory cache first, then writes a temp file + renames.
 */
export function writeCollection<T>(name: string, rows: T[]): Promise<void> {
    return withLock(name, () => {
        cache.set(name, rows);
        ensureDir();
        const path = collectionPath(name);
        const tmp = `${path}.tmp`;
        writeFileSync(tmp, JSON.stringify(rows, null, 2), "utf8");
        renameSync(tmp, path);
        // Keep the parent dir in the lock map tidy.
        void dirname(path);
    });
}

/** Drop the in-memory cache for a collection (forces a re-read). */
export function invalidate(name: string): void {
    cache.delete(name);
}

/** Drop the entire cache (used by backup/restore). */
export function invalidateAll(): void {
    cache.clear();
}
