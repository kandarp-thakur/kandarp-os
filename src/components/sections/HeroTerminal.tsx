"use client";

import { useId } from "react";

import { useHeroTerminal } from "@/hooks/useHeroTerminal";
import { HERO_ROLES } from "@/data/hero";
import type { HeroLine } from "@/data/hero";
import { cn } from "@/utils/cn";

interface HeroTerminalProps {
    /** Extra classes for the outer terminal shell. */
    className?: string;
    /** SSH-style user@host string for the title bar. Defaults to "kandarp@portfolio". */
    userAtHost?: string;
}

/**
 * Hero terminal (hero-design §3).
 *
 * A glass-surface-strong window that types a looping script: `whoami` → cycling
 * role → `cat skills.json` → output → `./connect.sh` → output. Commands type
 * character-by-character (60ms/char); outputs appear instantly. A block cursor
 * (█) blinks at 530ms on the active line.
 *
 * Accessibility: the visual terminal is `aria-hidden` (it is decorative motion);
 * a visually-hidden live region announces the active role for screen readers.
 * Hovering the window (pointer devices only) pauses the typing loop.
 */
export function HeroTerminal({
    className,
    userAtHost = "kandarp@portfolio",
}: HeroTerminalProps) {
    const { lines, typing, roleIndex, pause, resume } = useHeroTerminal();
    const liveId = useId();

    return (
        <div
            className={cn(
                "glass-surface-strong w-full max-w-[480px] overflow-hidden rounded-xl shadow-glass",
                className,
            )}
            onMouseEnter={pause}
            onMouseLeave={resume}
            onFocus={pause}
            onBlur={resume}
            aria-hidden="true"
        >
            {/* Title bar — traffic lights + filename */}
            <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-traffic-close" />
                <span className="h-3 w-3 rounded-full bg-traffic-minimize" />
                <span className="h-3 w-3 rounded-full bg-traffic-zoom" />
                <span className="ml-2 font-mono text-2xs text-text-tertiary">
                    <span className="text-term-prompt">{userAtHost}</span>
                    <span className="text-term-directory">:~$</span>
                </span>
            </div>

            {/* Terminal body */}
            <div className="flex min-h-[220px] flex-col gap-1.5 p-4 font-mono text-xs text-text-primary sm:text-sm">
                {lines.map((line) => (
                    <HeroLineView
                        key={line.id}
                        line={line}
                        roleIndex={roleIndex}
                    />
                ))}

                {/* Active typing line with blinking cursor */}
                {typing !== "" && (
                    <div className="flex items-baseline gap-1.5">
                        <span className="select-none text-term-prompt">$</span>
                        <span className="whitespace-pre-wrap break-words">
                            {typing}
                            <span
                                className="ml-px inline-block h-[1.1em] w-[0.55ch] translate-y-[0.15em] bg-term-cursor animate-cursor-blink"
                                aria-hidden="true"
                            />
                        </span>
                    </div>
                )}

                {/* Idle prompt cursor (between commands / before first type) */}
                {typing === "" && lines.length >= 0 && (
                    <div className="flex items-baseline gap-1.5">
                        <span className="select-none text-term-prompt">$</span>
                        <span
                            className="inline-block h-[1.1em] w-[0.55ch] translate-y-[0.15em] bg-term-cursor animate-cursor-blink"
                            aria-hidden="true"
                        />
                    </div>
                )}
            </div>

            {/* Visually-hidden live region: announces the active role for SRs. */}
            <span className="sr-only" aria-live="polite" id={liveId}>
                {HERO_ROLES[roleIndex]}
            </span>
        </div>
    );
}

interface HeroLineViewProps {
    line: HeroLine;
    roleIndex: number;
}

/** Renders a single committed hero terminal line by kind. */
function HeroLineView({ line, roleIndex }: HeroLineViewProps) {
    if (line.kind === "command") {
        return (
            <div className="flex items-baseline gap-1.5">
                <span className="select-none text-term-prompt">$</span>
                <span className="whitespace-pre-wrap break-words text-term-command">
                    {line.text}
                </span>
            </div>
        );
    }

    if (line.kind === "output") {
        return (
            <div className="whitespace-pre-wrap break-words pl-3 text-term-value">
                {line.text}
            </div>
        );
    }

    // role line — cycling identity in accent
    return (
        <div className="flex items-baseline gap-1.5 pl-3">
            <span className="select-none text-text-tertiary">›</span>
            <span className="font-semibold text-accent-solid">
                {HERO_ROLES[roleIndex]}
            </span>
        </div>
    );
}

HeroTerminal.displayName = "HeroTerminal";
