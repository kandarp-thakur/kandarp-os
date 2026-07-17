import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MdxContent } from "@/components/blog/MdxContent";
import { PostPager } from "@/components/blog/PostPager";
import { PriorityDot } from "@/components/blog/PriorityDot";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { RelatedEntries } from "@/components/blog/RelatedEntries";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { TagPill } from "@/components/blog/TagPill";
import { UnitChip } from "@/components/blog/UnitChip";
import {
    getPublicBlogPostBySlug,
    getPublicBlogPostNeighbors,
    getPublicBlogPosts,
    getPublicRelatedPosts,
} from "@/lib/admin/public-data";
import { getAllPosts } from "@/lib/blog";
import {
    formatJournalDate,
    formatReadingTime,
    tagHref,
} from "@/lib/blogSummary";
import { SITE } from "@/utils/constants";
import { cn } from "@/utils/cn";

/**
 * Pre-render every post at build time. Combines CMS store posts with MDX
 * file posts so both sources are covered. The MDX `getAllPosts()` is
 * synchronous (file-system read), while the CMS `getPublicBlogPosts()` is
 * async (store read). We merge the slug lists to cover both.
 */
export async function generateStaticParams() {
    const mdxPosts = getAllPosts().map((post) => ({ slug: post.slug }));
    const cmsPosts = await getPublicBlogPosts();
    const cmsSlugs = cmsPosts.map((post) => ({ slug: post.slug }));
    // Deduplicate by slug (a post may exist in both sources).
    const seen = new Set<string>();
    const all = [...mdxPosts, ...cmsSlugs].filter(({ slug }) => {
        if (seen.has(slug)) return false;
        seen.add(slug);
        return true;
    });
    return all;
}

/** Per-post SEO metadata (§22.2). */
type BlogPostPageProps = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({
    params,
}: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPublicBlogPostBySlug(slug);
    if (!post) return {};

    return {
        title: `${post.title} — ${SITE.name}`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: "article",
            publishedTime: post.date,
            tags: post.tags,
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = await getPublicBlogPostBySlug(slug);
    if (!post) notFound();

    const { previous, next } = await getPublicBlogPostNeighbors(post.slug);
    const related = await getPublicRelatedPosts(post.slug, 3);
    const isFeatured = post.priority === "notice";
    const hasToc = post.headings.length >= 3;

    return (
        <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-16 sm:px-6">
            {/* Reading progress bar (§14.8). */}
            <ReadingProgress />

            {/* Back link (§12.2). */}
            <Link
                href="/blog"
                className="mb-6 inline-flex w-fit items-center font-mono text-sm text-text-tertiary transition-colors duration-fast ease-standard hover:text-accent-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
                ← journalctl
            </Link>

            {/* Post header (§12). */}
            <header
                className={cn(
                    "glass-surface mb-8 rounded-2xl p-6",
                    isFeatured && "border-l-[3px] border-l-accent-solid",
                )}
            >
                {/* Metadata row — journalctl-style (§12.2). */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-text-tertiary">
                    <time dateTime={post.date}>
                        {formatJournalDate(post.date)}
                    </time>
                    <span aria-hidden="true">·</span>
                    <UnitChip unit={post.unit} pid={post.pid} href="/blog" />
                    <span aria-hidden="true">·</span>
                    <PriorityDot priority={post.priority} />
                    <span aria-hidden="true">·</span>
                    <span>{formatReadingTime(post.readingTime)}</span>
                </div>

                {/* Title (§12.2). */}
                <h1 className="mt-3 text-h1 font-bold tracking-tight text-text-primary">
                    {post.title}
                </h1>

                {/* Tags (§12.2). */}
                <ul className="mt-3 flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                        <li key={tag}>
                            <TagPill tag={tag} href={tagHref(tag)} />
                        </li>
                    ))}
                </ul>
            </header>

            {/* Two-column: sticky TOC + content (§11.3). */}
            <div
                className={cn(
                    "grid gap-8",
                    hasToc
                        ? "lg:grid-cols-[240px_minmax(0,1fr)]"
                        : "grid-cols-1",
                )}
            >
                {hasToc && <TableOfContents headings={post.headings} />}

                <article>
                    <MdxContent source={post.body} />
                </article>
            </div>

            {/* Related entries (§15). */}
            <RelatedEntries post={post} related={related} />

            {/* Prev / next pager (§16). */}
            <PostPager previous={previous} next={next} />

            {/* Screen-reader-only semantic section (a11y + SEO, §21.1). */}
            <section className="sr-only">
                <h2>{post.title}</h2>
                <p>
                    Published {post.date} in {post.unit}. Priority:{" "}
                    {post.priority}. Reading time: {post.readingTime} minutes.
                </p>
                <p>{post.excerpt}</p>
                <p>Tags: {post.tags.map((t) => `#${t}`).join(", ")}.</p>
            </section>
        </main>
    );
}
