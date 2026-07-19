"use client";

import { useEffect } from "react";

import { PageContainer } from "@features/layout/components/PageContainer";
import { SITE } from "@utils/constants";
import { cn } from "@utils/cn";

interface ErrorProps {
    /** The thrown error. */
    error: Error & { digest?: string };
    /** Next.js-provided recovery callback — re-renders the route segment. */
    reset: () => void;
}

/**
 * Root Error Boundary (folder-structure §4.1, component-rules §10.2).
 *
 * Catches unhandled errors thrown by any route segment rendered inside the
 * root layout. Renders a terminal-native "kernel panic" fallback with a
 * recovery action. Must be a Client Component (Next.js requirement) so it
 * can call the `reset` recovery handler.
 *
 * The shell (navbar + footer) stays mounted around this fallback
 * (navigation-design §10: "Navbar persists; error boundary below it").
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({ error, reset }: ErrorProps) {
    // Log to the console in dev so the stack is visible during debugging.
    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error(error);
    }, [error]);

    return (
        <PageContainer maxWidth="md" className="flex-1 py-24">
            <div
                role="alert"
                className="flex flex-col items-center gap-6 text-center"
            >
                <p className="font-mono text-2xs uppercase tracking-[0.15em] text-error">
                    {"// KERNEL PANIC"}
                </p>
                <h1 className="text-h1 font-bold tracking-tight text-text-primary">
                    Something went wrong
                </h1>
                <p className="max-w-md font-mono text-sm text-text-secondary">
                    An unexpected error occurred while rendering{" "}
                    <span className="text-accent-solid">{SITE.userAtHost}</span>
                    . You can try to recover the session.
                </p>

                <button
                    type="button"
                    onClick={reset}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-md px-4 py-2",
                        "font-sans text-sm font-medium text-text-inverse",
                        "bg-accent-gradient shadow-glow-sm",
                        "transition-colors duration-fast ease-standard hover:opacity-90",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    )}
                >
                    Retry session
                </button>
            </div>
        </PageContainer>
    );
}
