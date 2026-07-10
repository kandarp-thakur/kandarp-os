import { ABOUT_COMMANDS } from "@/data/about";
import { SITE } from "@/utils/constants";
import type { AboutCommand, AboutOutput } from "@/types/about";

/**
 * Plain-text rendering of the About terminal session.
 *
 * Used by the terminal's copy button (shares the full readout as text) and
 * as the source for the sr-only semantic block (a11y + SEO). One renderer
 * for both so the transcript never drifts from the data layer.
 */

/** Heading for the sr-only About section. */
export function aboutHeading(): string {
    return `About ${SITE.owner}`;
}

/** Inner width (chars) of the MOTD ASCII box (about-page-design §9.3). */
const MOTD_WIDTH = 60;

/**
 * Wrap quote lines + attribution in an ASCII box (╔═╗║╚═╝). Shared by the
 * copy transcript and the visual MOTD renderer so the box geometry is
 * defined once.
 */
export function boxQuote(quote: string[], attribution: string): string {
    const contentWidth = MOTD_WIDTH - 4; // 2-space margins each side
    const row = (text: string) => `║  ${text.padEnd(contentWidth)}  ║`;
    const blank = `║${" ".repeat(MOTD_WIDTH)}║`;
    return [
        `╔${"═".repeat(MOTD_WIDTH)}╗`,
        blank,
        ...quote.map(row),
        blank,
        row(attribution),
        blank,
        `╚${"═".repeat(MOTD_WIDTH)}╝`,
    ].join("\n");
}

/** Convert an output block to plain text (for the copy transcript). */
function outputToText(output: AboutOutput): string {
    if (output.kind === "plain") {
        return output.lines.map((l) => `› ${l}`).join("\n");
    }
    if (output.kind === "neofetch") {
        return [
            output.title,
            output.rule,
            ...output.info.map((kv) => `${kv.label}: ${kv.value}`),
        ].join("\n");
    }
    if (output.kind === "hostnamectl") {
        return output.fields
            .map((kv) => `   ${kv.label.padEnd(18)}: ${kv.value}`)
            .join("\n");
    }
    if (output.kind === "education") {
        return output.blocks
            .map(
                (b) =>
                    `[${b.section}]\n${b.entries
                        .map((kv) => `${kv.label}=${kv.value}`)
                        .join("\n")}`,
            )
            .join("\n\n");
    }
    if (output.kind === "motd") {
        return boxQuote(output.quote, output.attribution);
    }
    // goals — checklist format matching the visual terminal (§10).
    return output.items
        .map((item) => `[${item.done ? "x" : " "}] ${item.text}`)
        .join("\n");
}

/** Build the full plain-text transcript of the About session. */
export function buildAboutTranscript(): string {
    return ABOUT_COMMANDS.map(
        (cmd) => `$ ${cmd.command}\n${outputToText(cmd.output)}`,
    ).join("\n\n");
}

/**
 * Plain-text transcript for a single command block — used by the per-block
 * copy button in the redesigned vertical panel. Includes the section label as
 * a header so the copied snippet is self-describing out of context.
 */
export function buildAboutBlockTranscript(command: AboutCommand): string {
    return `# ${command.section}\n$ ${command.command}\n${outputToText(command.output)}`;
}
