"use client";

import { useState, type ReactNode } from "react";

import { CopyButton } from "@features/shared/components/CopyButton";
import { cn } from "@utils/cn";

interface CodeBlockProps {
    /** The raw code text (used for the copy button). */
    code: string;
    /** Language label, e.g. `bash`, `yaml`. */
    language?: string;
    /** Rendered code children (syntax-highlighted tokens, if any). */
    children?: ReactNode;
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * A terminal-window-styled code block (blog-page-design §14.6).
 *
 * Renders as a mini terminal: a header with macOS traffic lights + a
 * language label + a copy button, and a mono body with horizontal scroll.
 * The body is the rendered `<code>` children (so a syntax highlighter can
 * supply tokens); the copy button uses the raw `code` string.
 *
 * A Client Component because the copy button uses clipboard state.
 */
export function CodeBlock({
    code,
    language,
    children,
    className,
}: CodeBlockProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={cn(
                "glass-surface-strong my-6 overflow-hidden rounded-lg",
                "transition-shadow duration-normal ease-standard",
                hovered ? "shadow-glass-hover" : "shadow-glass",
                className,
            )}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Terminal header — traffic lights + language label + copy. */}
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2">
                <div className="flex items-center gap-2">
                    <span
                        className="h-3 w-3 rounded-full bg-traffic-close"
                        role="img"
                        aria-label="close"
                    />
                    <span
                        className="h-3 w-3 rounded-full bg-traffic-minimize"
                        role="img"
                        aria-label="minimize"
                    />
                    <span
                        className="h-3 w-3 rounded-full bg-traffic-zoom"
                        role="img"
                        aria-label="zoom"
                    />
                    {language && (
                        <span className="ml-2 font-mono text-2xs uppercase tracking-[0.1em] text-text-tertiary">
                            {language}
                        </span>
                    )}
                </div>
                <CopyButton
                    value={code}
                    label="Copy"
                    className="hover:bg-overlay-hover"
                />
            </div>

            {/* Code body — mono, horizontal scroll. */}
            <pre className="overflow-x-auto px-4 py-4">
                <code
                    className={cn(
                        "font-mono text-sm leading-relaxed text-text-primary",
                        language && `language-${language}`,
                    )}
                >
                    {children ?? code}
                </code>
            </pre>
        </div>
    );
}

CodeBlock.displayName = "CodeBlock";
