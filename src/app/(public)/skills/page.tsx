import type { Metadata } from "next";

import { SkillsMesh } from "@features/skills/components/SkillsMesh";
import { PageHeader } from "@features/shared/components/PageHeader";
import { StatPills } from "@features/shared/components/StatPills";
import { deriveEdges } from "@/data/skills";
import {
    getPublicSkillStats,
    getPublicSkills,
} from "@backend/services/public-data";
import { getSiteConfig } from "@hooks/useSiteConfig";
import { skillsHeading, skillsIntro } from "@/lib/skillsSummary";

export async function generateMetadata(): Promise<Metadata> {
    const config = await getSiteConfig();
    return {
        title: "Skills",
        description: `Service mesh of skills by ${config.owner} — frontend, backend, DevOps, data, and design capabilities as a connected topology.`,
        openGraph: {
            title: `Skills by ${config.name}`,
            description:
                "A service mesh of capabilities — every skill a node, every relationship an edge.",
        },
    };
}

/** Value color per skill-stat key (skills-page-design §2.3). */
const STAT_VALUE_COLOR: Record<string, string> = {
    nodes: "text-text-primary",
    active: "text-success",
    idle: "text-text-tertiary",
    learning: "text-warning",
};

export default async function SkillsPage() {
    const [nodes, stats] = await Promise.all([
        getPublicSkills(),
        getPublicSkillStats(),
    ]);
    const edges = deriveEdges(nodes);

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-16 sm:px-6">
            {/* Page header — eyebrow + title + command subtitle (§2). */}
            <PageHeader
                eyebrow="// SKILLS"
                title="Service Mesh"
                command="istioctl proxy-status"
                className="mb-8"
            />

            {/* Summary stats — glass pills (§2.3). */}
            <StatPills
                stats={stats}
                colorByKey={STAT_VALUE_COLOR}
                className="mb-6"
            />

            {/* The interactive mesh — the primary content block (§3). */}
            <SkillsMesh nodes={nodes} edges={edges} className="w-full" />

            {/* Hint — nodes are inspectable. */}
            <p className="mt-10 max-w-3xl font-mono text-xs text-text-tertiary">
                Hover a node to trace its connections — the way a service-mesh
                dashboard highlights the dependencies of a service. The mesh is
                one connected graph; every node has edges.
            </p>

            {/* Screen-reader-only semantic section (a11y + SEO, §12.1). */}
            <section className="sr-only">
                <h2>{skillsHeading()}</h2>
                <p>{skillsIntro()}</p>
                <ul>
                    {nodes.map((node) => (
                        <li key={node.id}>
                            <h3>
                                {node.name} — {node.domain}
                            </h3>
                            <p>
                                Status: {node.status}. {node.tagline}.
                            </p>
                            <p>
                                Connected to:{" "}
                                {node.connections
                                    .map(
                                        (id) =>
                                            nodes.find((n) => n.id === id)
                                                ?.name ?? id,
                                    )
                                    .join(", ")}
                                .
                            </p>
                        </li>
                    ))}
                </ul>
                <p>
                    Edges:{" "}
                    {edges
                        .map((edge) => `${edge.from} — ${edge.to}`)
                        .join(", ")}
                    .
                </p>
            </section>
        </main>
    );
}
