import type { Metadata } from "next";

import { InfrastructureTopology } from "@/components/sections/InfrastructureTopology";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatPills } from "@/components/shared/StatPills";
import {
    getPublicInfraEdges,
    getPublicInfraNodes,
    getPublicInfraStats,
} from "@/lib/admin/public-data";
import { getSiteConfig } from "@/hooks/useSiteConfig";
import {
    infrastructureHeading,
    infrastructureIntro,
} from "@/lib/infrastructureSummary";

export async function generateMetadata(): Promise<Metadata> {
    const config = await getSiteConfig();
    return {
        title: "Infrastructure",
        description: `The DevOps stack behind ${config.userAtHost} — an interactive topology of AWS, Docker, Linux, GitHub, Networking, Firewall, NAS, and Python.`,
        openGraph: {
            title: `Infrastructure — ${config.name}`,
            description: `The DevOps stack as an interactive topology — click any node to inspect its role, specs, and metrics.`,
        },
    };
}

/** Value color per infra-stat key. */
const STAT_VALUE_COLOR: Record<string, string> = {
    nodes: "text-text-primary",
    active: "text-success",
    edges: "text-info",
    uptime: "text-text-primary",
};

export default async function InfrastructurePage() {
    const [nodes, edges, stats] = await Promise.all([
        getPublicInfraNodes(),
        getPublicInfraEdges(),
        getPublicInfraStats(),
    ]);

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-16 sm:px-6">
            {/* Page header — eyebrow + title + command subtitle. */}
            <PageHeader
                eyebrow="// INFRASTRUCTURE"
                title="Infrastructure Topology"
                command="node inspect --topology"
                className="mb-8"
            />

            {/* Summary stats — glass pills. */}
            <StatPills
                stats={stats}
                colorByKey={STAT_VALUE_COLOR}
                className="mb-12"
            />

            {/* The interactive topology — the primary content block. */}
            <InfrastructureTopology
                nodes={nodes}
                edges={edges}
                className="w-full"
            />

            {/* Hint — nodes are inspectable. */}
            <p className="mt-10 max-w-3xl font-mono text-xs text-text-tertiary">
                Click a node to run{" "}
                <span className="text-text-secondary">node inspect</span> — its
                role, specs, metrics, and operational notes. Hover to highlight
                its connections.
            </p>

            {/* Screen-reader-only semantic section (a11y + SEO). */}
            <section className="sr-only">
                <h2>{infrastructureHeading()}</h2>
                <p>{infrastructureIntro()}</p>
                <ul>
                    {nodes.map((node) => (
                        <li key={node.id}>
                            <h3>
                                {node.name} — {node.role}
                            </h3>
                            <p>
                                Status: {node.status} ({node.statusDetail}).{" "}
                                {node.description}
                            </p>
                            <p>Stack: {node.stack.join(", ")}.</p>
                            {node.specs.length > 0 && (
                                <p>
                                    Specs:{" "}
                                    {node.specs
                                        .map((s) => `${s.label}: ${s.value}`)
                                        .join(", ")}
                                    .
                                </p>
                            )}
                            {node.metrics.length > 0 && (
                                <p>
                                    Metrics:{" "}
                                    {node.metrics
                                        .map((m) => `${m.label}: ${m.value}`)
                                        .join(", ")}
                                    .
                                </p>
                            )}
                            {node.notes.length > 0 && (
                                <ul>
                                    {node.notes.map((note) => (
                                        <li key={note}>{note}</li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
                <p>
                    Connections:{" "}
                    {edges
                        .map(
                            (edge) =>
                                `${edge.from} → ${edge.to}${edge.label ? ` (${edge.label})` : ""}`,
                        )
                        .join(", ")}
                    .
                </p>
            </section>
        </main>
    );
}
