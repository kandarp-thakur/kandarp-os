import { socials } from "@/data/socials";
import { SITE } from "@utils/constants";

/**
 * Derive a plain-text contact summary from the socials data.
 *
 * Used by the terminal's sr-only block (a11y + SEO) so the semantic copy is
 * never hand-maintained alongside the data layer — one source of truth.
 */
export function buildContactSummary(): string {
    const entries = socials
        .map((s) => `${s.label} at ${s.handle}`)
        .join(", or ");
    return `Reach out via ${entries}. Resume details are available from the contact terminal.`;
}

/** Heading for the sr-only contact section. */
export function contactHeading(): string {
    return `Contact ${SITE.owner}`;
}
