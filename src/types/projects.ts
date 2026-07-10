import { z } from "zod";

/**
 * Type definitions for the Projects container fleet.
 *
 * Zod schemas are the source of truth; types are inferred. Mirrors the
 * container data model defined in projects-page-design.md (§7): each project
 * is a "running container" with status, image, ports, stack (image layers),
 * metrics (volumes), and a versioned changelog (commit log). Clicking a
 * container runs `docker inspect` — a manifest-style detail panel.
 */

/** Container status — drives the status dot color + pulse (§4.6). */
export const containerStatusSchema = z.enum(["running", "exited", "created"]);
export type ContainerStatus = z.infer<typeof containerStatusSchema>;

/** An exposed port — maps a `:PORT` or label to an external endpoint (§4.8). */
export const containerPortSchema = z.object({
    /** Port or label, e.g. `:3000`, `repo`, `docs`. */
    port: z.string(),
    /** Human-readable destination, e.g. `Live demo`, `GitHub`. */
    label: z.string(),
    /** The external URL the port maps to. */
    url: z.string().url(),
});
export type ContainerPort = z.infer<typeof containerPortSchema>;

/** A mounted volume — a project metric rendered as a stat (§6.6). */
export const containerMetricSchema = z.object({
    /** Metric label, e.g. `Stars`, `Commits`. */
    label: z.string(),
    /** Metric value (string to allow `1.2k` formatting). */
    value: z.string(),
});
export type ContainerMetric = z.infer<typeof containerMetricSchema>;

/** A commit-log entry — a versioned, achievement-focused changelog item (§6.6). */
export const containerChangelogSchema = z.object({
    /** Semantic version, e.g. `v1.4`. */
    version: z.string(),
    /** What shipped in that release. */
    text: z.string(),
});
export type ContainerChangelog = z.infer<typeof containerChangelogSchema>;

/** An action-footer link — primary/secondary CTA in the inspect panel (§6.6). */
export const containerLinkSchema = z.object({
    label: z.string(),
    url: z.string().url(),
    /** `primary` = gradient button; `secondary` = glass button. */
    variant: z.enum(["primary", "secondary"]).default("secondary"),
});
export type ContainerLink = z.infer<typeof containerLinkSchema>;

/**
 * A single project represented as a Docker container.
 * Statused, ported, and inspectable — projects as a running fleet.
 */
export const containerSchema = z.object({
    /** Stable id / slug — the container name, e.g. `kandarp-os`. */
    id: z.string(),
    /** Display name, e.g. `Kandarp OS`. */
    name: z.string(),
    /** Status — `running` (green, pulsing), `exited` (gray), `created` (amber). */
    status: containerStatusSchema,
    /** Status column text, e.g. `Up 2y`, `Exited (0)`, `Created`. */
    statusDetail: z.string(),
    /** Versioned image, e.g. `kandarp-os:latest`. */
    image: z.string(),
    /** Creation date as ISO `YYYY-MM-DD`. */
    created: z.string(),
    /** One-line summary (collapsed row description column). */
    description: z.string(),
    /** 2–3 sentence deep description (inspect description section). */
    longDescription: z.string(),
    /** Tech stack rendered as image-layer badges. */
    stack: z.array(z.string()),
    /** Exposed endpoints (ports). */
    ports: z.array(containerPortSchema).default([]),
    /** Project metrics rendered as mounted volumes. */
    metrics: z.array(containerMetricSchema).default([]),
    /** Versioned, achievement-focused commit log. */
    changelog: z.array(containerChangelogSchema).default([]),
    /** Action-footer CTAs (Open Live, View Source). */
    links: z.array(containerLinkSchema).default([]),
    /** Exit code for exited containers; `null` otherwise. */
    exitCode: z.number().nullable().default(null),
});
export type Container = z.infer<typeof containerSchema>;

/** Fleet summary stat rendered as a glass pill below the page header (§2.3). */
export const fleetStatSchema = z.object({
    /** Stat key — used to color the value (e.g. `running` → success). */
    key: z.enum(["total", "running", "exited", "created"]),
    label: z.string(),
    value: z.string(),
});
export type FleetStat = z.infer<typeof fleetStatSchema>;
