import { SITE } from "@/utils/constants";
import type { InfraNode } from "@/types/infrastructure";

/**
 * Infrastructure summary helpers.
 *
 * Pure formatting utilities kept in the lib layer so the page + components
 * stay thin. Mirrors the experienceSummary.ts / projectsSummary.ts pattern: a
 * heading helper for the sr-only semantic section + a manifest-JSON builder
 * for the inspect panel's `node inspect` identity card.
 */

/** The page heading — used by the visual header + the sr-only section. */
export function infrastructureHeading(): string {
    return "Infrastructure Topology";
}

/** The sr-only intro line for the infrastructure semantic section. */
export function infrastructureIntro(): string {
    return `${SITE.owner}'s DevOps stack rendered as an interactive topology — eight technology-family nodes connected by their real relationships, each inspectable.`;
}

/**
 * Build the `node inspect`-style manifest JSON for a topology node.
 *
 * Returns a pretty-printed JSON snippet with the node's identity fields.
 * Used by the inspect panel's manifest block + the CopyButton's raw payload.
 */
export function buildNodeManifestJson(node: InfraNode): string {
    const manifest = {
        Name: node.id,
        Role: node.role,
        Status: node.status,
        Icon: node.icon,
        Position: `${node.x}, ${node.y}`,
    };
    return JSON.stringify(manifest, null, 2);
}
