import { socials as defaultSocials } from "@/data/socials";
import type { PublicSiteIdentity } from "@backend/services/public-data";
import type { SocialLink } from "@packages/types/contact";

const descriptions: Record<string, string> = {
    email: "Direct line — for work, collaboration, or a hello.",
    phone: "Call directly — available for opportunities and quick syncs.",
    github: "Open source projects, automation scripts, and experiments.",
    linkedin: "Professional history and current role.",
    resume: "Download or view the current résumé.",
};

function fallback(command: string): SocialLink | undefined {
    return defaultSocials.find((link) => link.command === command);
}

function urlHandle(url: string): string {
    if (url.startsWith("mailto:")) return url.slice("mailto:".length);
    if (url.startsWith("tel:")) return url.slice("tel:".length);
    if (url.startsWith("/")) return url;

    try {
        const parsed = new URL(url);
        return `${parsed.hostname}${parsed.pathname}`.replace(/\/$/, "");
    } catch {
        return url;
    }
}

function commandFromLabel(label: string, id: string): string {
    const command = label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return command || `link-${id.slice(0, 8).toLowerCase()}`;
}

function primaryLink(
    command: string,
    label: string,
    url: string | null | undefined,
): SocialLink | null {
    const defaultLink = fallback(command);
    const resolvedUrl = url?.trim() || defaultLink?.url;
    if (!resolvedUrl) return null;

    return {
        id: command,
        command,
        label,
        url: resolvedUrl,
        handle: urlHandle(resolvedUrl),
        description:
            descriptions[command] ??
            defaultLink?.description ??
            `Open the ${label} contact channel.`,
    };
}

/**
 * Builds the public Contact page model from the admin-managed Profile singleton.
 * Existing static links remain as safe defaults until a profile value is set.
 */
export function resolveContactLinks(config: PublicSiteIdentity): SocialLink[] {
    const profile = config.profile;
    const primary = [
        primaryLink("email", "Email", profile?.email || config.email),
        primaryLink("phone", "Phone", profile?.phone || config.phone),
        primaryLink("github", "GitHub", profile?.github),
        primaryLink("linkedin", "LinkedIn", profile?.linkedin),
        primaryLink("resume", "Resume", profile?.resume),
    ].filter((link): link is SocialLink => link !== null);

    const usedCommands = new Set(primary.map((link) => link.command));
    const additional = (profile?.socialLinks ?? []).flatMap((link) => {
        const label = link.label?.trim() || link.platform.trim() || "Website";
        let command = commandFromLabel(label, link.id);
        if (usedCommands.has(command)) {
            command = `${command}-${link.id.slice(0, 6).toLowerCase()}`;
        }
        usedCommands.add(command);

        const url = link.url.trim();
        if (!url) return [];

        return [
            {
                id: link.id,
                label,
                command,
                url,
                handle: urlHandle(url),
                description: `Open the ${label} contact channel.`,
            } satisfies SocialLink,
        ];
    });

    return [...primary, ...additional];
}
