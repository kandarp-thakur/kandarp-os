import { memo } from "react";

import { cn } from "@/utils/cn";
import type { AboutOutput } from "@/types/about";

interface AboutOutputViewProps {
    output: AboutOutput;
    className?: string;
}

/**
 * Renders an About terminal output block by kind, as **continuous terminal
 * text** — no cards, no boxes, no widgets. Each kind maps to a real Linux
 * format laid out as plain monospace lines inside one scrolling terminal:
 *
 * - `plain`      → a single value line
 * - `neofetch`   → ASCII art beside system info (wide terminal → two columns)
 * - `hostnamectl`→ colon-aligned key/value rows
 * - `education`  → INI `[section]` + `key=value` text
 * - `motd`       → a blockquote-style mission line
 * - `goals`      → `[x]`/`[ ]` checklist rows
 *
 * Colour is semantic and authentic to a real terminal: labels are dim gray,
 * values are light gray, section headers / accents are cyan, status is green.
 * All output is plain text — no HTML — so it is copy-safe.
 *
 * Memoized so a re-render of the parent terminal (e.g. on every typing tick)
 * does not re-render already-shown output. The neofetch ASCII art uses
 * `text-gradient` (`background-clip: text`), which is expensive to paint —
 * memoizing keeps the typing animation smooth.
 */
export const AboutOutputView = memo(function AboutOutputView({
    output,
    className,
}: AboutOutputViewProps) {
    if (output.kind === "plain") {
        return (
            <div className={cn("font-mono text-sm leading-relaxed", className)}>
                {output.lines.map((line) => (
                    <div key={line} className="text-term-value">
                        {line}
                    </div>
                ))}
            </div>
        );
    }

    if (output.kind === "neofetch") {
        return <NeofetchView output={output} className={className} />;
    }

    if (output.kind === "hostnamectl") {
        return (
            <div className={cn("font-mono text-xs sm:text-sm", className)}>
                {output.fields.map((kv) => (
                    <div key={kv.label} className="flex">
                        <span className="w-40 shrink-0 text-term-label">
                            {kv.label}
                        </span>
                        <span className="text-term-comment">: </span>
                        <span className="min-w-0 flex-1 break-words text-term-value">
                            {kv.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    if (output.kind === "education") {
        return (
            <div
                className={cn(
                    "flex flex-col gap-2 font-mono text-xs sm:text-sm",
                    className,
                )}
            >
                {output.blocks.map((block) => {
                    const head = block.entries[0]?.value ?? "";
                    return (
                        <div key={`${block.section}-${head}`}>
                            <div className="text-term-accent">
                                [{block.section}]
                            </div>
                            {block.entries.map((kv) => (
                                <div key={kv.label} className="flex">
                                    <span className="text-term-label">
                                        {kv.label}
                                    </span>
                                    <span className="text-term-comment">=</span>
                                    <span className="min-w-0 flex-1 break-words text-term-value">
                                        {kv.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        );
    }

    if (output.kind === "motd") {
        // Render the mission as a terminal-style quote — a `>` prefix on each
        // line, attribution in cyan. No ASCII box (keeps the session clean);
        // the copy transcript still uses the box for terminal flavor.
        return (
            <div className={cn("font-mono text-xs sm:text-sm", className)}>
                {output.quote.map((line) => (
                    <div key={line} className="text-term-value">
                        <span className="select-none text-term-accent">
                            {">"}{" "}
                        </span>
                        {line}
                    </div>
                ))}
                <div className="mt-1 text-term-accent">
                    {output.attribution}
                </div>
            </div>
        );
    }

    // goals — checklist rows. `[x]`/`[ ]` marker carries status independent of
    // colour (a11y §15). Done items use success green, pending use dim gray.
    return (
        <div
            className={cn(
                "flex flex-col gap-0.5 font-mono text-xs sm:text-sm",
                className,
            )}
        >
            {output.items.map((item) => (
                <div key={item.text} className="flex gap-2">
                    <span
                        className={cn(
                            "select-none",
                            item.done ? "text-term-success" : "text-term-label",
                        )}
                    >
                        [{item.done ? "x" : " "}]
                    </span>
                    <span
                        className={cn(
                            "min-w-0 flex-1 break-words",
                            item.done ? "text-term-value" : "text-term-label",
                        )}
                    >
                        {item.text}
                    </span>
                </div>
            ))}
        </div>
    );
});

interface NeofetchViewProps {
    output: Extract<AboutOutput, { kind: "neofetch" }>;
    className?: string;
}

/**
 * Neofetch layout for the wide terminal: ASCII art *beside* the system info
 * (two columns) on desktop, stacking above on narrow viewports. The art uses
 * the signature gradient text; the info is a tight key/value list.
 */
function NeofetchView({ output, className }: NeofetchViewProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 sm:flex-row sm:gap-6",
                className,
            )}
        >
            {/* ASCII art — gradient text, the signature accent. */}
            <pre
                className={cn(
                    "shrink-0 font-mono text-[0.6rem] leading-tight text-gradient sm:text-xs",
                    "select-none",
                )}
                aria-hidden="true"
            >
                {output.art.join("\n")}
            </pre>

            {/* System info — title, rule, then key-value rows. */}
            <div className="min-w-0 flex-1 font-mono text-xs sm:text-sm">
                <div className="text-term-accent">{output.title}</div>
                <div className="text-term-comment">{output.rule}</div>
                <div className="mt-1 flex flex-col gap-0.5">
                    {output.info.map((kv) => (
                        <div key={kv.label} className="flex">
                            <span className="w-28 shrink-0 text-term-label">
                                {kv.label}
                            </span>
                            <span className="text-term-comment">: </span>
                            <span className="min-w-0 flex-1 break-words text-term-value">
                                {kv.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

AboutOutputView.displayName = "AboutOutputView";
