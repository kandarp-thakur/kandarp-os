import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JournalEntry } from "@/components/blog/JournalEntry";
import {
    getPublicBlogTags,
    getPublicPostsByTag,
} from "@/lib/admin/public-data";
import { getAllTags } from "@/lib/blog";
import { SITE } from "@/utils/constants";

/**
 * Pre-render every tag-filtered view at build time. Combines CMS store tags
 * with MDX file tags so both sources are covered.
 */
export async function generateStaticParams() {
    const mdxTags = getAllTags().map(({ tag }) => ({ tag }));
    const cmsTags = await getPublicBlogTags();
    const cmsTagParams = cmsTags.map(({ tag }) => ({ tag }));
    // Deduplicate by tag.
    const seen = new Set<string>();
    const all = [...mdxTags, ...cmsTagParams].filter(({ tag }) => {
        if (seen.has(tag)) return false;
        seen.add(tag);
        return true;
    });
    return all;
}

/** Per-tag SEO metadata. */
export async function generateMetadata({
    params,
}: {
    params: { tag: string };
}): Promise<Metadata> {
    const posts = await getPublicPostsByTag(params.tag);
    if (posts.length === 0) return {};

    return {
        title: `#${params.tag} — Journal`,
        description: `Entries tagged #${params.tag} in ${SITE.owner}'s engineering journal.`,
        openGraph: {
            title: `#${params.tag} — ${SITE.name}`,
            description: `Entries tagged #${params.tag}.`,
        },
    };
}

export default async function TagPage({
    params,
}: {
    params: { tag: string };
}) {
    const posts = await getPublicPostsByTag(params.tag);
    if (posts.length === 0) notFound();

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-16 sm:px-6">
            {/* Page header. */}
            <header className="mb-8 w-full max-w-3xl">
                <p className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                    {"// TAG"}
                </p>
                <h1 className="mt-2 text-h1 font-bold tracking-tight text-text-primary">
                    <span className="text-accent-solid">#</span>
                    {params.tag}
                </h1>
                <p className="mt-3 font-mono text-sm text-text-secondary">
                    <span className="text-text-tertiary">$</span>{" "}
                    <span className="text-text-secondary">
                        journalctl --grep {'"'}#{params.tag}
                        {'"'}
                    </span>
                </p>
            </header>

            {/* Back link. */}
            <Link
                href="/blog/tags"
                className="mb-6 inline-flex w-fit items-center font-mono text-sm text-text-tertiary transition-colors duration-fast ease-standard hover:text-accent-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
                ← tag index
            </Link>

            {/* Entry count. */}
            <p className="mb-6 font-mono text-xs text-text-tertiary">
                {posts.length} {posts.length === 1 ? "entry" : "entries"}
            </p>

            {/* Entries — a simple stream (no filter bar; the tag is the filter). */}
            <div className="glass-surface rounded-2xl p-4">
                <div className="space-y-3">
                    {posts.map((post, index) => (
                        <JournalEntry
                            key={post.slug}
                            post={post}
                            index={index}
                        />
                    ))}
                </div>
            </div>

            {/* Other tags — quick jump. */}
            <p className="mt-10 font-mono text-xs text-text-tertiary">
                Browse{" "}
                <Link
                    href="/blog/tags"
                    className="text-accent-solid transition-colors duration-fast ease-standard hover:text-accent-hover"
                >
                    all tags
                </Link>{" "}
                or return to the{" "}
                <Link
                    href="/blog"
                    className="text-accent-solid transition-colors duration-fast ease-standard hover:text-accent-hover"
                >
                    journal
                </Link>
                .
            </p>

            {/* Screen-reader-only semantic section (a11y + SEO). */}
            <section className="sr-only">
                <h2>Entries tagged #{params.tag}</h2>
                <ol>
                    {posts.map((post) => (
                        <li key={post.slug}>
                            <h3>{post.title}</h3>
                            <p>
                                Published {post.date} in {post.unit}.{" "}
                                {post.excerpt}
                            </p>
                        </li>
                    ))}
                </ol>
            </section>
        </main>
    );
}
