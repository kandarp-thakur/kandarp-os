import type { Metadata } from "next";

import { ContactForm } from "@features/contact/components/ContactForm";
import { ContactTerminal } from "@features/contact/components/ContactTerminal";
import { ConnectLinks } from "@features/contact/components/ConnectLinks";
import { getSiteConfig } from "@hooks/useSiteConfig";
import { resolveContactLinks } from "@/lib/contactLinks";

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
    const contactLinks = resolveContactLinks(config);
    const commandHints = [
        "help",
        ...contactLinks.map((link) => link.command),
        "clear",
    ];

    return (
        <main className="relative isolate z-20 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-16 sm:px-6">
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
            <ContactTerminal socials={contactLinks} owner={config.owner} />

            {/* Visible, clickable connect channels — a single-click
                companion to the terminal for visitors who don't know to
                type `github`, `email`, etc. */}
            <ConnectLinks socials={contactLinks} className="mt-8" />

            <ContactForm />

            {/* Quick command hints */}
            <p className="mt-6 max-w-3xl font-mono text-xs text-text-tertiary">
                Try:{" "}
                {commandHints.map((command, index) => (
                    <span key={command}>
                        {index > 0 ? " · " : null}
                        <span className="text-text-secondary">{command}</span>
                    </span>
                ))}
            </p>
        </main>
    );
}
