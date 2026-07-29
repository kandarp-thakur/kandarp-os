import { SITE } from "@utils/constants";
import type { TerminalLine } from "@packages/types/contact";

/**
 * Terminal line factories.
 *
 * Centralises id generation + line construction so the command executor and
 * the React hook share one source of truth for line shape. No UI lives here.
 */

let lineCounter = 0;

/** Generate a stable, unique id for a terminal line (React key). */
function nextLineId(): string {
    lineCounter += 1;
    return `line-${lineCounter}`;
}

/** Build a system/output line. */
export function out(text: string, hint?: string): TerminalLine {
    return { id: nextLineId(), kind: "output", text, hint };
}

/** Build an error line. */
export function err(text: string): TerminalLine {
    return { id: nextLineId(), kind: "error", text };
}

/** Build a link line. */
export function link(label: string, href: string, hint?: string): TerminalLine {
    return { id: nextLineId(), kind: "link", text: label, href, hint };
}

/** Build an echoed prompt + typed command line. */
export function inputLine(prompt: string, text: string): TerminalLine {
    return { id: nextLineId(), kind: "input", text: `${prompt} ${text}` };
}

/** Lines printed during the boot sequence (before the first prompt). */
export function buildBootLines(): TerminalLine[] {
    return [
        {
            id: nextLineId(),
            kind: "system",
            text: `OpenSSH_9.6p1 Ubuntu-3ubuntu13.4, OpenSSL 3.0.13`,
        },
        {
            id: nextLineId(),
            kind: "system",
            text: `Connection established to ${SITE.host} [fe80::1%lo0] port 22.`,
        },
        {
            id: nextLineId(),
            kind: "system",
            text: `Last login: ${new Date().toUTCString()} from 127.0.0.1`,
        },
        out(`Welcome to ${SITE.name} v1.0 (${SITE.locale}).`),
        out(`Type 'help' to list available commands.`),
    ];
}
