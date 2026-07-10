import Link from "next/link";

import { PageContainer } from "@/components/layout";
import { ROUTES, SITE } from "@/utils/constants";
import { cn } from "@/utils/cn";

/**
 * 404 Layout — the not-found page (folder-structure §4.1).
 *
 * Rendered when no route matches, or when a segment's `notFound()` is thrown.
 * Terminal-native: a "command not found" readout with a clear path home. A
 * Server Component — static markup, no interactivity.
 *
 * Sits inside [`AppShell`](../components/layout/AppShell.tsx), so the navbar +
 * footer remain available for recovery navigation.
 */
export default function NotFound() {
    return (
        <PageContainer maxWidth="md" className="flex-1 py-24">
            <div className="flex flex-col items-center gap-6 text-center">
                <p className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                    {"// 404"}
                </p>

                <h1 className="text-display-lg font-bold tracking-tight text-text-primary">
                    404
                </h1>

                <p className="max-w-md font-mono text-sm text-text-secondary">
                    <span className="text-text-tertiary">$</span>{" "}
                    <span className="text-text-secondary">cd</span>{" "}
                    <span className="text-accent-solid">{SITE.userAtHost}</span>
                    <span className="text-text-tertiary">/unknown</span>
                    <br />
                    <span className="text-error">command not found</span> — this
                    route does not exist.
                </p>

                <Link
                    href={ROUTES.home}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-md px-4 py-2",
                        "font-sans text-sm font-medium text-text-inverse",
                        "bg-accent-gradient shadow-glow-sm",
                        "transition-colors duration-fast ease-standard hover:opacity-90",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    )}
                >
                    Return home
                </Link>
            </div>
        </PageContainer>
    );
}
