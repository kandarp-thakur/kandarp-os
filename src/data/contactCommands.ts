/**
 * Metadata for each terminal command available on the contact page.
 * Static content lives here; execution logic lives in `lib/terminalCommands`.
 */

export interface CommandMeta {
    /** The command name typed at the prompt. */
    name: string;
    /** One-line summary shown in `help`. */
    summary: string;
    /** Longer usage shown when the command is run with `--help`. */
    usage: string;
    /** Whether the command opens an external link (vs. internal output). */
    isExternal: boolean;
}

/**
 * The full command set. `code` is intentionally absent — typing it returns
 * "command not found", matching the SSH aesthetic (no GUI editor here).
 */
export const commands: CommandMeta[] = [
    {
        name: "help",
        summary: "List available commands.",
        usage: "help [command]",
        isExternal: false,
    },
    {
        name: "whoami",
        summary: "Print the current user.",
        usage: "whoami",
        isExternal: false,
    },
    {
        name: "ls",
        summary: "List contact endpoints.",
        usage: "ls",
        isExternal: false,
    },
    {
        name: "cd",
        summary: "Navigate to a section (directory).",
        usage: "cd [section]   e.g. cd projects, cd ssh, cd ~",
        isExternal: false,
    },
    {
        name: "pwd",
        summary: "Print the current section.",
        usage: "pwd",
        isExternal: false,
    },
    {
        name: "clear",
        summary: "Clear the terminal screen.",
        usage: "clear",
        isExternal: false,
    },
    {
        name: "resume",
        summary: "Open the résumé (PDF).",
        usage: "resume",
        isExternal: true,
    },
    {
        name: "github",
        summary: "Open GitHub profile.",
        usage: "github",
        isExternal: true,
    },
    {
        name: "email",
        summary: "Compose an email.",
        usage: "email",
        isExternal: true,
    },
    {
        name: "phone",
        summary: "Initiate a phone call.",
        usage: "phone",
        isExternal: true,
    },
    {
        name: "linkedin",
        summary: "Open LinkedIn profile.",
        usage: "linkedin",
        isExternal: true,
    },
    {
        name: "hackerrank",
        summary: "Open HackerRank profile.",
        usage: "hackerrank",
        isExternal: true,
    },
    {
        name: "youtube",
        summary: "Open YouTube channel.",
        usage: "youtube",
        isExternal: true,
    },
];

/** Quick lookup by command name. */
export const commandByName = new Map<string, CommandMeta>(
    commands.map((c) => [c.name, c]),
);
