import type { MetadataRoute } from "next";

import { getAllPosts, getAllTags } from "@/lib/blog";
import {
    getPublicBlogPostMetas,
    getPublicBlogTags,
} from "@backend/services/public-data";
import { getSiteConfig } from "@hooks/useSiteConfig";
import { ROUTES } from "@utils/constants";

/**
 * Dynamic sitemap (Next.js Metadata API).
 *
 * Emits `/sitemap.xml` with every indexable route:
 *   • the single home page (`/`) — which contains all sections as
 *     anchored regions (whoami, deployments, containers, infrastructure,
 *     toolkit, achievements, logs, ssh) rather than separate routes.
 *   • the blog index (`/blog`) + tag index (`/blog/tags`)
 *   • every published blog post (`/blog/[slug]`)
 *   • every used tag (`/blog/tags/[tag]`)
 *
 * Posts and tags are resolved from the CMS store (with MDX fallback), so
 * new posts created in the admin console appear in the sitemap after the
 * next revalidation. The base URL comes from the CMS site config.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const config = await getSiteConfig();
    const base = config.url.replace(/\/$/, "");
    const now = new Date();

    // Resolve posts + tags from the CMS (falls back to MDX files).
    const [cmsPosts, cmsTags, mdxPosts, mdxTags] = await Promise.all([
        getPublicBlogPostMetas(),
        getPublicBlogTags(),
        Promise.resolve(getAllPosts()),
        Promise.resolve(getAllTags()),
    ]);

    // Merge CMS + MDX posts, deduplicating by slug.
    const seenSlugs = new Set<string>();
    const allPosts = [...cmsPosts, ...mdxPosts].filter((p) => {
        if (seenSlugs.has(p.slug)) return false;
        seenSlugs.add(p.slug);
        return true;
    });

    // Merge CMS + MDX tags, deduplicating by tag name.
    const seenTags = new Set<string>();
    const allTags = [...cmsTags, ...mdxTags].filter(({ tag }) => {
        if (seenTags.has(tag)) return false;
        seenTags.add(tag);
        return true;
    });

    // The blog index's last-modified is the newest post date (or now).
    const newest = allPosts[0];
    const blogLastModified = newest ? new Date(newest.date) : now;

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${base}${ROUTES.home}`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 1,
        },
        {
            url: `${base}${ROUTES.blog}`,
            lastModified: blogLastModified,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${base}${ROUTES.blog}/tags`,
            lastModified: blogLastModified,
            changeFrequency: "weekly",
            priority: 0.6,
        },
    ];

    const postRoutes: MetadataRoute.Sitemap = allPosts.map((post) => ({
        url: `${base}${ROUTES.blog}/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.7,
    }));

    const tagRoutes: MetadataRoute.Sitemap = allTags.map(({ tag }) => ({
        url: `${base}${ROUTES.blog}/tags/${tag}`,
        lastModified: blogLastModified,
        changeFrequency: "weekly",
        priority: 0.5,
    }));

    return [...staticRoutes, ...postRoutes, ...tagRoutes];
}
