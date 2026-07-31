import type { SkillEdge, SkillNode } from "@packages/types/skills";
import { skillEdgeSchema } from "@packages/types/skills";

/**
 * Derive symmetric graph edges from persisted skill nodes. Each unordered pair
 * is emitted once, so CMS-managed connections render without duplicates.
 */
export function deriveSkillEdges(nodes: SkillNode[]): SkillEdge[] {
    const seen = new Set<string>();
    const edges: SkillEdge[] = [];

    for (const node of nodes) {
        for (const targetId of node.connections) {
            const key = [node.id, targetId].sort().join("→");
            if (seen.has(key)) continue;
            seen.add(key);
            edges.push(skillEdgeSchema.parse({ from: node.id, to: targetId }));
        }
    }

    return edges;
}
