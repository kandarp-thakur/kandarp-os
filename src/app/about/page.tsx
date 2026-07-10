import type { Metadata } from "next";

import { AboutTerminal } from "@/components/sections/AboutTerminal";
import { getSiteConfig } from "@/hooks/useSiteConfig";

export async function generateMetadata(): Promise<Metadata> {
    const config = await getSiteConfig();
    return {
        title: "About",
        description: `System information for ${config.userAtHost} — education, mission, and goals, rendered as a terminal session.`,
        openGraph: {
            title: `About — ${config.name}`,
            description: `Runtime details for ${config.userAtHost}. Education, mission, and goals as system readout.`,
        },
    };
}

export default async function AboutPage() {
    const config = await getSiteConfig();

    return (
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-12 sm:px-6 sm:py-16">
            {/* Page header — eyebrow + title, terminal-native. */}
            <header className="mb-10 w-full">
                <p className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                    {"// ABOUT"}
                </p>
                <h1 className="mt-2 text-h1 font-bold tracking-tight text-text-primary">
                    System Information
                </h1>
                <p className="mt-3 max-w-xl font-mono text-sm text-text-secondary">
                    Runtime details for{" "}
                    <span className="text-accent-solid">
                        {config.userAtHost}
                    </span>{" "}
                    — a live terminal session, not a bio.
                </p>
            </header>

            {/* One premium developer terminal — wide and short, centered.
                The terminal IS the content: a single continuous session with
                its own internal scrollbar. No companion column, no cards, no
                widgets — just a real coding terminal. */}
            <div className="mx-auto w-full max-w-5xl">
                <AboutTerminal />
            </div>

            {/* Hint — the session is copyable. */}
            <p className="mt-8 text-center font-mono text-xs text-text-tertiary">
                Scroll the terminal to boot the session. Use{" "}
                <span className="text-text-secondary">Copy</span> to share the
                readout.
            </p>
        </main>
    );
}
