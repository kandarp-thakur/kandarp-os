import { Fragment } from "react";

import { BootScreen } from "@features/hero/components/BootScreen";
import { HeroSection } from "@features/hero/components/HeroSection";
import { AboutTerminal } from "@features/about/components/AboutTerminal";
import { ExperienceTimeline } from "@features/experience/components/ExperienceTimeline";
import { ContainerFleet } from "@features/projects/components/ContainerFleet";
import { InfrastructureTopology } from "@features/infrastructure/components/InfrastructureTopology";
import { SkillsMesh } from "@features/skills/components/SkillsMesh";
import { AchievementsGrid } from "@features/about/components/AchievementsGrid";
import { ContactTerminal } from "@features/contact/components/ContactTerminal";
import { ConnectLinks } from "@features/contact/components/ConnectLinks";
import { JournalStream } from "@features/blog/components/JournalStream";
import { PageHeader } from "@features/shared/components/PageHeader";
import { StatPills } from "@features/shared/components/StatPills";
import { Section } from "@features/layout/components/Section";
import { Container } from "@features/layout/components/Container";
import { deriveEdges } from "@/data/skills";
import {
    getPublicAchievementStats,
    getPublicAwards,
    getPublicBlogPostMetas,
    getPublicBlogTags,
    getPublicBlogUnits,
    getPublicBlogWordCount,
    getPublicDeploymentStats,
    getPublicExperience,
    getPublicFleetStats,
    getPublicInfraEdges,
    getPublicInfraNodes,
    getPublicInfraStats,
    getPublicPrimaryResume,
    getPublicProjects,
    getPublicSiteCustomization,
    getPublicSkillStats,
    getPublicSkills,
} from "@backend/services/public-data";
import { getSiteConfig } from "@hooks/useSiteConfig";
import { formatWordCount } from "@/data/blog";
import { SECTIONS } from "@utils/constants";
import type { BlogUnit } from "@packages/types/blog";
import type { SectionConfig } from "@backend/schemas/types";

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

/** Value color per achievement-stat key. */
const ACHIEVEMENT_STAT_COLOR: Record<string, string> = {
    total: "text-text-primary",
    legendary: "text-amber-500",
    epic: "text-blue-500",
    rare: "text-sky-500",
};

/** Value color per journal-stat key. */
const JOURNAL_STAT_COLOR: Record<string, string> = {
    entries: "text-text-primary",
    units: "text-accent-solid",
    tags: "text-info",
    words: "text-success",
};

/**
 * The default section order, used when the CMS has no SiteCustomization or
 * when a section type is missing from the customization. Maps the
 * SiteCustomization `type` key to the anchor `id` from [`SECTIONS`](../utils/constants.ts).
 */
const DEFAULT_SECTION_ORDER: { type: string; id: string }[] = [
    { type: "hero", id: SECTIONS.hero },
    { type: "about", id: SECTIONS.whoami },
    { type: "experience", id: SECTIONS.deployments },
    { type: "projects", id: SECTIONS.containers },
    { type: "infrastructure", id: SECTIONS.infrastructure },
    { type: "skills", id: SECTIONS.toolkit },
    { type: "achievements", id: SECTIONS.achievements },
    { type: "blog", id: SECTIONS.logs },
    { type: "contact", id: SECTIONS.ssh },
];

/**
 * Resolve the ordered + visible sections from the CMS SiteCustomization.
 *
 * If the customization is missing or has no sections, returns the default
 * order with all sections visible. Otherwise, filters by `visible` and sorts
 * by `order`, falling back to the default order for any missing types.
 */
function resolveSectionOrder(
    customization: { sections: SectionConfig[] } | null,
): { type: string; id: string }[] {
    if (!customization?.sections || customization.sections.length === 0) {
        return DEFAULT_SECTION_ORDER;
    }

    // Build a lookup: type → { visible, order }
    const lookup = new Map<string, { visible: boolean; order: number }>();
    for (const s of customization.sections) {
        lookup.set(s.type, { visible: s.visible, order: s.order });
    }

    return DEFAULT_SECTION_ORDER.map((entry) => {
        const cfg = lookup.get(entry.type);
        return {
            type: entry.type,
            id: entry.id,
            visible: cfg?.visible ?? true,
            order: cfg?.order ?? DEFAULT_SECTION_ORDER.indexOf(entry),
        };
    })
        .filter((s) => s.visible)
        .sort((a, b) => a.order - b.order);
}

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
 * Section visibility + order come from the SiteCustomization singleton.
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
        customization,
        config,
        deploymentStats,
        fleetStats,
        infraStats,
        skillStats,
        achievementStats,
        blogUnits,
        blogTags,
        blogWordCount,
        primaryResume,
    ] = await Promise.all([
        getPublicBlogPostMetas(),
        getPublicExperience(),
        getPublicProjects(),
        getPublicInfraNodes(),
        getPublicInfraEdges(),
        getPublicSkills(),
        getPublicAwards(),
        getPublicSiteCustomization(),
        getSiteConfig(),
        getPublicDeploymentStats(),
        getPublicFleetStats(),
        getPublicInfraStats(),
        getPublicSkillStats(),
        getPublicAchievementStats(),
        getPublicBlogUnits(),
        getPublicBlogTags(),
        getPublicBlogWordCount(),
        getPublicPrimaryResume(),
    ]);

    const skillEdges = deriveEdges(skillNodes);

    const units = blogUnits.map(({ unit, count }) => ({
        unit: unit as BlogUnit,
        count,
    }));

    // The journal stats from the CMS already include entries/units/tags/words,
    // but we re-derive from the resolved posts/units/tags/wordCount to ensure
    // consistency with the actual rendered data (the CMS stats function reads
    // the store independently). Use the locally-resolved values.
    const resolvedJournalStats = [
        { key: "entries", label: "Entries", value: String(posts.length) },
        { key: "units", label: "Units", value: String(units.length) },
        { key: "tags", label: "Tags", value: String(blogTags.length) },
        {
            key: "words",
            label: "Words",
            value: formatWordCount(blogWordCount),
        },
    ];

    const orderedSections = resolveSectionOrder(customization);

    // Build a lookup so we can render each section by type.
    const sectionMap: Record<string, React.ReactNode> = {
        hero: (
            <Section
                id={SECTIONS.hero}
                spacing="none"
                aria-label="Hero"
                className="scroll-mt-20"
            >
                <Container maxWidth="wide">
                    <HeroSection
                        ownerName={config.owner}
                        userAtHost={config.userAtHost}
                        resumeUrl={primaryResume?.fileUrl}
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
                        title="Unlocked Badges"
                        command="cat /var/log/achievements.log"
                        className="mb-8"
                    />
                    <StatPills
                        stats={achievementStats}
                        colorByKey={ACHIEVEMENT_STAT_COLOR}
                        className="mb-12"
                    />
                    <AchievementsGrid
                        achievements={achievements}
                        className="w-full"
                    />
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
                        units={units}
                        tags={blogTags}
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
                    <ContactTerminal />

                    {/* Visible, clickable connect channels — a single-click
                        companion to the terminal for visitors who don't know
                        to type `github`, `email`, etc. */}
                    <ConnectLinks className="mt-8" />
                </Container>
            </Section>
        ),
    };

    return (
        <main>
            {/* Boot Screen — plays once, then fades to reveal the hero. */}
            <BootScreen />

            {/* Render sections in the CMS-driven order, skipping hidden ones. */}
            {orderedSections.map((entry) => (
                <Fragment key={entry.type}>{sectionMap[entry.type]}</Fragment>
            ))}
        </main>
    );
}
