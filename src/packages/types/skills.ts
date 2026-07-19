import { z } from "zod";

/**
 * Type definitions for the Skills service-mesh topology.
 *
 * Zod schemas are the source of truth; types are inferred. The page renders a
 * skill set as an **interactive topology graph** — each skill is a *node* (a
 * service in the mesh) and the relationships between skills are *edges* (the
 * connections that route work between them). Hovering a node illuminates its
 * connected subgraph the way a service-mesh dashboard highlights a service's
 * dependencies.
 *
 * Proficiency is a **status**, not a percentage — the same vocabulary the rest
 * of the OS uses: `active` (daily driver), `idle` (deployed, not in heavy
 * rotation), `learning` (provisioning). There are no progress bars.
 *
 * Nodes are positioned on a 0–100 grid (`x`, `y`) so the layout is
 * resolution-independent and renders identically server- and client-side (no
 * hydration mismatch). Edges are **derived** from each node's `connections`
 * array — they are not stored separately.
 */

/**
 * A skill's domain — drives clustering + a subtle tint. Nodes drift toward
 * their domain cluster in the force-directed layout.
 */
export const skillDomainSchema = z.enum([
    "frontend",
    "backend",
    "devops",
    "data",
    "design",
]);
export type SkillDomain = z.infer<typeof skillDomainSchema>;

/**
 * A skill's status — replaces progress bars. Drives the ring color, node size,
 * and pulse. Mirrors the deployment/container status semantics used elsewhere.
 *
 * - `active`   — daily driver (green, larger, subtle pulse)
 * - `idle`     — deployed, not in heavy rotation (gray, standard)
 * - `learning` — provisioning, actively studying (amber, smaller, dashed ring)
 */
export const skillStatusSchema = z.enum(["active", "idle", "learning"]);
export type SkillStatus = z.infer<typeof skillStatusSchema>;

/**
 * A skill node — one service in the mesh.
 *
 * Positioned on a 0–100 grid (`x`, `y`) so the layout is resolution-independent
 * and renders identically server- and client-side (no hydration mismatch).
 * `connections` references other node ids; edges are derived symmetrically.
 */
export const skillNodeSchema = z.object({
    /** Stable id / slug — used for React keys, edge references, and selection. */
    id: z.string(),
    /** Display name, e.g. `TypeScript`, `Kubernetes`. */
    name: z.string(),
    /** Short code for small nodes, e.g. `TS`, `K8s`, `PG`. */
    abbr: z.string(),
    /** Cluster + subtle tint. */
    domain: skillDomainSchema,
    /** Ring color + size + pulse. */
    status: skillStatusSchema,
    /** One-line tagline shown in the detail panel. */
    tagline: z.string(),
    /** Horizontal position on the topology grid, 0–100 (% of width). */
    x: z.number().min(0).max(100),
    /** Vertical position on the topology grid, 0–100 (% of height). */
    y: z.number().min(0).max(100),
    /** Neighbor node ids — edges are derived symmetrically from this list. */
    connections: z.array(z.string()).default([]),
});
export type SkillNode = z.infer<typeof skillNodeSchema>;

/**
 * A topology edge — a bidirectional relationship between two skills.
 *
 * Edges render as connecting lines between nodes; the relationship is
 * symmetric (an undirected link, like two services that call each other).
 * `from`/`to` reference node ids; both endpoints must exist (validated at the
 * data layer). Edges are derived from node `connections` arrays, then
 * de-duplicated so each pair appears once.
 */
export const skillEdgeSchema = z.object({
    /** One endpoint node id. */
    from: z.string(),
    /** The other endpoint node id. */
    to: z.string(),
});
export type SkillEdge = z.infer<typeof skillEdgeSchema>;

/** Summary stat rendered as a glass pill below the page header. */
export const skillStatSchema = z.object({
    /** Stat key — used to color the value (e.g. `active` → success). */
    key: z.enum(["nodes", "active", "idle", "learning"]),
    label: z.string(),
    value: z.string(),
});
export type SkillStat = z.infer<typeof skillStatSchema>;
