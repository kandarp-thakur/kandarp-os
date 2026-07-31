import type { SocialLink } from "@packages/types/contact";

/**
 * Derive a plain-text contact summary from the socials data.
 *
 * Used by the terminal's sr-only block (a11y + SEO) so the semantic copy is
 * never hand-maintained alongside the data layer — one source of truth.
 */
export function buildContactSummary(socials: SocialLink[]): string {
    if (socials.length === 0) {
        return "Use the contact form to start a conversation.";
    }

    const entries = socials
        .map((social) => `${social.label} at ${social.handle}`)
        .join(", or ");
    return `Reach out via ${entries}. You can also use the contact form below.`;
}

/** Heading for the sr-only contact section. */
export function contactHeading(owner: string): string {
    return `Contact ${owner}`;
}
