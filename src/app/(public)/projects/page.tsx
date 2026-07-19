import type { Metadata } from "next";

import { ContainerFleet } from "@features/projects/components/ContainerFleet";
import { PageHeader } from "@features/shared/components/PageHeader";
import { StatPills } from "@features/shared/components/StatPills";
import {
    getPublicFleetStats,
    getPublicProjects,
} from "@backend/services/public-data";
import { getSiteConfig } from "@hooks/useSiteConfig";
import { projectsHeading, projectsIntro } from "@/lib/projectsSummary";

export async function generateMetadata(): Promise<Metadata> {
    const config = await getSiteConfig();
    return {
        title: "Projects",
        description: `Container fleet of projects by ${config.owner} — running, archived, and in-progress builds.`,
        openGraph: {
            title: `Projects — ${config.name}`,
            description: `A fleet of running containers — full-stack apps, DevOps tools, and 3D experiences.`,
        },
    };
}

/** Value color per fleet-stat key (§2.3). */
const STAT_VALUE_COLOR: Record<string, string> = {
    total: "text-text-primary",
    running: "text-success",
    exited: "text-text-tertiary",
    created: "text-warning",
};

export default async function ProjectsPage() {
    const [containers, stats] = await Promise.all([
        getPublicProjects(),
        getPublicFleetStats(),
    ]);

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-16 sm:px-6">
            {/* Page header — eyebrow + title + command subtitle (§2). */}
            <PageHeader
                eyebrow="// PROJECTS"
                title="Running Containers"
                command="docker ps"
                className="mb-8"
            />

            {/* Fleet stats — glass pills (§2.3). */}
            <StatPills
                stats={stats}
                colorByKey={STAT_VALUE_COLOR}
                className="mb-12"
            />

            {/* The container fleet — the primary content block (§3–§6). */}
            <ContainerFleet containers={containers} className="w-full" />

            {/* Hint — rows are inspectable. */}
            <p className="mt-10 max-w-3xl font-mono text-xs text-text-tertiary">
                Click a container to run{" "}
                <span className="text-text-secondary">docker inspect</span> —
                its full manifest, stack, ports, and commit log.
            </p>

            {/* Screen-reader-only semantic section (a11y + SEO, §11.1). */}
            <section className="sr-only">
                <h2>{projectsHeading()}</h2>
                <p>{projectsIntro()}</p>
                <ul>
                    {containers.map((container) => (
                        <li key={container.id}>
                            <h3>{container.name}</h3>
                            <p>
                                Status: {container.status} (
                                {container.statusDetail}).{" "}
                                {container.longDescription}
                            </p>
                            <p>Image: {container.image}.</p>
                            <p>Created: {container.created}.</p>
                            <p>Stack: {container.stack.join(", ")}.</p>
                            {container.ports.length > 0 && (
                                <p>
                                    Links:{" "}
                                    {container.ports
                                        .map(
                                            (port) =>
                                                `${port.port} (${port.label} at ${port.url})`,
                                        )
                                        .join(", ")}
                                    .
                                </p>
                            )}
                            {container.metrics.length > 0 && (
                                <p>
                                    Metrics:{" "}
                                    {container.metrics
                                        .map((m) => `${m.label}: ${m.value}`)
                                        .join(", ")}
                                    .
                                </p>
                            )}
                            {container.changelog.length > 0 && (
                                <ul>
                                    {container.changelog.map((entry) => (
                                        <li key={entry.version}>
                                            {entry.version} — {entry.text}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}
