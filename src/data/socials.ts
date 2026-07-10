import { socialLinkSchema, type SocialLink } from "@/types/contact";
import { SITE } from "@/utils/constants";

/**
 * Social + contact links for Kandarp.
 * Each link is also exposed as a terminal command on the contact page.
 * Values are validated against the Zod schema at module load.
 */
const rawSocials = [
    {
        id: "github",
        label: "GitHub",
        command: "github",
        url: "https://github.com/kktha",
        handle: "@kktha",
        description:
            "Open source projects, automation scripts, and experiments.",
    },
    {
        id: "email",
        label: "Email",
        command: "email",
        url: `mailto:${SITE.email}`,
        handle: SITE.email,
        description: "Direct line — for work, collaboration, or a hello.",
    },
    {
        id: "phone",
        label: "Phone",
        command: "phone",
        url: `tel:${SITE.phone.replace(/\+/g, "")}`,
        handle: SITE.phone,
        description:
            "Call directly — available for opportunities and quick syncs.",
    },
    {
        id: "linkedin",
        label: "LinkedIn",
        command: "linkedin",
        url: "https://www.linkedin.com/in/kandarp-kumar-thakur",
        handle: "in/kandarp-kumar-thakur",
        description: "Professional history and current role.",
    },
    {
        id: "hackerrank",
        label: "HackerRank",
        command: "hackerrank",
        url: "https://www.hackerrank.com/kkthakur100101",
        handle: "@kkthakur100101",
        description: "Competitive programming profile and solved challenges.",
    },
    {
        id: "youtube",
        label: "YouTube",
        command: "youtube",
        url: "https://www.youtube.com/@code.thakur",
        handle: "@code.thakur",
        description:
            "Tech content — tutorials, builds, and engineering deep dives.",
    },
    {
        id: "resume",
        label: "Resume",
        command: "resume",
        url: "/resume.pdf",
        handle: "resume.pdf",
        description: "One-page PDF résumé — latest revision.",
    },
] as const;

/**
 * Validated social links. Parsing here guarantees shape at runtime;
 * a malformed entry fails fast in dev rather than rendering broken UI.
 */
export const socials: SocialLink[] = rawSocials.map((s) =>
    socialLinkSchema.parse({ ...s }),
);

/** Quick lookup by terminal command alias. */
export const socialByCommand = new Map<string, SocialLink>(
    socials.map((s) => [s.command, s]),
);
