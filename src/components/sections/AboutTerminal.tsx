"use client";

import { memo, useCallback, useEffect, useRef } from "react";

import { CopyButton } from "@/components/shared/CopyButton";
import { AboutOutputView } from "@/components/sections/AboutOutputView";
import { useAboutTerminal } from "@/hooks/useAboutTerminal";
import { aboutHeading, buildAboutTranscript } from "@/lib/aboutSummary";
import { ABOUT_COMMANDS } from "@/data/about";
import { SITE } from "@/utils/constants";
import { cn } from "@/utils/cn";
import type { AboutBlock } from "@/hooks/useAboutTerminal";
import type { AboutOutput } from "@/types/about";

interface AboutTerminalProps {
    className?: string;
}

/**
 * About terminal — ONE premium developer terminal window.
 *
 * A single dark glass window (Warp / Ghostty / iTerm2 inspired) with a real
 * macOS traffic-light header and a single scrolling content area. The window
 * is deliberately **wide and short** (≈ 70–80% content width, 500–650px tall)
 * — much wider than it is tall — so it reads like a real coding terminal, not
 * a thin vertical panel or a portfolio widget.
 *
 * Every command is just a prompt line followed by its output, separated by a
 * thin hairline divider, exactly like a real terminal session. No cards, no
 * widgets, no accordions — one continuous session.
 *
 * Header: three traffic-light dots, `root@kandarp: ~/about — zsh`, and a copy
 * button. The body has its own internal scrollbar and auto-scrolls to the
 * bottom as commands type — but yields to the user the moment they scroll up,
 * resuming auto-follow only when they return to the bottom (real terminal UX).
 *
 * Accessibility: the visual terminal is `aria-hidden` (decorative motion); an
 * sr-only semantic section carries the same info for screen readers + SEO.
 * Reduced motion renders the full session at once.
 */
export function AboutTerminal({ className }: AboutTerminalProps) {
    const { terminalRef, blocks, typing, typingActive, isComplete } =
        useAboutTerminal();
    const transcript = buildAboutTranscript();

    // Auto-scroll the terminal body to the bottom whenever new content
    // arrives — but only if the user is already parked at (or near) the
    // bottom. If they have scrolled up to read history, we leave them there
    // and resume auto-follow once they scroll back down. This mirrors how
    // real terminals (tmux, iTerm2) behave.
    const bodyRef = useRef<HTMLDivElement>(null);
    const stickToBottomRef = useRef(true);

    const handleScroll = useCallback(() => {
        const el = bodyRef.current;
        if (!el) return;
        const distanceFromBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight;
        // 32px tolerance — treat "near the bottom" as "following".
        stickToBottomRef.current = distanceFromBottom <= 32;
    }, []);

    useEffect(() => {
        const el = bodyRef.current;
        if (!el || !stickToBottomRef.current) return;
        el.scrollTop = el.scrollHeight;
    }, [blocks, typing, isComplete]);

    return (
        <div
            className={cn(
                // One continuous dark glass window: large radius, thin border,
                // soft layered shadow. Wide and short — a real coding terminal.
                "terminal-surface relative flex flex-col overflow-hidden rounded-xl",
                "h-[560px] w-full max-h-[650px] min-h-[500px] sm:h-[600px]",
                className,
            )}
        >
            {/* ── macOS-style traffic-light header ── */}
            <div className="terminal-header flex items-center gap-3 px-4 py-2.5">
                {/* Traffic lights — close / minimize / zoom. Decorative. */}
                <div className="flex items-center gap-2" aria-hidden="true">
                    <span className="h-3 w-3 rounded-full bg-traffic-close" />
                    <span className="h-3 w-3 rounded-full bg-traffic-minimize" />
                    <span className="h-3 w-3 rounded-full bg-traffic-zoom" />
                </div>

                {/* Window title — user@host: path — shell. */}
                <div className="ml-2 flex min-w-0 flex-1 items-baseline gap-1.5">
                    <span className="truncate font-mono text-xs font-medium text-term-prompt">
                        {SITE.userAtHost}
                    </span>
                    <span className="truncate font-mono text-2xs text-term-label">
                        : ~/about — zsh
                    </span>
                </div>

                {/* Copy session — the only action. */}
                <div className="ml-auto shrink-0">
                    <CopyButton value={transcript} label="Copy" />
                </div>
            </div>

            {/* ── Single scrolling content area ── */}
            <div
                ref={(node) => {
                    // Merge the hook's IntersectionObserver ref (for scroll-
                    // trigger) with the local body ref (for auto-scroll).
                    (
                        terminalRef as React.MutableRefObject<HTMLDivElement | null>
                    ).current = node;
                    (
                        bodyRef as React.MutableRefObject<HTMLDivElement | null>
                    ).current = node;
                }}
                onScroll={handleScroll}
                aria-hidden="true"
                // Lenis intercepts wheel events globally for smooth page scroll.
                // This attribute exempts the terminal's internal scroll container
                // so the mouse wheel scrolls the terminal body, not the page.
                data-lenis-prevent
                className="terminal-scroll flex-1 overflow-y-auto px-5 py-4 sm:px-6"
            >
                <div className="flex flex-col gap-3 font-mono text-xs leading-relaxed text-term-value sm:text-sm">
                    {blocks.map((block, idx) => (
                        <AboutBlockView
                            key={block.command.id}
                            block={block}
                            showDivider={idx > 0}
                        />
                    ))}

                    {/* Active typing line with blinking cursor. */}
                    {typing !== "" && (
                        <div className="flex items-baseline gap-2">
                            <Prompt />
                            <span className="whitespace-pre-wrap break-words text-term-command">
                                {typing}
                                <Cursor />
                            </span>
                        </div>
                    )}

                    {/* Idle prompt cursor — before the first command, between
                        commands (during read pauses), and after completion.
                        `typingActive` keeps the cursor blinking through the
                        inter-command gaps so the terminal never looks frozen
                        mid-session. */}
                    {typing === "" &&
                        (blocks.length === 0 || typingActive || isComplete) && (
                            <div className="flex items-baseline gap-2">
                                <Prompt />
                                <Cursor />
                            </div>
                        )}
                </div>
            </div>

            {/* Screen-reader-only semantic About info (a11y + SEO).
                Derived from the data layer — no duplicated copy. */}
            <section className="sr-only">
                <h2>{aboutHeading()}</h2>
                <p>
                    {SITE.owner} is a full-stack engineer and DevOps architect.
                    Runtime details for {SITE.userAtHost}.
                </p>
                {ABOUT_COMMANDS.map((cmd) => (
                    <SemanticBlock
                        key={cmd.id}
                        command={cmd.command}
                        output={cmd.output}
                    />
                ))}
            </section>
        </div>
    );
}

/** The blue prompt segment: `root@kandarp:~$`. */
function Prompt() {
    return (
        <span className="shrink-0 select-none whitespace-nowrap text-term-prompt">
            {SITE.userAtHost}
            <span className="text-term-label">:~</span>
            <span className="text-term-prompt">$</span>
        </span>
    );
}

/** The blinking block cursor. */
function Cursor() {
    return (
        <span
            className="ml-px inline-block h-[1.1em] w-[0.55ch] translate-y-[0.15em] bg-term-cursor animate-cursor-blink"
            aria-hidden="true"
        />
    );
}

interface AboutBlockViewProps {
    block: AboutBlock;
    /** Whether to render a hairline divider above this block. */
    showDivider: boolean;
}

/**
 * A committed command block in the continuous terminal: an optional hairline
 * divider, the typed command prompt, and the revealed output. No card, no
 * border, no box — just terminal lines, like a real session.
 *
 * Memoized so the per-character typing ticks (which only change the `typing`
 * string on the parent) do NOT re-render already-committed blocks. This is the
 * key smoothness fix: without `memo`, every keystroke re-rendered the entire
 * session — including the expensive neofetch ASCII art (`text-gradient` /
 * `background-clip: text`) — causing visible jank.
 */
const AboutBlockView = memo(function AboutBlockView({
    block,
    showDivider,
}: AboutBlockViewProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {/* Hairline divider between commands — a real terminal separator. */}
            {showDivider && (
                <div className="my-1 h-px w-full bg-term-divider" />
            )}

            {/* The typed command line. */}
            <div className="flex items-baseline gap-2">
                <Prompt />
                <span className="whitespace-pre-wrap break-words text-term-command">
                    {block.command.command}
                </span>
            </div>

            {/* The output — revealed after the command types. */}
            {block.outputShown && (
                <div className="animate-fade-up pl-1">
                    <AboutOutputView output={block.command.output} />
                </div>
            )}
        </div>
    );
});

interface SemanticBlockProps {
    command: string;
    output: AboutOutput;
}

/**
 * Semantic HTML rendering of an About command for screen readers + SEO
 * (about-page-design §15.1). Each command becomes a heading + structured
 * content (lists, paragraphs, definition lists) — the same info as the
 * visual terminal, presented accessibly.
 */
function SemanticBlock({ command, output }: SemanticBlockProps) {
    if (output.kind === "plain") {
        return (
            <p>
                <strong>{command}:</strong> {output.lines.join(", ")}
            </p>
        );
    }

    if (output.kind === "neofetch") {
        return (
            <section>
                <h3>System summary ({command})</h3>
                <dl>
                    {output.info.map((kv) => (
                        <div key={kv.label}>
                            <dt>{kv.label}</dt>
                            <dd>{kv.value}</dd>
                        </div>
                    ))}
                </dl>
            </section>
        );
    }

    if (output.kind === "hostnamectl") {
        return (
            <section>
                <h3>System identity ({command})</h3>
                <dl>
                    {output.fields.map((kv) => (
                        <div key={kv.label}>
                            <dt>{kv.label}</dt>
                            <dd>{kv.value}</dd>
                        </div>
                    ))}
                </dl>
            </section>
        );
    }

    if (output.kind === "education") {
        return (
            <section>
                <h3>Education ({command})</h3>
                {output.blocks.map((block) => {
                    const head = block.entries[0]?.value ?? "";
                    return (
                        <div key={`${block.section}-${head}`}>
                            <h4>{block.section}</h4>
                            <dl>
                                {block.entries.map((kv) => (
                                    <div key={kv.label}>
                                        <dt>{kv.label}</dt>
                                        <dd>{kv.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    );
                })}
            </section>
        );
    }

    if (output.kind === "motd") {
        return (
            <section>
                <h3>Mission ({command})</h3>
                <blockquote>
                    <p>{output.quote.join(" ")}</p>
                    <footer>
                        <cite>{output.attribution}</cite>
                    </footer>
                </blockquote>
            </section>
        );
    }

    // goals — a checklist. Status is conveyed by the leading word ("done"/
    // "pending") so screen readers announce it without relying on the `[x]`
    // marker glyph (about-page-design §15 — colour/character independence).
    return (
        <section>
            <h3>Goals ({command})</h3>
            <ul>
                {output.items.map((item) => (
                    <li key={item.text}>
                        {item.done ? "done" : "pending"}: {item.text}
                    </li>
                ))}
            </ul>
        </section>
    );
}

AboutTerminal.displayName = "AboutTerminal";
