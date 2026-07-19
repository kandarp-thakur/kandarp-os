/**
 * GET  /api/admin/backup — export all collections as a single JSON blob (backup:read)
 * POST /api/admin/backup — restore from a backup blob (backup:write)
 *
 * The export is a `{ version, exportedAt, collections: { name: rows[] } }`
 * object. The restore replaces every collection's contents atomically and
 * invalidates the in-memory cache so subsequent reads see the new data.
 */

import { z } from "zod";

import {
    audit,
    json,
    parseBody,
    requirePermission,
} from "@backend/middlewares/api";
import { list, replaceAll } from "@backend/repositories/repo";
import { revalidateAll } from "@backend/cache/revalidate";
import type { CollectionName } from "@backend/schemas/types";

/** Every collection that gets included in a backup. */
const ALL_COLLECTIONS: CollectionName[] = [
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
    "analytics",
    "activityLogs",
    "categories",
    "tags",
];

export async function GET() {
    const session = await requirePermission("backup:read");
    if (session instanceof Response) return session;

    const collections: Record<string, unknown[]> = {};
    for (const name of ALL_COLLECTIONS) {
        collections[name] = await list(name);
    }

    return json({
        version: 1,
        exportedAt: new Date().toISOString(),
        collections,
    });
}

const restoreSchema = z.object({
    version: z.number(),
    collections: z.record(z.array(z.unknown())),
});

export async function POST(req: Request) {
    const session = await requirePermission("backup:write");
    if (session instanceof Response) return session;

    const body = await parseBody(req, restoreSchema);
    if (body instanceof Response) return body;

    // Restore each collection that was present in the backup.
    for (const name of ALL_COLLECTIONS) {
        const rows = body.collections[name];
        if (Array.isArray(rows)) {
            await replaceAll(name, rows as never[]);
        }
    }

    // A restore touches every collection, so purge the entire public cache.
    // (Prisma reads are always live — no in-memory cache to invalidate.)
    revalidateAll();

    audit(
        session,
        "backup.restore",
        "system",
        undefined,
        `restored ${Object.keys(body.collections).length} collections`,
    );
    return json({ ok: true, restored: Object.keys(body.collections) });
}
