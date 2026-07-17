import type { Metadata } from "next";

import { ContactTerminal } from "@/components/sections/ContactTerminal";
import { ConnectLinks } from "@/components/sections/ConnectLinks";
import { getSiteConfig } from "@/hooks/useSiteConfig";

export async function generateMetadata(): Promise<Metadata> {
    const config = await getSiteConfig();
    return {
        title: "Contact",
        description: `Open an SSH session to ${config.userAtHost}. Type a command to reach out — resume, github, email, or linkedin.`,
        openGraph: {
            title: `Contact — ${config.name}`,
            description: `SSH into ${config.userAtHost} and run a command to connect.`,
        },
    };
}

export default async function ContactPage() {
    const config = await getSiteConfig();

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-16 sm:px-6">
            {/* Page header — eyebrow + title, terminal-native */}
            <header className="mb-10 w-full max-w-3xl">
                <p className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                    {"// CONTACT"}
                </p>
                <h1 className="mt-2 text-h1 font-bold tracking-tight text-text-primary">
                    Open a session
                </h1>
                <p className="mt-3 font-mono text-sm text-text-secondary">
                    ssh {config.userAtHost} — type{" "}
                    <span className="text-accent-solid">help</span> to list
                    commands.
                </p>
            </header>

            {/* The interactive terminal */}
            <ContactTerminal />

            {/* Visible, clickable connect channels — a single-click
                companion to the terminal for visitors who don't know to
                type `github`, `email`, etc. */}
            <ConnectLinks className="mt-8" />

            {/* Quick command hints */}
            <p className="mt-6 max-w-3xl font-mono text-xs text-text-tertiary">
                Try: <span className="text-text-secondary">help</span> ·{" "}
                <span className="text-text-secondary">resume</span> ·{" "}
                <span className="text-text-secondary">github</span> ·{" "}
                <span className="text-text-secondary">email</span> ·{" "}
                <span className="text-text-secondary">phone</span> ·{" "}
                <span className="text-text-secondary">linkedin</span> ·{" "}
                <span className="text-text-secondary">hackerrank</span> ·{" "}
                <span className="text-text-secondary">youtube</span> ·{" "}
                <span className="text-text-secondary">clear</span>
            </p>
        </main>
    );
}
