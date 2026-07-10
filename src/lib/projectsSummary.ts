import { SITE } from "@/utils/constants";
import type { Container } from "@/types/projects";

/**
 * Projects summary helpers (projects-page-design §2, §6).
 *
 * Pure formatting utilities kept in the lib layer so the page + components
 * stay thin. Mirrors the experienceSummary.ts pattern: a heading helper for
 * the sr-only semantic section + a manifest-JSON builder for the inspect
 * panel's `docker inspect` identity card.
 */

/** The page heading — used by the visual header + the sr-only section.
 * "Running Containers" is the internal heading of the Projects section (the
 * navigation label is "Projects"); it frames the `docker ps` project fleet. */
export function projectsHeading(): string {
    return "Running Containers";
}

/** The sr-only intro line for the projects semantic section. */
export function projectsIntro(): string {
    return `${SITE.owner}'s projects rendered as a container fleet — running, archived, and in-progress builds, each inspectable.`;
}

/**
 * Build the `docker inspect`-style manifest JSON for a container (§6.5).
 *
 * Returns a pretty-printed JSON snippet with the container's identity fields.
 * Used by the inspect panel's manifest block + the CopyButton's raw payload.
 */
export function buildManifestJson(container: Container): string {
    const manifest = {
        Name: container.id,
        State: container.status,
        Image: container.image,
        Created: container.created,
        Status: container.statusDetail,
    };
    return JSON.stringify(manifest, null, 2);
}
