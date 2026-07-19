import type { Metadata } from "next";

import { JournalStream } from "@features/blog/components/JournalStream";
import { PageHeader } from "@features/shared/components/PageHeader";
import { StatPills } from "@features/shared/components/StatPills";
import {
    getPublicBlogPostMetas,
    getPublicBlogTags,
    getPublicBlogUnits,
    getPublicBlogWordCount,
} from "@backend/services/public-data";
import { blogHeading, blogIntro } from "@/lib/blogSummary";
import { formatWordCount } from "@/data/blog";
import { SITE } from "@utils/constants";
import type { BlogUnit } from "@packages/types/blog";

export const metadata: Metadata = {
    title: "Journal",
    description: `Engineering journal by ${SITE.owner} — DevOps, Docker, Linux, networking, AWS, Python, career, and research posts.`,
    openGraph: {
        title: `Engineering Journal by ${SITE.name}`,
        description:
            "A systemd journal of engineering writing — every post an entry, every category a unit.",
    },
};

/** Value color per journal-stat key (blog-page-design §2.3). */
const STAT_VALUE_COLOR: Record<string, string> = {
    entries: "text-text-primary",
    units: "text-accent-solid",
    tags: "text-info",
    words: "text-success",
};

export default async function BlogPage() {
    const [posts, blogUnits, tags, wordCount] = await Promise.all([
        getPublicBlogPostMetas(),
        getPublicBlogUnits(),
        getPublicBlogTags(),
        getPublicBlogWordCount(),
    ]);

    const units = blogUnits.map(({ unit, count }) => ({
        unit: unit as BlogUnit,
        count,
    }));

    const stats = [
        { key: "entries", label: "Entries", value: String(posts.length) },
        { key: "units", label: "Units", value: String(units.length) },
        { key: "tags", label: "Tags", value: String(tags.length) },
        { key: "words", label: "Words", value: formatWordCount(wordCount) },
    ];

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-16 sm:px-6">
            {/* Page header — eyebrow + title + command subtitle (§2). */}
            <PageHeader
                eyebrow="// JOURNAL"
                title="Engineering Journal"
                command="journalctl --reverse"
                className="mb-8"
            />

            {/* Journal stats — glass pills (§2.3). */}
            <StatPills
                stats={stats}
                colorByKey={STAT_VALUE_COLOR}
                className="mb-6"
            />

            {/* The journal stream — the primary content block (§3–§5). */}
            <JournalStream
                posts={posts}
                units={units}
                tags={tags}
                className="w-full"
            />

            {/* Hint — entries are clickable. */}
            <p className="mt-10 max-w-3xl font-mono text-xs text-text-tertiary">
                Click an entry to read the full post — the entry{"'"}s complete
                message body. Filter by unit, tag, or grep to narrow the journal
                the way an operator filters log entries.
            </p>

            {/* Screen-reader-only semantic section (a11y + SEO, §21.1). */}
            <section className="sr-only">
                <h2>{blogHeading()}</h2>
                <p>{blogIntro()}</p>
                <ol>
                    {posts.map((post) => (
                        <li key={post.slug}>
                            <h3>{post.title}</h3>
                            <p>
                                Published {post.date}. Unit: {post.unit}.{" "}
                                Priority: {post.priority}. Reading time:{" "}
                                {post.readingTime} minutes. {post.excerpt}
                            </p>
                            <p>
                                Tags: {post.tags.map((t) => `#${t}`).join(", ")}
                                .
                            </p>
                        </li>
                    ))}
                </ol>
            </section>
        </main>
    );
}
