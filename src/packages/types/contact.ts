import { z } from "zod";

/**
 * Zod schema for a social/contact link.
 * The schema is the source of truth; the type is inferred.
 */
export const socialLinkSchema = z.object({
    /** Stable, unique id — used as React key and command alias. */
    id: z.string(),
    /** Human-readable label, e.g. "GitHub". */
    label: z.string(),
    /** Terminal command that opens this link, e.g. "github". */
    command: z.string(),
    /** URL the command resolves to — http(s) URL, mailto:, or internal path. */
    url: z
        .string()
        .refine(
            (value) =>
                /^https?:\/\//.test(value) ||
                /^mailto:/.test(value) ||
                /^tel:/.test(value) ||
                value.startsWith("/"),
            "Must be an http(s) URL, a mailto: address, a tel: number, or an internal path starting with '/'",
        ),
    /** Short handle shown in terminal output, e.g. "@kandarp". */
    handle: z.string(),
    /** One-line description shown in `help` output. */
    description: z.string(),
});

export type SocialLink = z.infer<typeof socialLinkSchema>;

/**
 * Schema for a single terminal line in the contact session.
 * A line is either a prompt (typed command) or output (result).
 */
export const terminalLineSchema = z.object({
    /** Stable unique id for React keys. */
    id: z.string(),
    /** Kind of line — drives styling. */
    kind: z.enum(["input", "output", "system", "error", "link"]),
    /** Raw text content (plain text, no HTML). */
    text: z.string(),
    /** Optional URL when kind === "link" — http(s), mailto:, or internal path. */
    href: z
        .string()
        .refine(
            (value) =>
                /^https?:\/\//.test(value) ||
                /^mailto:/.test(value) ||
                /^tel:/.test(value) ||
                value.startsWith("/"),
            "Must be an http(s) URL, a mailto: address, a tel: number, or an internal path starting with '/'",
        )
        .optional(),
    /** Optional secondary text rendered dimmed (e.g. a description). */
    hint: z.string().optional(),
});

export type TerminalLine = z.infer<typeof terminalLineSchema>;
