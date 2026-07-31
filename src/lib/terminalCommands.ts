import { commandByName, commands } from "@/data/contactCommands";
import { socials as defaultSocials } from "@/data/socials";
import { SECTIONS, SITE } from "@utils/constants";
import type { SocialLink, TerminalLine } from "@packages/types/contact";
import { err, link, out } from "@/lib/terminalLines";

/**
 * Terminal command execution — pure logic, no React.
 *
 * Parses raw input, resolves it against the command/social registries, and
 * returns the lines to render plus optional side effects (clear / open URL /
 * scroll to a section). The React hook (`useTerminal`) owns state; this module
 * owns behaviour.
 */

/** Result of executing a single command. */
export interface ExecutionResult {
    /** Lines appended to the session. */
    lines: TerminalLine[];
    /** Requests the screen be wiped. */
    clear?: boolean;
    /** Requests a link be opened (external navigation). */
    openUrl?: string;
    /** Requests an in-page smooth-scroll to a section id (internal nav). */
    scrollTo?: string;
}

/**
 * Directory metaphor for `cd` — maps friendly names to section ids.
 * The single-page app's sections act like directories you can "cd" into.
 * Aliases are lowercased and matched case-insensitively.
 */
const DIRECTORY_ALIASES: Record<string, string> = {
    // Home / root — the hero / top of page.
    "~": SECTIONS.hero,
    "/": SECTIONS.hero,
    "": SECTIONS.hero,
    home: SECTIONS.hero,
    hero: SECTIONS.hero,
    top: SECTIONS.hero,

    // About / whoami.
    whoami: SECTIONS.whoami,
    about: SECTIONS.whoami,

    // Experience / deployments.
    experience: SECTIONS.deployments,
    deployments: SECTIONS.deployments,
    exp: SECTIONS.deployments,

    // Projects / containers.
    projects: SECTIONS.containers,
    containers: SECTIONS.containers,
    "docker ps": SECTIONS.containers,

    // Toolkit / skills.
    toolkit: SECTIONS.toolkit,
    skills: SECTIONS.toolkit,

    // Infrastructure.
    infrastructure: SECTIONS.infrastructure,
    infra: SECTIONS.infrastructure,

    // Achievements / awards.
    achievements: SECTIONS.achievements,
    awards: SECTIONS.achievements,

    // Logs / blog.
    logs: SECTIONS.logs,
    blog: SECTIONS.logs,
    journal: SECTIONS.logs,

    // SSH / contact.
    ssh: SECTIONS.ssh,
    contact: SECTIONS.ssh,
};

/** Ordered list of navigable directories for `cd` tab-completion / listing. */
const DIRECTORY_LIST = [
    "experience",
    "projects",
    "infrastructure",
    "toolkit",
    "achievements",
    "logs",
    "ssh",
];

export interface TerminalCommandOverrides {
    /** CMS-resolved Contact links; static links are used when omitted. */
    socials?: SocialLink[];
}

/** Execute a parsed command, returning lines + optional side effects. */
export function executeCommand(
    rawInput: string,
    overrides?: TerminalCommandOverrides,
): ExecutionResult {
    const input = rawInput.trim();
    const socials = overrides?.socials ?? defaultSocials;
    const [name, ...args] = input.split(/\s+/);
    const command = name ?? "";

    // Empty input — just echo a fresh prompt.
    if (command === "") {
        return { lines: [] };
    }

    // `clear` wipes the screen.
    if (command === "clear") {
        return { lines: [], clear: true };
    }

    // `help` lists commands, or describes one if given an argument.
    if (command === "help") {
        return runHelp(args, socials);
    }

    // `whoami` prints the current user.
    if (command === "whoami") {
        return { lines: [out(SITE.shortName)] };
    }

    // `ls` lists contact endpoints like directory entries.
    if (command === "ls") {
        return runLs(socials);
    }

    // `cd` navigates to a page section (directory metaphor).
    if (command === "cd") {
        return runCd(args);
    }

    // `pwd` prints the current "directory" (the active section).
    if (command === "pwd") {
        return runPwd();
    }

    // External commands — open the matching CMS-resolved contact link.
    const social = socials.find((link) => link.command === command);
    if (social) {
        if (social.command === "resume" && social.url === "/#whoami") {
            return {
                lines: [
                    out("Resume PDF is not configured for this site build."),
                    out("Opening the profile section instead."),
                ],
                scrollTo: SECTIONS.whoami,
            };
        }

        return {
            lines: [
                out(`Opening ${social.label}…`),
                link(
                    `${social.handle} → ${social.url}`,
                    social.url,
                    social.description,
                ),
            ],
            openUrl: social.url,
        };
    }

    // Unknown command — including the deliberately-absent `code`.
    return {
        lines: [
            err(`${command}: command not found`),
            out(`Type 'help' for a list of available commands.`),
        ],
    };
}

/** `help` — list all commands, or describe one if given an argument. */
function runHelp(args: string[], socials: SocialLink[]): ExecutionResult {
    const socialCommands = new Set(socials.map((social) => social.command));
    const availableCommands = commands.filter(
        (command) => !command.isExternal || socialCommands.has(command.name),
    );
    const target = args[0];
    if (target) {
        const candidate = commandByName.get(target);
        const meta =
            candidate && (!candidate.isExternal || socialCommands.has(target))
                ? candidate
                : undefined;
        const social = socials.find((link) => link.command === target);
        if (!meta && !social) {
            return { lines: [err(`help: no help entry for '${target}'`)] };
        }
        if (meta) {
            return {
                lines: [
                    out(`${meta.name} — ${meta.summary}`),
                    out(`usage: ${meta.usage}`),
                ],
            };
        }

        if (social) {
            return {
                lines: [
                    out(`${social.command} — ${social.description}`),
                    out(`usage: ${social.command}`),
                ],
            };
        }

        return { lines: [err(`help: no help entry for '${target}'`)] };
    }

    const staticNames = new Set(commands.map((command) => command.name));
    const dynamicCommands = socials
        .filter((social) => !staticNames.has(social.command))
        .map((social) => ({
            name: social.command,
            summary: social.description,
        }));
    const rows = [...availableCommands, ...dynamicCommands].map(
        (command) => `  ${command.name.padEnd(10)} ${command.summary}`,
    );
    return {
        lines: [
            out(`${SITE.name} — available commands:`),
            ...rows.map((r) => out(r)),
            out(``),
            out(`Tip: type a command and press Enter. Use 'clear' to reset.`),
        ],
    };
}

/** `ls` — list contact endpoints like directory entries. */
function runLs(socials: SocialLink[]): ExecutionResult {
    const entries = socials.map(
        (s) => `${s.command.padEnd(10)}  # ${s.label} — ${s.handle}`,
    );
    return {
        lines: [out(`total ${socials.length}`), ...entries.map((e) => out(e))],
    };
}

/**
 * `cd` — navigate to a page section (directory metaphor).
 *
 * With no argument (or `~` / `/`), scrolls to the hero (home). With a known
 * alias, smooth-scrolls to that section. Unknown targets print a shell-style
 * "no such directory" error and list the valid destinations.
 */
function runCd(args: string[]): ExecutionResult {
    const target = (args[0] ?? "").trim().toLowerCase();

    // `cd` with no arg, `cd ~`, or `cd /` → go home (hero).
    if (target === "" || target === "~" || target === "/") {
        return {
            lines: [out(`~`)],
            scrollTo: SECTIONS.hero,
        };
    }

    const sectionId = DIRECTORY_ALIASES[target];
    if (!sectionId) {
        return {
            lines: [
                err(`cd: no such directory: ${args[0]}`),
                out(`Available directories: ${DIRECTORY_LIST.join(", ")}`),
            ],
        };
    }

    return {
        lines: [out(`/${target}`)],
        scrollTo: sectionId,
    };
}

/**
 * `pwd` — print the current "working directory" (the active section).
 * Reads scroll position to report which section is in view.
 */
function runPwd(): ExecutionResult {
    if (typeof document === "undefined") {
        return { lines: [out(`/${SECTIONS.hero}`)] };
    }
    const active = getActiveSectionId();
    return { lines: [out(`/${active ?? SECTIONS.hero}`)] };
}

/**
 * Resolve the currently-active section id by scanning the DOM for the section
 * whose top is nearest (just above) the viewport offset. Mirrors the logic in
 * `getActiveSection` but returns the raw section id.
 */
function getActiveSectionId(): string | null {
    const ids = Object.values(SECTIONS);
    let active: string | null = null;
    const offset = 120;
    for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= offset) {
            active = id;
        }
    }
    return active ?? ids[0] ?? null;
}
