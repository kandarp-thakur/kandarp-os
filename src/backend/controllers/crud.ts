/**
 * CRUD route factory — generates list/get/create/update/delete handlers for a
 * collection, wired to the repository + RBAC + audit log.
 *
 * Each entity route file is a one-liner that calls `createCrudHandlers` with
 * its collection name, Zod schema, and the permission it requires. This keeps
 * every CRUD endpoint consistent (pagination, validation, auth, audit) while
 * staying thin.
 *
 * The factory returns `{ GET, POST }` for the collection root and
 * `{ GET, PATCH, DELETE }` for `[id]` routes. Duplicate + bulk actions are
 * handled by dedicated routes.
 */

import { z, type ZodObject, type ZodRawShape } from "zod";

import {
    audit,
    error,
    getQuery,
    json,
    parseBody,
    requirePermission,
} from "@backend/middlewares/api";
import { can } from "@backend/permissions/rbac";
import {
    bulkArchive,
    bulkDelete,
    bulkRestore,
    bulkUpdate,
    create,
    duplicate,
    exportCollection,
    findById,
    importCollection,
    query,
    remove,
    reorder,
    restoreVersion,
    update,
} from "@backend/repositories/repo";
import { revalidateCollection } from "@backend/cache/revalidate";
import type { CollectionName } from "@backend/schemas/types";
import type { Permission } from "@backend/permissions/rbac";

/** The minimum shape every entity shares (the repo's Entity constraint). */
interface Entity {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
    [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CrudConfig<T extends Entity, S extends ZodObject<ZodRawShape>> {
    collection: CollectionName;
    schema: S;
    /** Permission required to read. */
    read: Permission;
    /** Permission required to write (create/update/duplicate). */
    write: Permission;
    /** Permission required to delete. */
    del: Permission;
    /** Entity label for audit logs, e.g. "project". */
    label: string;
}

/** Build a typed CrudConfig (infers T + S from the schema). */
export function createCrudConfig<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(config: CrudConfig<T, S>): CrudConfig<T, S> {
    return config;
}

/** Handlers for the collection root: GET (list) + POST (create). */
export function createCollectionHandlers<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(cfg: CrudConfig<T, S>) {
    async function GET(req: Request) {
        const session = await requirePermission(cfg.read);
        if (session instanceof Response) return session;
        const result = await query<T>(cfg.collection, getQuery(req));
        return json(result);
    }

    async function POST(req: Request) {
        const session = await requirePermission(cfg.write);
        if (session instanceof Response) return session;
        // Omit the server-generated audit fields — `id`, `createdAt`, and
        // `updatedAt` are produced by `create()`, not supplied by the client.
        // Validating against the full schema would reject every create request
        // with "Required, Required, Required" for those three fields.
        const body = await parseBody(
            req,
            cfg.schema.omit({ id: true, createdAt: true, updatedAt: true }),
        );
        if (body instanceof Response) return body;
        const entity = await create<T>(
            cfg.collection,
            body as unknown as Omit<T, "id" | "createdAt" | "updatedAt">,
            session.sub,
        );
        audit(session, `${cfg.label}.create`, cfg.collection, entity.id);
        revalidateCollection(cfg.collection);
        return json(entity, 201);
    }

    return { GET, POST };
}

/** Handlers for a single entity: GET (one) + PATCH (update) + DELETE. */
export function createEntityHandlers<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(cfg: CrudConfig<T, S>) {
    async function GET(
        _req: Request,
        { params }: { params: Promise<{ id: string }> },
    ) {
        const session = await requirePermission(cfg.read);
        if (session instanceof Response) return session;
        const { id } = await params;
        const entity = await findById<T>(cfg.collection, id);
        if (!entity) return error(`${cfg.label} not found`, 404, 404);
        return json(entity);
    }

    async function PATCH(
        req: Request,
        { params }: { params: Promise<{ id: string }> },
    ) {
        const session = await requirePermission(cfg.write);
        if (session instanceof Response) return session;
        const { id } = await params;
        const body = await parseBody(req, cfg.schema.partial());
        if (body instanceof Response) return body;
        const entity = await update<T>(
            cfg.collection,
            id,
            body as unknown as Partial<T>,
            session.sub,
        );
        if (!entity) return error(`${cfg.label} not found`, 404, 404);
        audit(session, `${cfg.label}.update`, cfg.collection, id);
        revalidateCollection(cfg.collection);
        return json(entity);
    }

    async function DELETE(
        _req: Request,
        { params }: { params: Promise<{ id: string }> },
    ) {
        const session = await requirePermission(cfg.del);
        if (session instanceof Response) return session;
        const { id } = await params;
        const ok = await remove(cfg.collection, id);
        if (!ok) return error(`${cfg.label} not found`, 404, 404);
        audit(session, `${cfg.label}.delete`, cfg.collection, id);
        revalidateCollection(cfg.collection);
        return json({ ok: true });
    }

    return { GET, PATCH, DELETE };
}

/** Handler for duplicating an entity: POST /api/admin/<entity>/<id>/duplicate. */
export function createDuplicateHandler<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(cfg: CrudConfig<T, S>) {
    async function POST(
        _req: Request,
        { params }: { params: Promise<{ id: string }> },
    ) {
        const session = await requirePermission(cfg.write);
        if (session instanceof Response) return session;
        const { id } = await params;
        const entity = await duplicate<T>(cfg.collection, id, {}, session.sub);
        if (!entity) return error(`${cfg.label} not found`, 404, 404);
        audit(
            session,
            `${cfg.label}.duplicate`,
            cfg.collection,
            entity.id,
            `duplicated from ${id}`,
        );
        revalidateCollection(cfg.collection);
        return json(entity, 201);
    }
    return { POST };
}

/* ── Bulk actions ──────────────────────────────────────────────────────── */

/** Bulk action request body. */
interface BulkBody {
    ids: string[];
    action:
        "delete" | "archive" | "restore" | "publish" | "draft" | "duplicate";
    /** Optional patch for bulk update actions. */
    patch?: Record<string, unknown>;
}

/** Handler for bulk actions: POST /api/admin/<entity>/bulk. */
export function createBulkHandler<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(cfg: CrudConfig<T, S>) {
    async function POST(req: Request) {
        const session = await requirePermission(cfg.write);
        if (session instanceof Response) return session;
        const body = await parseBody<BulkBody>(
            req,
            z.object({
                ids: z.array(z.string()),
                action: z.enum([
                    "delete",
                    "archive",
                    "restore",
                    "publish",
                    "draft",
                    "duplicate",
                ]),
                patch: z.record(z.unknown()).optional(),
            }),
        );
        if (body instanceof Response) return body;

        let affected = 0;
        switch (body.action) {
            case "delete": {
                // Delete requires the delete permission.
                if (!can(session.role, cfg.del))
                    return error(
                        "Forbidden — insufficient permissions",
                        403,
                        403,
                    );
                affected = await bulkDelete(cfg.collection, body.ids);
                audit(
                    session,
                    `${cfg.label}.bulk_delete`,
                    cfg.collection,
                    "",
                    `${affected} rows`,
                );
                break;
            }
            case "archive":
                affected = await bulkArchive(
                    cfg.collection,
                    body.ids,
                    session.sub,
                );
                audit(
                    session,
                    `${cfg.label}.bulk_archive`,
                    cfg.collection,
                    "",
                    `${affected} rows`,
                );
                break;
            case "restore":
                affected = await bulkRestore(
                    cfg.collection,
                    body.ids,
                    session.sub,
                );
                audit(
                    session,
                    `${cfg.label}.bulk_restore`,
                    cfg.collection,
                    "",
                    `${affected} rows`,
                );
                break;
            case "publish":
                affected = await bulkUpdate<T>(
                    cfg.collection,
                    body.ids,
                    { status: "published" } as unknown as Partial<T>,
                    session.sub,
                );
                audit(
                    session,
                    `${cfg.label}.bulk_publish`,
                    cfg.collection,
                    "",
                    `${affected} rows`,
                );
                break;
            case "draft":
                affected = await bulkUpdate<T>(
                    cfg.collection,
                    body.ids,
                    { status: "draft" } as unknown as Partial<T>,
                    session.sub,
                );
                audit(
                    session,
                    `${cfg.label}.bulk_draft`,
                    cfg.collection,
                    "",
                    `${affected} rows`,
                );
                break;
            case "duplicate": {
                for (const id of body.ids) {
                    await duplicate<T>(cfg.collection, id, {}, session.sub);
                    affected++;
                }
                audit(
                    session,
                    `${cfg.label}.bulk_duplicate`,
                    cfg.collection,
                    "",
                    `${affected} rows`,
                );
                break;
            }
        }
        revalidateCollection(cfg.collection);
        return json({ ok: true, affected });
    }
    return { POST };
}

/* ── Reorder (drag & drop) ─────────────────────────────────────────────── */

/** Handler for reordering: POST /api/admin/<entity>/reorder with `{ ids: [] }`. */
export function createReorderHandler<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(cfg: CrudConfig<T, S>) {
    async function POST(req: Request) {
        const session = await requirePermission(cfg.write);
        if (session instanceof Response) return session;
        const body = await parseBody(
            req,
            z.object({ ids: z.array(z.string()) }),
        );
        if (body instanceof Response) return body;
        await reorder(cfg.collection, body.ids, session.sub);
        audit(
            session,
            `${cfg.label}.reorder`,
            cfg.collection,
            "",
            `${body.ids.length} rows`,
        );
        revalidateCollection(cfg.collection);
        return json({ ok: true });
    }
    return { POST };
}

/* ── Archive / restore single entity ──────────────────────────────────── */

/** Handler for archiving: POST /api/admin/<entity>/<id>/archive. */
export function createArchiveHandler<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(cfg: CrudConfig<T, S>) {
    async function POST(
        _req: Request,
        { params }: { params: Promise<{ id: string }> },
    ) {
        const session = await requirePermission(cfg.write);
        if (session instanceof Response) return session;
        const { id } = await params;
        const affected = await bulkArchive(cfg.collection, [id], session.sub);
        if (affected === 0) return error(`${cfg.label} not found`, 404, 404);
        audit(session, `${cfg.label}.archive`, cfg.collection, id);
        revalidateCollection(cfg.collection);
        return json({ ok: true });
    }
    return { POST };
}

/** Handler for restoring: POST /api/admin/<entity>/<id>/restore. */
export function createRestoreHandler<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(cfg: CrudConfig<T, S>) {
    async function POST(
        _req: Request,
        { params }: { params: Promise<{ id: string }> },
    ) {
        const session = await requirePermission(cfg.write);
        if (session instanceof Response) return session;
        const { id } = await params;
        const affected = await bulkRestore(cfg.collection, [id], session.sub);
        if (affected === 0) return error(`${cfg.label} not found`, 404, 404);
        audit(session, `${cfg.label}.restore`, cfg.collection, id);
        revalidateCollection(cfg.collection);
        return json({ ok: true });
    }
    return { POST };
}

/* ── Version history ──────────────────────────────────────────────────── */

/** Handler for restoring a version: POST /api/admin/<entity>/<id>/restore-version. */
export function createRestoreVersionHandler<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(cfg: CrudConfig<T, S>) {
    async function POST(
        req: Request,
        { params }: { params: Promise<{ id: string }> },
    ) {
        const session = await requirePermission(cfg.write);
        if (session instanceof Response) return session;
        const { id } = await params;
        const body = await parseBody(
            req,
            z.object({ version: z.number().int() }),
        );
        if (body instanceof Response) return body;
        const entity = await restoreVersion<T>(
            cfg.collection,
            id,
            body.version,
            session.sub,
        );
        if (!entity)
            return error(`${cfg.label} or version not found`, 404, 404);
        audit(
            session,
            `${cfg.label}.restore_version`,
            cfg.collection,
            id,
            `v${body.version}`,
        );
        revalidateCollection(cfg.collection);
        return json(entity);
    }
    return { POST };
}

/* ── Import / Export ───────────────────────────────────────────────────── */

/** Handler for exporting a collection: GET /api/admin/<entity>/export. */
export function createExportHandler<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(cfg: CrudConfig<T, S>) {
    async function GET(_req: Request) {
        const session = await requirePermission(cfg.read);
        if (session instanceof Response) return session;
        const rows = await exportCollection<T>(cfg.collection);
        return json({ collection: cfg.collection, rows });
    }
    return { GET };
}

/** Handler for importing: POST /api/admin/<entity>/import with `{ rows, mode }`. */
export function createImportHandler<
    T extends Entity,
    S extends ZodObject<ZodRawShape>,
>(cfg: CrudConfig<T, S>) {
    async function POST(req: Request) {
        const session = await requirePermission(cfg.write);
        if (session instanceof Response) return session;
        const body = await parseBody(
            req,
            z.object({
                rows: z.array(z.record(z.unknown())),
                mode: z.enum(["replace", "merge", "append"]).default("merge"),
            }),
        );
        if (body instanceof Response) return body;
        const count = await importCollection<T>(
            cfg.collection,
            body.rows as unknown as T[],
            body.mode,
            session.sub,
        );
        audit(
            session,
            `${cfg.label}.import`,
            cfg.collection,
            "",
            `${count} rows (${body.mode})`,
        );
        revalidateCollection(cfg.collection);
        return json({ ok: true, count });
    }
    return { POST };
}
