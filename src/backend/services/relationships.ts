/**
 * Relationship Engine — bidirectional link synchronization.
 *
 * Every content entity carries `related*Ids` arrays. When a relationship is
 * added on one side (e.g. a project links to a blog), the engine mirrors it
 * on the other side (the blog's `relatedProjectIds` gains the project). When
 * a relationship is removed, the engine removes the mirror too.
 *
 * This keeps every related page consistent automatically — the final
 * requirement: "Changes should automatically update every related page."
 *
 * The engine is collection-aware: it knows which field on which collection
 * mirrors which field on which other collection. It is invoked by the
 * repository after every create/update so relationships are always consistent.
 *
 * Concurrency: writes are serialized per-collection by the store's mutex, so
 * the engine can safely read-modify-write mirror collections.
 */

import { list, update } from "@backend/repositories/repo";
import type {
    BlogPost,
    CollectionName,
    Experience,
    InfraNode,
    Project,
    Skill,
} from "@backend/schemas/types";

/** A minimal row shape that satisfies the repository's Entity constraint. */
interface Row {
    id: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: unknown;
}

/**
 * The relationship map: for each (collection, field) pair, the mirror is
 * (targetCollection, targetField). Symmetric — A→B implies B→A.
 */
interface MirrorSpec {
    /** The field on the source entity holding target ids. */
    sourceField: string;
    /** The collection the ids point at. */
    targetCollection: CollectionName;
    /** The field on the target entity that should hold the source id. */
    targetField: string;
}

/** Per-collection mirror specs. */
const MIRRORS: Record<CollectionName, MirrorSpec[]> = {
    projects: [
        {
            sourceField: "relatedBlogIds",
            targetCollection: "blogPosts",
            targetField: "relatedProjectIds",
        },
        {
            sourceField: "relatedSkillIds",
            targetCollection: "skills",
            targetField: "relatedProjectIds",
        },
        {
            sourceField: "relatedExperienceIds",
            targetCollection: "experience",
            targetField: "relatedProjectIds",
        },
        {
            sourceField: "relatedInfraIds",
            targetCollection: "infraNodes",
            targetField: "relatedProjectIds",
        },
    ],
    blogPosts: [
        {
            sourceField: "relatedProjectIds",
            targetCollection: "projects",
            targetField: "relatedBlogIds",
        },
        {
            sourceField: "relatedSkillIds",
            targetCollection: "skills",
            targetField: "relatedBlogIds",
        },
        {
            sourceField: "relatedInfraIds",
            targetCollection: "infraNodes",
            targetField: "relatedBlogIds",
        },
        {
            sourceField: "relatedPostIds",
            targetCollection: "blogPosts",
            targetField: "relatedPostIds",
        },
    ],
    experience: [
        {
            sourceField: "relatedProjectIds",
            targetCollection: "projects",
            targetField: "relatedExperienceIds",
        },
        {
            sourceField: "relatedSkillIds",
            targetCollection: "skills",
            targetField: "relatedExperienceIds",
        },
    ],
    skills: [
        {
            sourceField: "relatedProjectIds",
            targetCollection: "projects",
            targetField: "relatedSkillIds",
        },
        {
            sourceField: "relatedBlogIds",
            targetCollection: "blogPosts",
            targetField: "relatedSkillIds",
        },
        {
            sourceField: "relatedInfraIds",
            targetCollection: "infraNodes",
            targetField: "relatedSkillIds",
        },
    ],
    infraNodes: [
        {
            sourceField: "relatedProjectIds",
            targetCollection: "projects",
            targetField: "relatedInfraIds",
        },
        {
            sourceField: "relatedBlogIds",
            targetCollection: "blogPosts",
            targetField: "relatedInfraIds",
        },
        {
            sourceField: "relatedSkillIds",
            targetCollection: "skills",
            targetField: "relatedInfraIds",
        },
    ],
    // Collections without relationship fields.
    infraEdges: [],
    awards: [],
    education: [],
    certificates: [],
    services: [],
    resumes: [],
    media: [],
    users: [],
    settings: [],
    profiles: [],
    siteCustomization: [],
    analytics: [],
    activityLogs: [],
    categories: [],
    tags: [],
};

/** Read a (possibly nested) array field from an entity. */
function readIds(entity: Record<string, unknown>, field: string): string[] {
    const value = entity[field];
    return Array.isArray(value)
        ? (value as unknown[]).filter((v): v is string => typeof v === "string")
        : [];
}

/**
 * Sync relationships for a single entity after a create/update.
 *
 * For each mirror spec, compare the entity's current `sourceField` ids against
 * the target entities' `targetField` arrays and reconcile:
 *   • If the source lists a target id but the target doesn't list the source → add.
 *   • If the target lists the source but the source no longer lists the target → remove.
 *
 * `prev` is the entity's previous state (for updates) so we can detect
 * removed relationships. On create, pass `prev = null`.
 */
export async function syncRelationships(
    collection: CollectionName,
    entity: Record<string, unknown> & { id: string },
    prev: (Record<string, unknown> & { id: string }) | null,
    actorId?: string,
): Promise<void> {
    const specs = MIRRORS[collection];
    if (specs.length === 0) return;

    const sourceId = entity.id;

    for (const spec of specs) {
        const currentIds = new Set(readIds(entity, spec.sourceField));
        const prevIds = new Set(prev ? readIds(prev, spec.sourceField) : []);

        // Determine added + removed target ids.
        const added = [...currentIds].filter((id) => !prevIds.has(id));
        const removed = [...prevIds].filter((id) => !currentIds.has(id));

        if (added.length === 0 && removed.length === 0) continue;

        // Reconcile each affected target entity.
        const targets = await list<Row>(spec.targetCollection);
        for (const target of targets) {
            const mirrorIds = readIds(target, spec.targetField);
            const hasSource = mirrorIds.includes(sourceId);
            const shouldBePresent = currentIds.has(target.id);

            if (shouldBePresent && !hasSource) {
                // Add the source id to the mirror.
                const next = [...mirrorIds, sourceId];
                await update(
                    spec.targetCollection,
                    target.id,
                    { [spec.targetField]: next } as never,
                    actorId,
                );
            } else if (!shouldBePresent && hasSource) {
                // Remove the source id from the mirror (it was removed, or it was a stale link).
                const next = mirrorIds.filter((id) => id !== sourceId);
                await update(
                    spec.targetCollection,
                    target.id,
                    { [spec.targetField]: next } as never,
                    actorId,
                );
            }
        }

        // For removed target ids that no longer exist, nothing to do.
        void added;
        void removed;
    }
}

/**
 * Remove all relationship references to a deleted entity from every mirror.
 * Called by the repository after a delete so no dangling ids remain.
 */
export async function cleanupRelationships(
    collection: CollectionName,
    entityId: string,
    actorId?: string,
): Promise<void> {
    const specs = MIRRORS[collection];
    for (const spec of specs) {
        const targets = await list<Row>(spec.targetCollection);
        for (const target of targets) {
            const mirrorIds = readIds(target, spec.targetField);
            if (!mirrorIds.includes(entityId)) continue;
            const next = mirrorIds.filter((id) => id !== entityId);
            await update(
                spec.targetCollection,
                target.id,
                { [spec.targetField]: next } as never,
                actorId,
            );
        }
    }

    // Also clean up the symmetric self-referential field (blog ↔ blog).
    if (collection === "blogPosts") {
        const posts = await list<BlogPost>("blogPosts");
        for (const post of posts) {
            if (post.relatedPostIds.includes(entityId)) {
                const next = post.relatedPostIds.filter(
                    (id) => id !== entityId,
                );
                await update(
                    "blogPosts",
                    post.id,
                    { relatedPostIds: next } as never,
                    actorId,
                );
            }
        }
    }
}

/**
 * Resolve all related entities for a given entity — used by the public site
 * to render "Related Projects / Blogs / Skills" sections without manual joins.
 */
export interface RelatedEntities {
    projects: Project[];
    blogs: BlogPost[];
    experience: Experience[];
    skills: Skill[];
    infraNodes: InfraNode[];
}

export async function resolveRelated(
    collection: CollectionName,
    entity: Record<string, unknown>,
): Promise<RelatedEntities> {
    const result: RelatedEntities = {
        projects: [],
        blogs: [],
        experience: [],
        skills: [],
        infraNodes: [],
    };
    const specs = MIRRORS[collection];

    for (const spec of specs) {
        const ids = readIds(entity, spec.sourceField);
        if (ids.length === 0) continue;
        const idSet = new Set(ids);
        const all = await list<Row>(spec.targetCollection);
        const matched = all.filter((row) => idSet.has(row.id));
        switch (spec.targetCollection) {
            case "projects":
                result.projects.push(...(matched as unknown as Project[]));
                break;
            case "blogPosts":
                result.blogs.push(...(matched as unknown as BlogPost[]));
                break;
            case "experience":
                result.experience.push(...(matched as unknown as Experience[]));
                break;
            case "skills":
                result.skills.push(...(matched as unknown as Skill[]));
                break;
            case "infraNodes":
                result.infraNodes.push(...(matched as unknown as InfraNode[]));
                break;
        }
    }

    return result;
}
