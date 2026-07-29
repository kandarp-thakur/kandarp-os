"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { cn } from "@utils/cn";

interface SectionErrorBoundaryProps {
    /** The section subtree to guard. */
    children: ReactNode;
    /** Human-readable label for the section (used in the fallback UI + logs). */
    label?: string;
    /** Extra classes on the fallback wrapper (escape hatch). */
    className?: string;
}

interface SectionErrorBoundaryState {
    /** The captured error, or `null` when the subtree is healthy. */
    error: Error | null;
}

/**
 * SectionErrorBoundary — a per-section React error boundary
 * (component-rules §10.2, Phase 6 of the homepage resilience spec).
 *
 * WHY THIS EXISTS
 * ---------------
 * The homepage renders many independent sections (Hero, Projects, Experience,
 * Toolkit, Infrastructure, Achievements, Logs, Contact). Before this boundary,
 * a single section throwing during client hydration/render propagated up to the
 * route-level [`error.tsx`](../../../app/error.tsx) — which replaces the ENTIRE
 * route segment with the "kernel panic" fallback. That meant one failing
 * section (e.g. a Three.js canvas, a framer-motion hydration mismatch, or a
 * malformed data prop) blanked the whole page after the Hero.
 *
 * THE FIX
 * -------
 * Each homepage section is wrapped in its own `SectionErrorBoundary`. If a
 * section throws, only THAT section renders a compact inline fallback; every
 * other section keeps rendering. The navbar, hero, footer, and all sibling
 * sections remain fully visible + scrollable.
 *
 * This is a Client Component because React error boundaries require a class
 * component with `getDerivedStateFromError` / `componentDidCatch`, which only
 * run on the client. It is safe to wrap Server Component output — the boundary
 * itself is a Client Component, but its `children` can be server-rendered.
 *
 * The fallback is intentionally minimal + on-brand (terminal aesthetic) so it
 * never looks broken to a visitor — just an empty section with a quiet status
 * line. The full error is logged to the console in dev for debugging.
 */
export class SectionErrorBoundary extends Component<
    SectionErrorBoundaryProps,
    SectionErrorBoundaryState
> {
    override state: SectionErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
        // Update state so the next render shows the fallback UI.
        return { error };
    }

    override componentDidCatch(error: Error, info: ErrorInfo): void {
        // Surface the stack in dev so the failing section is debuggable.
        // eslint-disable-next-line no-console
        console.error(
            `[SectionErrorBoundary${
                this.props.label ? `: ${this.props.label}` : ""
            }] section failed to render:`,
            error,
            info.componentStack,
        );
    }

    override render(): ReactNode {
        const { error } = this.state;
        const { children, label, className } = this.props;

        if (!error) {
            return children;
        }

        // Compact, on-brand fallback. Keeps the section's place in the document
        // flow (so scroll position + navbar scroll-spy anchors stay valid) but
        // renders no broken content. Visitors see a quiet "section unavailable"
        // status line instead of a blank page.
        return (
            <div
                role="alert"
                aria-live="polite"
                className={cn(
                    "flex flex-col items-center gap-2 py-16 text-center",
                    className,
                )}
            >
                <p className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                    {`// ${label ?? "SECTION"} UNAVAILABLE`}
                </p>
                <p className="font-mono text-sm text-text-tertiary">
                    This section could not be loaded. The rest of the page is
                    unaffected.
                </p>
            </div>
        );
    }
}

// NOTE: `displayName` is omitted — class components already expose their name
// via `SectionErrorBoundary.name` for React DevTools.
