"use client";

import { useEffect, useRef } from "react";

import { CopyButton } from "@/components/shared/CopyButton";
import { TerminalLineView } from "@/components/shared/TerminalLineView";
import { useTerminal } from "@/hooks/useTerminal";
import { buildContactSummary, contactHeading } from "@/lib/contactSummary";
import { PROMPT, SITE } from "@/utils/constants";
import { cn } from "@/utils/cn";

interface ContactTerminalProps {
    className?: string;
    /** CMS-driven resume URL (overrides the hardcoded /resume.pdf). */
    resumeUrl?: string;
}

/**
 * Interactive SSH-style contact terminal.
 *
 * Renders a glass terminal that boots an SSH login sequence, then accepts
 * commands: help, whoami, ls, clear, resume, github, email, linkedin.
 * Typing `code` (or any unknown command) returns "command not found".
 *
 * The visual terminal is decorative; an sr-only semantic block carries the
 * same contact info for screen readers + SEO (per about-page-design §15).
 */
export function ContactTerminal({ className, resumeUrl }: ContactTerminalProps) {
    const {
        lines,
        input,
        isReady,
        setInput,
        submit,
        recallHistory,
        clearScreen,
    } = useTerminal(200, resumeUrl ? { resumeUrl } : undefined);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to the bottom whenever new lines appear.
    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [lines]);

    // Focus the input once the boot sequence completes.
    //
    // `preventScroll: true` is critical: this terminal also renders on the home
    // page inside the SSH section (near the bottom). A plain `focus()` would
    // make the browser scroll the input into view, hijacking the page to the
    // SSH section on load. We focus without scrolling so the visitor stays at
    // the top (hero) and only reaches the terminal by scrolling down.
    useEffect(() => {
        if (isReady) {
            inputRef.current?.focus({ preventScroll: true });
        }
    }, [isReady]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            submit();
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            recallHistory("prev");
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            recallHistory("next");
        } else if (event.key === "l" && event.ctrlKey) {
            // Ctrl+L clears the screen — standard terminal shortcut.
            event.preventDefault();
            clearScreen();
        }
    };

    // Plain-text transcript for the copy button + sr-only fallback.
    const transcript = lines.map((l) => l.text).join("\n");

    return (
        <div
            className={cn(
                "terminal-surface overflow-hidden rounded-xl",
                "w-full max-w-3xl",
                className,
            )}
        >
            {/* Terminal header — traffic lights + title + copy */}
            <div className="terminal-header flex items-center gap-3 px-4 py-2.5">
                <div className="flex items-center gap-2" aria-hidden="true">
                    <span className="h-3 w-3 rounded-full bg-traffic-close" />
                    <span className="h-3 w-3 rounded-full bg-traffic-minimize" />
                    <span className="h-3 w-3 rounded-full bg-traffic-zoom" />
                </div>
                <span className="ml-1 truncate font-mono text-xs font-medium text-term-prompt">
                    {SITE.userAtHost}
                    <span className="text-term-label">: ~/contact — ssh</span>
                </span>
                <div className="ml-auto">
                    <CopyButton value={transcript} label="Copy session" />
                </div>
            </div>

            {/* Terminal body — scrollable session */}
            <div
                ref={scrollRef}
                onClick={() => inputRef.current?.focus()}
                role="log"
                aria-live="polite"
                aria-label="Contact terminal session"
                // Lenis intercepts wheel events globally for smooth page scroll.
                // This attribute exempts the terminal's internal scroll container
                // so the mouse wheel scrolls the terminal body, not the page.
                data-lenis-prevent
                className="terminal-scroll h-[420px] cursor-text overflow-y-auto px-5 py-4 sm:px-6"
            >
                {/* Boot + command lines */}
                <div className="flex flex-col gap-1.5">
                    {lines.map((line) => (
                        <TerminalLineView key={line.id} line={line} />
                    ))}
                </div>

                {/* Active prompt + input */}
                {isReady ? (
                    <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="select-none font-mono text-sm text-term-prompt">
                            {PROMPT}
                        </span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            spellCheck={false}
                            autoComplete="off"
                            autoCapitalize="off"
                            autoCorrect="off"
                            aria-label="Terminal command input"
                            className={cn(
                                "flex-1 border-0 bg-transparent p-0 font-mono text-sm text-term-command",
                                "caret-term-prompt outline-none",
                                "placeholder:text-term-label",
                            )}
                        />
                    </div>
                ) : null}
            </div>

            {/* Screen-reader-only semantic contact info (a11y + SEO).
                Derived from the socials data layer — no duplicated copy. */}
            <section className="sr-only">
                <h2>{contactHeading()}</h2>
                <p>{buildContactSummary()}</p>
            </section>
        </div>
    );
}

ContactTerminal.displayName = "ContactTerminal";
