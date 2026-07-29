import { z } from "zod";

import type { DevOpsIconId } from "@features/background/components/devopsIcons";

/**
 * Type definitions for the Infrastructure topology.
 *
 * Zod schemas are the source of truth; types are inferred. The page renders the
 * DevOps stack as an **interactive topology graph** — nodes are the technology
 * families (AWS, Docker, Linux, GitHub, Networking, Firewall, NAS, Python) and
 * edges are the relationships between them. Clicking a node opens a detail
 * panel (`node inspect`) with its role, specs, metrics, and notes.
 *
 * The node `icon` references the shared DevOps icon registry
 * (`src/components/background/devopsIcons.ts`) so the topology reuses the same
 * monochrome silhouettes as the animated background — one icon vocabulary.
 */

/**
 * A node's operational status — drives the status dot color + pulse.
 * Mirrors the deployment/container status semantics used elsewhere.
 */
export const nodeStatusSchema = z.enum(["active", "standby", "maintenance"]);
export type NodeStatus = z.infer<typeof nodeStatusSchema>;

/**
 * A single spec line — a key/value pair rendered in the inspect panel's
 * "Specs" section (e.g. `Region` → `us-east-1`). Kept as a pair rather than a
 * record so ordering is preserved and each line can carry its own formatting.
 */
export const nodeSpecSchema = z.object({
    /** Spec label, e.g. `Region`, `Kernel`, `Engine`. */
    label: z.string(),
    /** Spec value, e.g. `us-east-1`, `6.6 LTS`, `containerd`. */
    value: z.string(),
});
export type NodeSpec = z.infer<typeof nodeSpecSchema>;

/**
 * A node metric — a labeled stat rendered as a mounted volume (mirrors the
 * projects inspect panel's metrics block).
 */
export const nodeMetricSchema = z.object({
    /** Metric label, e.g. `Uptime`, `Throughput`, `Capacity`. */
    label: z.string(),
    /** Metric value (string to allow `99.99%` / `2.4 TB` formatting). */
    value: z.string(),
});
export type NodeMetric = z.infer<typeof nodeMetricSchema>;

/** An external link rendered in the inspect panel's action footer. */
export const nodeLinkSchema = z.object({
    label: z.string(),
    url: z.string().url(),
    /** `primary` = gradient button; `secondary` = glass button. */
    variant: z.enum(["primary", "secondary"]).default("secondary"),
});
export type NodeLink = z.infer<typeof nodeLinkSchema>;

/**
 * A topology node — one technology family in the infrastructure graph.
 *
 * Positioned on a 0–100 grid (`x`, `y`) so the layout is resolution-independent
 * and renders identically server- and client-side (no hydration mismatch).
 * Each node carries the detail shown in its `node inspect` panel.
 */
export const infraNodeSchema = z.object({
    /** Stable id / slug — used for React keys, edge references, and selection. */
    id: z.string(),
    /** Display name, e.g. `AWS`, `Docker`, `Linux`. */
    name: z.string(),
    /** The shared DevOps icon id — drives the node's silhouette. */
    icon: z.custom<DevOpsIconId>((val) => typeof val === "string"),
    /** One-line role in the stack (collapsed node label + inspect subtitle). */
    role: z.string(),
    /** Status — `active` (green, pulsing), `standby` (blue), `maintenance` (amber). */
    status: nodeStatusSchema,
    /** Status column text, e.g. `Up 1y`, `Standby`, `Draining`. */
    statusDetail: z.string(),
    /** Horizontal position on the topology grid, 0–100 (% of width). */
    x: z.number().min(0).max(100),
    /** Vertical position on the topology grid, 0–100 (% of height). */
    y: z.number().min(0).max(100),
    /** 2–3 sentence description (inspect description section). */
    description: z.string(),
    /** Tech stack rendered as image-layer badges (inspect "Stack" section). */
    stack: z.array(z.string()),
    /** Key/value spec lines (inspect "Specs" section). */
    specs: z.array(nodeSpecSchema).default([]),
    /** Mounted-volume metrics (inspect "Metrics" section). */
    metrics: z.array(nodeMetricSchema).default([]),
    /** Operational notes — bullet points (inspect "Notes" section). */
    notes: z.array(z.string()).default([]),
    /** Action-footer CTAs (Docs, Console). */
    links: z.array(nodeLinkSchema).default([]),
});
export type InfraNode = z.infer<typeof infraNodeSchema>;

/**
 * A topology edge — a directed relationship between two nodes.
 *
 * Edges render as connecting lines between nodes; the optional `label` is
 * drawn at the midpoint (e.g. `provisions`, `routes`, `builds`). `from`/`to`
 * reference node ids; both endpoints must exist (validated at the data layer).
 */
export const infraEdgeSchema = z.object({
    /** Source node id. */
    from: z.string(),
    /** Target node id. */
    to: z.string(),
    /** Optional relationship label drawn at the edge midpoint. */
    label: z.string().optional(),
});
export type InfraEdge = z.infer<typeof infraEdgeSchema>;

/** Summary stat rendered as a glass pill below the page header. */
export const infraStatSchema = z.object({
    /** Stat key — used to color the value (e.g. `active` → success). */
    key: z.enum(["nodes", "active", "edges", "uptime"]),
    label: z.string(),
    value: z.string(),
});
export type InfraStat = z.infer<typeof infraStatSchema>;
