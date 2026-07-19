import { commandByName, commands } from "@/data/contactCommands";
import { socialByCommand, socials } from "@/data/socials";
import { SECTIONS, SITE } from "@utils/constants";
import type { TerminalLine } from "@packages/types/contact";
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

/** Execute a parsed command, returning lines + optional side effects. */
export function executeCommand(
    rawInput: string,
    overrides?: { resumeUrl?: string },
): ExecutionResult {
    const input = rawInput.trim();
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
        return runHelp(args);
    }

    // `whoami` prints the current user.
    if (command === "whoami") {
        return { lines: [out(SITE.shortName)] };
    }

    // `ls` lists contact endpoints like directory entries.
    if (command === "ls") {
        return runLs();
    }

    // `cd` navigates to a page section (directory metaphor).
    if (command === "cd") {
        return runCd(args);
    }

    // `pwd` prints the current "directory" (the active section).
    if (command === "pwd") {
        return runPwd();
    }

    // External commands — open the matching social link.
    const social = socialByCommand.get(command);
    if (social) {
        // Allow the resume URL to be overridden by the CMS (primary resume).
        const resolvedUrl =
            social.command === "resume" && overrides?.resumeUrl
                ? overrides.resumeUrl
                : social.url;
        return {
            lines: [
                out(`Opening ${social.label}…`),
                link(
                    `${social.handle} → ${resolvedUrl}`,
                    resolvedUrl,
                    social.description,
                ),
            ],
            openUrl: resolvedUrl,
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
function runHelp(args: string[]): ExecutionResult {
    const target = args[0];
    if (target) {
        const meta = commandByName.get(target);
        if (!meta) {
            return { lines: [err(`help: no help entry for '${target}'`)] };
        }
        return {
            lines: [
                out(`${meta.name} — ${meta.summary}`),
                out(`usage: ${meta.usage}`),
            ],
        };
    }

    const rows = commands.map((c) => `  ${c.name.padEnd(10)} ${c.summary}`);
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
function runLs(): ExecutionResult {
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
