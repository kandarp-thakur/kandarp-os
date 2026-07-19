import type { Metadata } from "next";

import { ExperienceTimeline } from "@features/experience/components/ExperienceTimeline";
import { PageHeader } from "@features/shared/components/PageHeader";
import { StatPills } from "@features/shared/components/StatPills";
import {
    getPublicDeploymentStats,
    getPublicExperience,
} from "@backend/services/public-data";
import { getSiteConfig } from "@hooks/useSiteConfig";
import { experienceHeading, experienceIntro } from "@/lib/experienceSummary";

export async function generateMetadata(): Promise<Metadata> {
    const config = await getSiteConfig();
    return {
        title: "Experience",
        description: `Deployment history for ${config.userAtHost} — career rendered as versioned, statused, expandable deployments.`,
        openGraph: {
            title: `Experience — ${config.name}`,
            description: `Career as a deployment log for ${config.userAtHost}. Versioned roles, changelogs, and tech stacks.`,
        },
    };
}

export default async function ExperiencePage() {
    const [deployments, stats] = await Promise.all([
        getPublicExperience(),
        getPublicDeploymentStats(),
    ]);

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-16 sm:px-6">
            {/* Page header — eyebrow + title + subtitle (experience-page-design §2). */}
            <PageHeader
                eyebrow="// EXPERIENCE"
                title="Deployment History"
                command="kubectl get deployments"
                className="mb-8"
            />

            {/* Summary stats — glass pills (§2.3). */}
            <StatPills
                stats={stats}
                className="mb-12"
                valueSizeClassName="text-sm"
            />

            {/* The timeline — the primary structure (§3). */}
            <ExperienceTimeline deployments={deployments} className="w-full" />

            {/* Hint — cards are expandable. */}
            <p className="mt-10 max-w-3xl font-mono text-xs text-text-tertiary">
                Click a deployment to expand its changelog, stack, and links.
                Only one expands at a time.
            </p>

            {/* Screen-reader-only semantic section (a11y + SEO, §11). */}
            <section className="sr-only">
                <h2>{experienceHeading()}</h2>
                <p>{experienceIntro()}</p>
                <ol>
                    {deployments.map((deployment) => (
                        <li key={deployment.id}>
                            <h3>
                                {deployment.version} — {deployment.role} at{" "}
                                {deployment.company}
                            </h3>
                            <p>
                                Status: {deployment.status}.{" "}
                                {deployment.summary}. Uptime:{" "}
                                {deployment.uptime}.
                            </p>
                            <ul>
                                {deployment.changelog.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                            <p>Stack: {deployment.stack.join(", ")}.</p>
                        </li>
                    ))}
                </ol>
            </section>
        </main>
    );
}
