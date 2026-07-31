import { Fragment } from "react";

import { HeroSection } from "@features/hero/components/HeroSection";
import { AboutTerminal } from "@features/about/components/AboutTerminal";
import { AchievementsGrid } from "@features/about/components/AchievementsGrid";
import { ExperienceTimeline } from "@features/experience/components/ExperienceTimeline";
import { ContainerFleet } from "@features/projects/components/ContainerFleet";
import { InfrastructureTopology } from "@features/infrastructure/components/InfrastructureTopology";
import { SkillsMesh } from "@features/skills/components/SkillsMesh";
import { ContactTerminal } from "@features/contact/components/ContactTerminal";
import { ConnectLinks } from "@features/contact/components/ConnectLinks";
import { JournalStream } from "@features/blog/components/JournalStream";
import { PageHeader } from "@features/shared/components/PageHeader";
import { StatPills } from "@features/shared/components/StatPills";
import { SectionErrorBoundary } from "@features/shared/components/SectionErrorBoundary";
import { Section } from "@features/layout/components/Section";
import { Container } from "@features/layout/components/Container";
import { deriveSkillEdges } from "@/lib/skill-graph";
import {
    getPublicBlogPostMetas,
    getPublicBlogWordCount,
    getPublicExperience,
    getPublicInfraEdges,
    getPublicInfraNodes,
    getPublicProjects,
    getPublicSkills,
    getPublicAwards,
} from "@backend/services/public-data";
import { getSiteConfig } from "@hooks/useSiteConfig";
import { resolveContactLinks } from "@/lib/contactLinks";
import { SECTIONS } from "@utils/constants";
import { ACHIEVEMENT_STATS } from "@/data/achievements";
import type { BlogUnit } from "@packages/types/blog";

/** Value color per fleet-stat key. */
const FLEET_STAT_COLOR: Record<string, string> = {
    total: "text-text-primary",
    running: "text-success",
    exited: "text-text-tertiary",
    created: "text-warning",
};

/** Value color per infra-stat key. */
const INFRA_STAT_COLOR: Record<string, string> = {
    nodes: "text-text-primary",
    active: "text-success",
    edges: "text-info",
    uptime: "text-text-primary",
};

/** Value color per skill-stat key. */
const SKILL_STAT_COLOR: Record<string, string> = {
    nodes: "text-text-primary",
    active: "text-success",
    idle: "text-text-tertiary",
    learning: "text-warning",
};

/** Value color per journal-stat key. */
const JOURNAL_STAT_COLOR: Record<string, string> = {
    entries: "text-text-primary",
    units: "text-accent-solid",
    tags: "text-info",
    words: "text-success",
};

/**
 * Canonical homepage order. These sections are always rendered so every
 * primary navigation target remains present and the document order cannot
 * drift away from the navbar order because of CMS configuration.
 */
const SECTION_ORDER = [
    "hero",
    "about",
    "experience",
    "projects",
    "skills",
    "infrastructure",
    "achievements",
    "blog",
    "contact",
] as const;

/**
 * Kandarp OS — the single-page engineering experience.
 *
 * One continuous scroll through the engineering journey. Every section is a
 * reusable component with a stable `id` anchor so the navbar can smooth-scroll
 * + scroll-spy to it. No separate portfolio pages — the visitor explores one
 * premium engineering operating system.
 *
 * All data is CMS-driven: entity lists (experience, projects, infra, skills,
 * awards, blog) and derived stats come from the admin store via the public-data
 * layer, with fallback to the hardcoded `src/data/*.ts` if the store is empty.
 * The section sequence is intentionally fixed to match primary navigation.
 */
export default async function HomePage() {
    const [
        posts,
        deployments,
        containers,
        infraNodes,
        infraEdges,
        skillNodes,
        achievements,
        config,
        blogWordCount,
    ] = await Promise.all([
        getPublicBlogPostMetas(),
        getPublicExperience(),
        getPublicProjects(),
        getPublicInfraNodes(),
        getPublicInfraEdges(),
        getPublicSkills(),
        getPublicAwards(),
        getSiteConfig(),
        getPublicBlogWordCount(),
    ]);

    // Derive all section stats from the collections already loaded for this
    // page. This preserves the rendered values while avoiding duplicate cache
    // lookups and repeated collection transformations during the request.
    const activeDeployments = deployments.filter(
        (deployment) => deployment.status === "active",
    ).length;
    const deploymentStats = [
        { label: "Deployments", value: String(deployments.length) },
        { label: "Uptime", value: deployments[0]?.uptime ?? "—" },
        { label: "Current", value: `${activeDeployments} active` },
        {
            label: "Focus",
            value: deployments[0]?.stack?.[0] ?? "Cloud + Security",
        },
    ];

    const fleetStats = [
        { key: "total", label: "Containers", value: String(containers.length) },
        {
            key: "running",
            label: "Running",
            value: String(
                containers.filter((container) => container.status === "running")
                    .length,
            ),
        },
        {
            key: "exited",
            label: "Exited",
            value: String(
                containers.filter((container) => container.status === "exited")
                    .length,
            ),
        },
        {
            key: "created",
            label: "Created",
            value: String(
                containers.filter((container) => container.status === "created")
                    .length,
            ),
        },
    ];

    const activeInfraNodes = infraNodes.filter(
        (node) => node.status === "active",
    ).length;
    const infraStats = [
        { key: "nodes", label: "Nodes", value: String(infraNodes.length) },
        { key: "active", label: "Active", value: String(activeInfraNodes) },
        { key: "edges", label: "Links", value: String(infraEdges.length) },
        { key: "uptime", label: "Uptime", value: "—" },
    ];

    const skillStats = [
        { key: "nodes", label: "Nodes", value: String(skillNodes.length) },
        {
            key: "active",
            label: "Active",
            value: String(
                skillNodes.filter((node) => node.status === "active").length,
            ),
        },
        {
            key: "idle",
            label: "Idle",
            value: String(
                skillNodes.filter((node) => node.status === "idle").length,
            ),
        },
        {
            key: "learning",
            label: "Learning",
            value: String(
                skillNodes.filter((node) => node.status === "learning").length,
            ),
        },
    ];

    const blogUnits = posts.reduce<Map<string, number>>((counts, post) => {
        counts.set(post.unit, (counts.get(post.unit) ?? 0) + 1);
        return counts;
    }, new Map());
    const units = [...blogUnits.entries()]
        .map(([unit, count]) => ({ unit, count }))
        .sort((a, b) => b.count - a.count);
    const blogTags = posts.reduce<Map<string, number>>((counts, post) => {
        for (const tag of post.tags) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
        return counts;
    }, new Map());
    const tags = [...blogTags.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

    const skillEdges = deriveSkillEdges(skillNodes);

    const unitsForDisplay = units.map(({ unit, count }) => ({
        unit: unit as BlogUnit,
        count,
    }));
    const tagsForDisplay = tags.map(({ tag, count }) => ({ tag, count }));

    // Reuse metadata-derived units and tags; only word count needs full bodies.
    const resolvedJournalStats = [
        { key: "entries", label: "Entries", value: String(posts.length) },
        { key: "units", label: "Units", value: String(units.length) },
        { key: "tags", label: "Tags", value: String(tags.length) },
        {
            key: "words",
            label: "Words",
            value:
                blogWordCount >= 1_000_000
                    ? `${(blogWordCount / 1_000_000).toFixed(1)}M`
                    : blogWordCount >= 1_000
                      ? `${(blogWordCount / 1_000).toFixed(0)}k`
                      : String(blogWordCount),
        },
    ];

    const contactLinks = resolveContactLinks(config);

    // Build a lookup so we can render each section by type.
    const sectionMap: Record<string, React.ReactNode> = {
        hero: (
            <Section
                id={SECTIONS.hero}
                spacing="none"
                aria-label="Hero"
                className="scroll-mt-20"
            >
                <Container maxWidth="full" className="px-0">
                    <HeroSection
                        hero={config.hero}
                        userAtHost={config.userAtHost}
                    />
                </Container>
            </Section>
        ),
        about: (
            <Section
                id={SECTIONS.whoami}
                spacing="comfortable"
                aria-label="whoami"
                className="scroll-mt-24"
            >
                <Container maxWidth="wide">
                    <PageHeader
                        eyebrow="// WHOAMI"
                        title="System Information"
                        command="whoami && neofetch"
                        className="mb-10"
                    />
                    {/* One premium developer terminal — wide and short, centered.
                        The terminal IS the content: a single continuous session
                        with its own internal scrollbar. No companion column,
                        no cards, no widgets — just a real coding terminal. */}
                    <div className="mx-auto w-full max-w-5xl">
                        <AboutTerminal />
                    </div>
                </Container>
            </Section>
        ),
        experience: (
            <Section
                id={SECTIONS.deployments}
                spacing="comfortable"
                aria-label="Deployment history"
                className="scroll-mt-24"
            >
                <Container maxWidth="wide">
                    <PageHeader
                        eyebrow="// DEPLOYMENT HISTORY"
                        title="Deployment History"
                        command="kubectl get deployments"
                        className="mb-8"
                    />
                    <StatPills
                        stats={deploymentStats}
                        className="mb-12"
                        valueSizeClassName="text-sm"
                    />
                    <ExperienceTimeline
                        deployments={deployments}
                        className="w-full"
                    />
                </Container>
            </Section>
        ),
        projects: (
            <Section
                id={SECTIONS.containers}
                spacing="comfortable"
                aria-label="Running containers"
                className="scroll-mt-24"
            >
                <Container maxWidth="wide">
                    <PageHeader
                        eyebrow="// PROJECTS"
                        title="Running Containers"
                        command="docker ps"
                        className="mb-8"
                    />
                    <StatPills
                        stats={fleetStats}
                        colorByKey={FLEET_STAT_COLOR}
                        className="mb-12"
                    />
                    <ContainerFleet
                        containers={containers}
                        className="w-full"
                    />
                </Container>
            </Section>
        ),
        infrastructure: (
            <Section
                id={SECTIONS.infrastructure}
                spacing="comfortable"
                aria-label="Infrastructure map"
                className="scroll-mt-24"
            >
                <Container maxWidth="wide">
                    <PageHeader
                        eyebrow="// INFRASTRUCTURE MAP"
                        title="Infrastructure Topology"
                        command="node inspect --topology"
                        className="mb-8"
                    />
                    <StatPills
                        stats={infraStats}
                        colorByKey={INFRA_STAT_COLOR}
                        className="mb-12"
                    />
                    <InfrastructureTopology
                        nodes={infraNodes}
                        edges={infraEdges}
                        className="w-full"
                    />
                </Container>
            </Section>
        ),
        skills: (
            <Section
                id={SECTIONS.toolkit}
                spacing="comfortable"
                aria-label="Engineering toolkit"
                className="scroll-mt-24"
            >
                <Container maxWidth="wide">
                    <PageHeader
                        eyebrow="// ENGINEERING TOOLKIT"
                        title="Service Mesh"
                        command="istioctl proxy-status"
                        className="mb-8"
                    />
                    <StatPills
                        stats={skillStats}
                        colorByKey={SKILL_STAT_COLOR}
                        className="mb-6"
                    />
                    <SkillsMesh
                        nodes={skillNodes}
                        edges={skillEdges}
                        className="w-full"
                    />
                </Container>
            </Section>
        ),
        achievements: (
            <Section
                id={SECTIONS.achievements}
                spacing="comfortable"
                aria-label="Achievements"
                className="scroll-mt-24"
            >
                <Container maxWidth="wide">
                    <PageHeader
                        eyebrow="// ACHIEVEMENTS"
                        title="Achievements"
                        command="achievementctl list --unlocked"
                        className="mb-8"
                    />
                    <StatPills
                        stats={[...ACHIEVEMENT_STATS]}
                        className="mb-12"
                    />
                    <AchievementsGrid achievements={achievements} />
                </Container>
            </Section>
        ),
        blog: (
            <Section
                id={SECTIONS.logs}
                spacing="comfortable"
                aria-label="Engineering logs"
                className="scroll-mt-24"
            >
                <Container maxWidth="wide">
                    <PageHeader
                        eyebrow="// ENGINEERING LOGS"
                        title="Engineering Journal"
                        command="journalctl --reverse"
                        className="mb-8"
                    />
                    <StatPills
                        stats={resolvedJournalStats}
                        colorByKey={JOURNAL_STAT_COLOR}
                        className="mb-6"
                    />
                    <JournalStream
                        posts={posts}
                        units={unitsForDisplay}
                        tags={tagsForDisplay}
                        className="w-full"
                    />
                </Container>
            </Section>
        ),
        contact: (
            <Section
                id={SECTIONS.ssh}
                spacing="comfortable"
                aria-label="SSH access"
                className="scroll-mt-24"
            >
                <Container maxWidth="wide">
                    <PageHeader
                        eyebrow="// SSH ACCESS"
                        title="Open a session"
                        command={`ssh ${config.userAtHost}`}
                        className="mb-10"
                    />
                    <ContactTerminal socials={contactLinks} />

                    {/* Visible, clickable connect channels — a single-click
                        companion to the terminal for visitors who don't know
                        to type `github`, `email`, etc. */}
                    <ConnectLinks socials={contactLinks} className="mt-8" />
                </Container>
            </Section>
        ),
    };

    return (
        <main className="relative isolate z-20">
            {/* Render every section in the canonical navigation order.

                NOTE: The BootScreen overlay is intentionally NOT rendered here.
                It used to live as the first child of <main>, but its
                `next/dynamic({ ssr: false })` wrapper (BootScreenClient) forced
                the ENTIRE page route segment to bail out to client-side
                rendering — discarding the server-rendered section HTML and
                leaving the page blank when client hydration stalled. The
                overlay is now mounted once in the root layout (layout.tsx) as a
                fixed-position sibling of AppShell, where it cannot affect the
                page's render strategy. It is `position: fixed`, so placement in
                the tree does not change its visual behavior. */}
            {SECTION_ORDER.map((type) => (
                <Fragment key={type}>
                    {/* Per-section error boundary (Phase 6 resilience): if any
                        single section throws during render/hydration, only that
                        section falls back to an inline "unavailable" notice.
                        Every sibling section — and the navbar + footer — keep
                        rendering, so the homepage can never be blanked by one
                        failing component. */}
                    <SectionErrorBoundary label={type}>
                        {sectionMap[type]}
                    </SectionErrorBoundary>
                </Fragment>
            ))}
        </main>
    );
}
