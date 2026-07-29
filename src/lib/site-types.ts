/**
 * Frontend-only shared site types.
 *
 * These are the lightweight view-model types the public site consumes for
 * navigation, socials, footer, and analytics. In the previous full-stack
 * architecture these lived in the admin domain schema
 * (`@backend/schemas/types`); for the frontend-only rebuild they are defined
 * here so the public chrome (navbar, footer, hero, layout) has a single,
 * dependency-free source of truth.
 *
 * Phase 2 (Admin Panel) will reintroduce the full CMS entity schemas; until
 * then the public site reads its content from the hardcoded `src/data/*.ts`
 * seed files via `src/lib/public-data.ts`.
 */

/** A single navigation entry. */
export interface NavItem {
    id: string;
    label: string;
    href: string;
    /** Lucide icon name (resolved to a component at render time). */
    icon?: string;
    visible?: boolean;
    external?: boolean;
    /** Nested dropdown items. */
    children?: NavItem[];
}

/** A social / contact link. */
export interface SocialLink {
    id: string;
    platform: string;
    url: string;
    icon?: string;
    label?: string;
}

/** A footer column with its links. */
export interface FooterColumn {
    id: string;
    title: string;
    links: { id: string; label: string; href: string; external?: boolean }[];
}

/** A website-builder section visibility/order entry. */
export interface SectionConfig {
    type: string;
    visible: boolean;
    order: number;
}

/** Analytics event shape (kept for the beacon hook contract). */
export interface AnalyticsEvent {
    id: string;
    type:
        | "pageview"
        | "click"
        | "project_click"
        | "blog_click"
        | "social_click"
        | "search"
        | "custom";
    path?: string;
    referrer?: string;
    device?: "desktop" | "mobile" | "tablet";
    browser?: string;
    duration?: number;
    meta?: Record<string, unknown>;
    createdAt: string;
}
