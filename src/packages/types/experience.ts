import { z } from "zod";

/**
 * Type definitions for the Experience deployment history.
 *
 * Zod schemas are the source of truth; types are inferred. Mirrors the
 * deployment data model defined in experience-page-design.md (§6): each role
 * is a versioned "deployment" with status, image, replicas, uptime, a
 * changelog of achievements, a tech stack, and optional external links.
 */

/** Deployment status — drives the status dot color + pulse. */
export const deploymentStatusSchema = z.enum(["active", "completed"]);
export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>;

/** An external link rendered in the expanded card (company site, projects). */
export const deploymentLinkSchema = z.object({
    label: z.string(),
    url: z.string().url(),
});
export type DeploymentLink = z.infer<typeof deploymentLinkSchema>;

/**
 * A single role represented as a Kubernetes-style deployment.
 * Versioned, statused, and expandable — career as deployment history.
 */
export const deploymentSchema = z.object({
    /** Stable id for React keys + accordion state. */
    id: z.string(),
    /** Semantic version label, e.g. `v3.0`. */
    version: z.string(),
    /** Role title, e.g. `Senior Software Engineer`. */
    role: z.string(),
    /** Company name. */
    company: z.string(),
    /** Company website (optional — powers the expanded "Company ↗" link). */
    companyUrl: z.string().url().optional(),
    /** Start date as `YYYY-MM`. */
    startDate: z.string(),
    /** End date as `YYYY-MM`, or `null` when the role is active. */
    endDate: z.string().nullable(),
    /** Status — `active` (green, pulsing) or `completed` (blue, solid). */
    status: deploymentStatusSchema,
    /** Versioned self-image, e.g. `kandarp:v3.0`. */
    image: z.string(),
    /** Replica count — `1/1` for active, `0/0` for completed. */
    replicas: z.string(),
    /** Human-readable duration in role, e.g. `1y 3m`. */
    uptime: z.string(),
    /** One-line summary of responsibilities (collapsed view). */
    summary: z.string(),
    /** Achievement-focused changelog (expanded view). */
    changelog: z.array(z.string()),
    /** Tech names rendered as glass badges (expanded view). */
    stack: z.array(z.string()),
    /** Optional external links (expanded view). */
    links: z.array(deploymentLinkSchema).default([]),
});
export type Deployment = z.infer<typeof deploymentSchema>;

/** Summary stat rendered as a glass pill below the page header. */
export const deploymentStatSchema = z.object({
    label: z.string(),
    value: z.string(),
});
export type DeploymentStat = z.infer<typeof deploymentStatSchema>;
