import { PageContainer } from "@/components/layout";

/**
 * Root Loading Boundary (folder-structure §4.1).
 *
 * Shown by Next.js while the route segment's server payload is in flight.
 * Renders a terminal-native "boot" placeholder inside the shell's content
 * region — no page content, just a non-intrusive skeleton consistent with the
 * OS aesthetic. A Server Component — static markup, no interactivity.
 *
 * The navbar + footer from [`AppShell`](../components/layout/AppShell.tsx)
 * remain mounted around this fallback (navigation-design §10: "Navbar
 * renders immediately; Loading state shows during initial page load").
 */
export default function Loading() {
    return (
        <PageContainer maxWidth="lg" className="flex-1 py-24">
            <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center gap-4 text-center"
            >
                {/* Blinking cursor — the terminal "boot" cue. */}
                <span
                    aria-hidden="true"
                    className="inline-block h-5 w-2 animate-cursor-blink bg-accent-solid"
                />
                <p className="font-mono text-sm text-text-tertiary">
                    Loading session…
                </p>
                <span className="sr-only">Loading content, please wait.</span>
            </div>
        </PageContainer>
    );
}
