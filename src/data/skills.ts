import {
    skillEdgeSchema,
    skillNodeSchema,
    skillStatSchema,
    type SkillEdge,
    type SkillNode,
    type SkillStat,
} from "@/types/skills";

/**
 * Skills topology data — the service mesh.
 *
 * The skill set rendered as an **interactive topology graph** — skill nodes
 * across five domains (devops, backend, data, frontend, design), positioned on
 * a 0–100 grid and connected by derived edges. Hovering a node illuminates its
 * connected subgraph; the rest of the mesh dims.
 *
 * Domains are mapped to Kandarp's real skill groups:
 *  - devops    → DevOps & Cloud (AWS, Docker, CI/CD, Virtual Environments)
 *  - backend   → Programming & Scripting (Python, Bash)
 *  - data      → Networking & Security (Pentesting, Scanning, Firewall)
 *  - frontend  → Web Development (Django, WebSockets)
 *  - design    → System Administration (Self-hosting, NAS, Open-Source Tools)
 *
 * Nodes are clustered by domain and positioned for a balanced, readable graph
 * with no overlaps. Edges are **derived** from each node's `connections` array
 * — the relationship is symmetric, so an edge exists between A and B if either
 * lists the other.
 *
 * Proficiency is a status, not a percentage: `active` (daily driver),
 * `idle` (deployed, not in heavy rotation), `learning` (provisioning). Kept in
 * the data layer so the page + components stay thin. Mirrors the
 * infrastructure/experience data pattern.
 */

const rawNodes = [
    // ── DevOps & Cloud cluster (center) ───────────────────────────────────
    {
        id: "aws",
        name: "AWS (EC2)",
        abbr: "AWS",
        domain: "devops" as const,
        status: "active" as const,
        tagline: "Cloud compute — EC2 instances and managed services",
        x: 50,
        y: 50,
        connections: ["docker", "github", "linux", "python"],
    },
    {
        id: "docker",
        name: "Docker",
        abbr: "Dk",
        domain: "devops" as const,
        status: "active" as const,
        tagline: "Containerized self-hosting and service isolation",
        x: 38,
        y: 38,
        connections: ["aws", "casaos", "linux", "github"],
    },
    {
        id: "github",
        name: "GitHub Actions",
        abbr: "CI/CD",
        domain: "devops" as const,
        status: "active" as const,
        tagline: "CI/CD pipelines from commit to deploy",
        x: 62,
        y: 38,
        connections: ["aws", "docker", "python", "linux"],
    },
    {
        id: "virtualenv",
        name: "Virtual Environments",
        abbr: "VM",
        domain: "devops" as const,
        status: "active" as const,
        tagline: "Managed VMs for hosting open-source applications",
        x: 44,
        y: 62,
        connections: ["docker", "linux", "casaos"],
    },

    // ── Programming & Scripting cluster (top-right) ─────────────────────────
    {
        id: "python",
        name: "Python",
        abbr: "Py",
        domain: "backend" as const,
        status: "active" as const,
        tagline: "Automation, scripting, and security tooling",
        x: 78,
        y: 18,
        connections: ["scapy", "django", "bash", "aws", "github"],
    },
    {
        id: "bash",
        name: "Bash",
        abbr: "Sh",
        domain: "backend" as const,
        status: "active" as const,
        tagline: "Shell scripting for system automation",
        x: 88,
        y: 34,
        connections: ["python", "linux"],
    },
    {
        id: "scapy",
        name: "Scapy",
        abbr: "Sc",
        domain: "backend" as const,
        status: "active" as const,
        tagline: "Packet crafting + Wi-Fi analysis framework",
        x: 90,
        y: 14,
        connections: ["python", "pentest"],
    },

    // ── Networking & Security cluster (bottom-right) ───────────────────────
    {
        id: "pentest",
        name: "Wireless Pentesting",
        abbr: "Pn",
        domain: "data" as const,
        status: "active" as const,
        tagline: "Wi-Fi vulnerability detection + de-auth attacks",
        x: 82,
        y: 58,
        connections: ["scapy", "scanning", "firewall"],
    },
    {
        id: "scanning",
        name: "Network Scanning",
        abbr: "Ns",
        domain: "data" as const,
        status: "active" as const,
        tagline: "Automated discovery and asset mapping",
        x: 90,
        y: 74,
        connections: ["pentest", "firewall", "vlan"],
    },
    {
        id: "firewall",
        name: "Firewall Management",
        abbr: "Fw",
        domain: "data" as const,
        status: "active" as const,
        tagline: "Hardened perimeter + segmentation rules",
        x: 76,
        y: 86,
        connections: ["scanning", "vlan", "linux"],
    },
    {
        id: "vlan",
        name: "VLAN Networking",
        abbr: "VL",
        domain: "data" as const,
        status: "active" as const,
        tagline: "Network segmentation for isolation",
        x: 88,
        y: 92,
        connections: ["scanning", "firewall"],
    },

    // ── Web Development cluster (top-left) ─────────────────────────────────
    {
        id: "django",
        name: "Django",
        abbr: "Dj",
        domain: "frontend" as const,
        status: "active" as const,
        tagline: "Web framework for the encrypted chat platform",
        x: 18,
        y: 20,
        connections: ["python", "websockets"],
    },
    {
        id: "websockets",
        name: "WebSockets",
        abbr: "WS",
        domain: "frontend" as const,
        status: "active" as const,
        tagline: "Real-time encrypted communication layer",
        x: 30,
        y: 36,
        connections: ["django", "python"],
    },
    {
        id: "git",
        name: "Git",
        abbr: "Git",
        domain: "frontend" as const,
        status: "active" as const,
        tagline: "Version control across every project",
        x: 10,
        y: 38,
        connections: ["github", "django"],
    },

    // ── System Administration cluster (bottom-left) ────────────────────────
    {
        id: "linux",
        name: "Linux",
        abbr: "Lx",
        domain: "design" as const,
        status: "active" as const,
        tagline: "The kernel everything stands on",
        x: 22,
        y: 62,
        connections: ["docker", "aws", "bash", "firewall", "truenas"],
    },
    {
        id: "casaos",
        name: "CasaOS",
        abbr: "Cs",
        domain: "design" as const,
        status: "active" as const,
        tagline: "Self-hosted application dashboard",
        x: 12,
        y: 78,
        connections: ["docker", "virtualenv", "truenas"],
    },
    {
        id: "truenas",
        name: "TrueNAS",
        abbr: "TN",
        domain: "design" as const,
        status: "active" as const,
        tagline: "Enterprise NAS — ZFS storage + snapshots",
        x: 30,
        y: 88,
        connections: ["casaos", "linux", "vlan"],
    },
    {
        id: "opensource",
        name: "Open-Source Tools",
        abbr: "OS",
        domain: "design" as const,
        status: "active" as const,
        tagline: "Self-hosting open-source applications",
        x: 16,
        y: 92,
        connections: ["casaos", "truenas", "docker"],
    },
];

/**
 * Validated nodes. Parsing guarantees shape at runtime; a malformed entry
 * fails fast in dev rather than rendering a broken mesh.
 */
export const SKILL_NODES: SkillNode[] = rawNodes.map((n) =>
    skillNodeSchema.parse(n),
);

/**
 * Derive edges from node `connections` arrays.
 *
 * The relationship is symmetric — an edge exists between A and B if either
 * lists the other. Each unordered pair is emitted once (canonical key
 * `min|max`), so the graph has no duplicate lines.
 */
export function deriveEdges(nodes: SkillNode[]): SkillEdge[] {
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

export const SKILL_EDGES: SkillEdge[] = deriveEdges(SKILL_NODES);

// Guard: every connection must reference a defined node. Runs at module load
// so a broken reference fails in dev rather than rendering a line to nothing.
const skillNodeIds = new Set(SKILL_NODES.map((n) => n.id));
for (const node of SKILL_NODES) {
    for (const targetId of node.connections) {
        if (!skillNodeIds.has(targetId)) {
            throw new Error(
                `Skill node "${node.id}" references unknown connection: ${targetId}`,
            );
        }
    }
}
for (const edge of SKILL_EDGES) {
    if (!skillNodeIds.has(edge.from) || !skillNodeIds.has(edge.to)) {
        throw new Error(
            `Skill edge references unknown node: ${edge.from} → ${edge.to}`,
        );
    }
}

/**
 * Derive summary stats from the node set — the mesh's control-plane summary.
 * Counts are computed, not hardcoded, so they stay in sync with the data.
 */
export function deriveStats(nodes: SkillNode[]): SkillStat[] {
    const counts = { active: 0, idle: 0, learning: 0 };
    for (const node of nodes) counts[node.status] += 1;
    return [
        { key: "nodes", label: "Nodes", value: String(nodes.length) },
        { key: "active", label: "Active", value: String(counts.active) },
        { key: "idle", label: "Idle", value: String(counts.idle) },
        { key: "learning", label: "Learning", value: String(counts.learning) },
    ].map((s) => skillStatSchema.parse(s));
}

export const SKILL_STATS: SkillStat[] = deriveStats(SKILL_NODES);
