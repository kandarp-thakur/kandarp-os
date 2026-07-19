import { unstable_cache } from "next/cache";

import {
    getPublicSiteIdentity,
    type PublicSiteIdentity,
} from "@backend/services/public-data";
import { PUBLIC_TAGS } from "@backend/cache/revalidate";

/**
 * Site config — a reusable, ISR-cached server helper for the resolved site
 * identity (Settings + Profile merged into the shape the public site
 * consumes).
 *
 * This is the single function the root layout, navbar, footer, logo, and hero
 * call to get "who am I, what's my name, what links do I show." It wraps
 * `getPublicSiteIdentity` in `unstable_cache` with the `public:settings` +
 * `public:profile` tags so a single `revalidateTag` purges every consumer when
 * settings or profile are edited in the admin console.
 *
 * The cache key is stable ("site-identity") so all callers share the same
 * cached value — no duplicate reads, no duplicate API calls.
 */

/** The stable cache key — all callers share one cached identity. */
const CACHE_KEY = "site-identity";

/** The ISR tags that, when invalidated, purge this cache. */
const CACHE_TAGS = [PUBLIC_TAGS.settings, PUBLIC_TAGS.profiles];

/**
 * Fetch the resolved site identity, cached with ISR tags. Every public chrome
 * component (layout, navbar, footer, logo, hero) should call this instead of
 * `getPublicSiteIdentity` directly so they share the same cached read and
 * revalidate together when settings/profile change.
 */
export const getSiteConfig: () => Promise<PublicSiteIdentity> = unstable_cache(
    async () => getPublicSiteIdentity(),
    CACHE_TAGS.length ? [CACHE_KEY] : [CACHE_KEY],
    {
        tags: CACHE_TAGS,
    },
);
