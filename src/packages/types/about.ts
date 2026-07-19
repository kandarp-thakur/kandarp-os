import { z } from "zod";

/**
 * Type definitions for the About terminal session.
 *
 * Zod schemas are the source of truth; types are inferred. Mirrors the
 * command output shapes defined in about-page-design.md (§4–§10): plain
 * text, neofetch, hostnamectl, education (INI), motd (mission), goals
 * (checklist).
 */

/** A labelled key-value pair rendered as `label: value` in terminal output. */
export const kvPairSchema = z.object({
    label: z.string(),
    value: z.string(),
});
export type KvPair = z.infer<typeof kvPairSchema>;

/** An INI-style education block: `[section]` header + key=value entries. */
export const educationBlockSchema = z.object({
    section: z.string(),
    entries: z.array(kvPairSchema),
});
export type EducationBlock = z.infer<typeof educationBlockSchema>;

/** Plain text output — one or more lines (e.g. `whoami`). */
const plainOutputSchema = z.object({
    kind: z.literal("plain"),
    lines: z.array(z.string()),
});

/** Neofetch output — ASCII art column + system info column. */
const neofetchOutputSchema = z.object({
    kind: z.literal("neofetch"),
    title: z.string(),
    rule: z.string(),
    art: z.array(z.string()),
    info: z.array(kvPairSchema),
});

/** hostnamectl output — indented, colon-aligned key-value fields. */
const hostnamectlOutputSchema = z.object({
    kind: z.literal("hostnamectl"),
    fields: z.array(kvPairSchema),
});

/** Education output — INI config blocks. */
const educationOutputSchema = z.object({
    kind: z.literal("education"),
    blocks: z.array(educationBlockSchema),
});

/** MOTD output — a mission statement boxed in ASCII art. */
const motdOutputSchema = z.object({
    kind: z.literal("motd"),
    quote: z.array(z.string()),
    attribution: z.string(),
});

/** Goals output — a checklist file (`/etc/goals.list`). Each item carries a
 * done/pending marker (about-page-design §10). */
const goalsOutputSchema = z.object({
    kind: z.literal("goals"),
    items: z.array(
        z.object({
            text: z.string(),
            done: z.boolean(),
        }),
    ),
});

/** Discriminated union of terminal output shapes for the About session. */
export const aboutOutputSchema = z.discriminatedUnion("kind", [
    plainOutputSchema,
    neofetchOutputSchema,
    hostnamectlOutputSchema,
    educationOutputSchema,
    motdOutputSchema,
    goalsOutputSchema,
]);
export type AboutOutput = z.infer<typeof aboutOutputSchema>;

/**
 * A single command + its output in the About terminal session.
 *
 * `section` is the human-readable block title shown in the redesigned
 * vertical panel (e.g. "Identity", "System", "Education"). It groups the
 * command into a scannable section rather than a wall of terminal output.
 */
export const aboutCommandSchema = z.object({
    id: z.string(),
    command: z.string(),
    /** Human-readable section label for the panel block. */
    section: z.string(),
    output: aboutOutputSchema,
});
export type AboutCommand = z.infer<typeof aboutCommandSchema>;
