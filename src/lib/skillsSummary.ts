import { SITE } from "@/utils/constants";
import type { SkillNode } from "@/types/skills";

/**
 * Skills summary helpers.
 *
 * Pure formatting utilities kept in the lib layer so the page + components
 * stay thin. Mirrors the infrastructureSummary.ts / experienceSummary.ts
 * pattern: a heading helper for the sr-only semantic section + a connection
 * list builder for the detail panel.
 */

/** The page heading — used by the visual header + the sr-only section. */
export function skillsHeading(): string {
    return "Service Mesh";
}

/** The sr-only intro line for the skills semantic section. */
export function skillsIntro(): string {
    return `${SITE.owner}'s skills rendered as a service mesh — ${SITE.userAtHost} capabilities as a connected topology of nodes and edges, each inspectable.`;
}

/**
 * Resolve a node's neighbor objects from its `connections` ids.
 *
 * Returns the full `SkillNode` records (not just ids) so the detail panel can
 * render neighbor names without a second lookup. Order follows the node's
 * `connections` array; missing ids are skipped (the data layer guards against
 * these, but this stays defensive).
 */
export function resolveConnections(
    node: SkillNode,
    byId: Map<string, SkillNode>,
): SkillNode[] {
    return node.connections
        .map((id) => byId.get(id))
        .filter((n): n is SkillNode => n !== undefined);
}

/**
 * Build the `istioctl proxy-status`-style manifest JSON for a skill node.
 *
 * Returns a pretty-printed JSON snippet with the node's identity fields — the
 * same shape the rest of the OS uses for `inspect` panels.
 */
export function buildSkillManifestJson(node: SkillNode): string {
    const manifest = {
        Name: node.id,
        Domain: node.domain,
        Status: node.status,
        Connections: node.connections,
        Position: `${node.x}, ${node.y}`,
    };
    return JSON.stringify(manifest, null, 2);
}
