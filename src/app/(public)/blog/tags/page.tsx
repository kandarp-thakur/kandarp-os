import type { Metadata } from "next";
import Link from "next/link";

import { TagPill } from "@features/blog/components/TagPill";
import { getPublicBlogTags } from "@backend/services/public-data";
import { tagHref } from "@/lib/blogSummary";
import { SITE } from "@utils/constants";
import { cn } from "@utils/cn";

export const metadata: Metadata = {
    title: "Tags — Journal",
    description: `All tags in ${SITE.owner}'s engineering journal — a weighted cloud of log tags.`,
    openGraph: {
        title: `Tags — ${SITE.name}`,
        description:
            "A weighted cloud of every tag in the engineering journal.",
    },
};

/**
 * Map a post count to a font-size class — the weighted cloud
 * (blog-page-design §8.3). More posts → larger text.
 */
function sizeForCount(count: number, max: number): string {
    if (max <= 1) return "text-xs";
    const ratio = count / max;
    if (ratio > 0.75) return "text-lg";
    if (ratio > 0.5) return "text-base";
    if (ratio > 0.25) return "text-sm";
    return "text-xs";
}

export default async function TagIndexPage() {
    const tags = await getPublicBlogTags();
    const maxCount =
        tags.length > 0 ? Math.max(...tags.map((t) => t.count)) : 1;

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-16 sm:px-6">
            {/* Page header. */}
            <header className="mb-8 w-full max-w-3xl">
                <p className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                    {"// TAGS"}
                </p>
                <h1 className="mt-2 text-h1 font-bold tracking-tight text-text-primary">
                    Tag Index
                </h1>
                <p className="mt-3 font-mono text-sm text-text-secondary">
                    <span className="text-text-tertiary">$</span>{" "}
                    <span className="text-text-secondary">
                        journalctl --list-tags
                    </span>
                </p>
            </header>

            {/* Back link. */}
            <Link
                href="/blog"
                className="mb-6 inline-flex w-fit items-center font-mono text-sm text-text-tertiary transition-colors duration-fast ease-standard hover:text-accent-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
                ← journalctl
            </Link>

            {/* Weighted tag cloud (§8.3). */}
            {tags.length === 0 ? (
                <div className="glass-surface rounded-xl px-5 py-10 text-center">
                    <p className="font-mono text-sm text-text-tertiary">
                        No tags yet.
                    </p>
                </div>
            ) : (
                <div className="glass-surface rounded-2xl p-6">
                    <ul className="flex flex-wrap items-center justify-center gap-2">
                        {tags.map(({ tag, count }) => (
                            <li
                                key={tag}
                                className="inline-flex items-center gap-1.5"
                            >
                                <TagPill
                                    tag={tag}
                                    href={tagHref(tag)}
                                    className={cn(
                                        sizeForCount(count, maxCount),
                                        "font-medium",
                                    )}
                                />
                                <span className="font-mono text-2xs text-text-quaternary">
                                    {count}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </main>
    );
}
