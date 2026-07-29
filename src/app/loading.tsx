import { PageContainer } from "@features/layout/components";

/**
 * Root Loading Boundary (folder-structure §4.1).
 *
 * Shown by Next.js while a route segment's server payload is in flight.
 * Renders a modern, minimal loader inside the shell's content region — a
 * spinning accent ring + wordmark — consistent with the OS boot aesthetic.
 * A Server Component — static markup, no interactivity.
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
                className="flex flex-col items-center gap-6 text-center"
            >
                {/* Spinning accent ring with centered monogram. */}
                <div className="relative flex h-16 w-16 items-center justify-center">
                    <span
                        className="absolute inset-0 rounded-full border-2 border-white/10 border-t-accent-solid"
                        style={{
                            animation: "boot-spin 0.9s linear infinite",
                        }}
                    />
                    <span className="bg-accent-gradient bg-clip-text font-sans text-xl font-bold text-transparent">
                        K
                    </span>
                </div>

                <p className="font-mono text-sm text-text-tertiary">
                    Loading session…
                </p>
                <span className="sr-only">Loading content, please wait.</span>
            </div>

            {/* Keyframes for the inline spinner (scoped to this boundary). */}
            <style>{`@keyframes boot-spin { to { transform: rotate(360deg); } }`}</style>
        </PageContainer>
    );
}
