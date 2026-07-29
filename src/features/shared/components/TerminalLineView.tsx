import { cn } from "@utils/cn";
import type { TerminalLine } from "@packages/types/contact";

interface TerminalLineViewProps {
    line: TerminalLine;
    className?: string;
}

/**
 * Renders a single terminal line. Styling is driven by `line.kind`:
 * - input:  the echoed prompt + typed command (primary text)
 * - output: command result (secondary text)
 * - system: boot/login lines (tertiary, dimmed)
 * - error:  command-not-found style messages (error red)
 * - link:   clickable external URL (accent)
 */
export function TerminalLineView({ line, className }: TerminalLineViewProps) {
    if (line.kind === "link" && line.href) {
        return (
            <div
                className={cn(
                    "flex flex-wrap items-baseline gap-x-2",
                    className,
                )}
            >
                <span className="text-accent-solid select-none">{"›"}</span>
                <a
                    href={line.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-accent-solid underline decoration-accent-solid/40 underline-offset-2 transition-colors duration-fast ease-standard hover:decoration-accent-solid"
                >
                    {line.text}
                </a>
                {line.hint ? (
                    <span className="font-mono text-xs text-text-tertiary">
                        {line.hint}
                    </span>
                ) : null}
            </div>
        );
    }

    const tone = TONE_BY_KIND[line.kind];

    return (
        <div className={cn("whitespace-pre-wrap break-words", tone, className)}>
            {line.text}
            {line.hint ? (
                <span className="ml-2 font-mono text-xs text-text-tertiary">
                    {line.hint}
                </span>
            ) : null}
        </div>
    );
}

const TONE_BY_KIND: Record<TerminalLine["kind"], string> = {
    input: "font-mono text-sm text-term-command",
    output: "font-mono text-sm text-term-value",
    system: "font-mono text-xs text-term-label",
    error: "font-mono text-sm text-error",
    link: "font-mono text-sm text-term-accent",
};

TerminalLineView.displayName = "TerminalLineView";
