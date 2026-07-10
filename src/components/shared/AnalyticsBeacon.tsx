"use client";

import { useAnalyticsBeacon } from "@/hooks/useAnalyticsBeacon";

/**
 * AnalyticsBeacon — an invisible client component that mounts the analytics
 * beacon hook in the root layout.
 *
 * Renders nothing. Its sole purpose is to activate the `useAnalyticsBeacon`
 * hook (which auto-fires a `pageview` on mount and a duration beacon on
 * unload) so every public route gets analytics tracking without each page
 * having to wire it up individually.
 *
 * Place it once in the root layout's `<Providers>` tree (after the background
 * components, before `AppShell`).
 */
export function AnalyticsBeacon() {
    useAnalyticsBeacon();
    return null;
}
