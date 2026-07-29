/**
 * Cache tag registry — frontend-only edition.
 *
 * In the full-stack build these tags drove Next.js ISR revalidation when the
 * admin store mutated. The frontend-only build has no admin store, so the tags
 * are inert constants kept only to satisfy the `useSiteConfig` cache wrapper's
 * type contract. They can be passed to `unstable_cache` safely (no-op when no
 * `revalidateTag` ever fires).
 */

export const PUBLIC_TAGS = {
    settings: "public:settings",
    profiles: "public:profiles",
    projects: "public:projects",
    experience: "public:experience",
    skills: "public:skills",
    infra: "public:infra",
    awards: "public:awards",
    blog: "public:blog",
    siteCustomization: "public:site-customization",
} as const;
