/**
 * App-wide constants for Kandarp OS.
 * Single source of truth for identity + routing metadata.
 */

export const SITE = {
    name: "Kandarp OS",
    owner: "Kandarp Kumar Thakur",
    shortName: "kandarp",
    /** SSH-style host string used across the terminal aesthetic. */
    host: "kandarp",
    /** Terminal user@host prompt segment. */
    userAtHost: "root@kandarp",
    description:
        "Kandarp OS — the operating system of a DevOps & Cloud Engineer specializing in networking, security, and Python automation. An immersive single-page engineering experience.",
    url: "https://kandarp-os.dev",
    locale: "en_US.UTF-8",
    timezone: "Asia/Calcutta",
    /** Direct contact channels. */
    email: "kkthakur100101@gmail.com",
    phone: "+919718189785",
} as const;

/** The SSH-style prompt string: `root@kandarp:~$`. */
export const PROMPT = `${SITE.userAtHost}:~$`;

/**
 * The professional identities revealed in the hero boot sequence.
 * Ordered to match the spec's reveal cadence.
 */
export const ROLES = [
    "DevOps Engineer",
    "Cloud Engineer",
    "Networking Engineer",
    "Cybersecurity Enthusiast",
    "Python Automation Engineer",
] as const;

/**
 * Section anchor IDs for the single-page experience.
 * Every section is reachable via `#id` smooth-scroll navigation.
 * These are the canonical IDs — referenced by navigation, scroll-spy,
 * and the section wrappers themselves.
 */
export const SECTIONS = {
    boot: "boot",
    hero: "hero",
    whoami: "whoami",
    deployments: "deployments",
    containers: "containers",
    infrastructure: "infrastructure",
    toolkit: "toolkit",
    achievements: "achievements",
    logs: "logs",
    ssh: "ssh",
} as const;

/** A `#id` anchor href for a section. */
export function sectionHref(id: string): string {
    return `#${id}`;
}

export const ROUTES = {
    home: "/",
    blog: "/blog",
    contact: "/contact",
} as const;
