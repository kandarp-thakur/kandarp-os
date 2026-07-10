"use client";

import { useCallback, useEffect, useRef } from "react";

import type { AnalyticsEvent } from "@/lib/admin/types";

/**
 * Analytics beacon — a reusable client hook that sends analytics events to the
 * public `/api/admin/analytics` ingest endpoint.
 *
 * The POST endpoint is intentionally unauthenticated (no auth required) so the
 * public site can fire beacons without a session. Events are sent via
 * `navigator.sendBeacon` when available (non-blocking, survives page unload)
 * and fall back to `fetch` with `keepalive: true`.
 *
 * Usage:
 *   const { track } = useAnalyticsBeacon();
 *   track("project_click", { meta: { slug: "self-hosted-server" } });
 *
 * The hook also auto-fires a `pageview` event on mount (once per mount) and
 * tracks the session duration, sending a `pageview` with `duration` on unload.
 */

/** The event types the beacon supports (mirrors AnalyticsEvent["type"]). */
export type BeaconEventType = AnalyticsEvent["type"];

/** Options for a single beacon event. */
export interface BeaconOptions {
    /** The page path (defaults to `window.location.pathname`). */
    path?: string;
    /** The referrer (defaults to `document.referrer`). */
    referrer?: string;
    /** The device type (auto-detected: desktop/mobile/tablet). */
    device?: "desktop" | "mobile" | "tablet";
    /** The browser name (auto-detected from user agent). */
    browser?: string;
    /** The session duration in seconds (for pageview unload events). */
    duration?: number;
    /** Arbitrary metadata (e.g. slug, tag, search query). */
    meta?: Record<string, unknown>;
}

/** Detect the device type from the user agent. */
function detectDevice(): "desktop" | "mobile" | "tablet" {
    if (typeof navigator === "undefined") return "desktop";
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|tablet/.test(ua)) return "tablet";
    if (/mobi|android|iphone/.test(ua)) return "mobile";
    return "desktop";
}

/** Detect the browser name from the user agent. */
function detectBrowser(): string {
    if (typeof navigator === "undefined") return "";
    const ua = navigator.userAgent;
    if (ua.includes("Firefox/")) return "Firefox";
    if (ua.includes("Edg/")) return "Edge";
    if (ua.includes("Chrome/")) return "Chrome";
    if (ua.includes("Safari/")) return "Safari";
    return "";
}

/** The ingest endpoint — public, no auth required. */
const ENDPOINT = "/api/admin/analytics";

export interface UseAnalyticsBeacon {
    /** Track a single event. Fire-and-forget; never throws. */
    track: (type: BeaconEventType, options?: BeaconOptions) => void;
}

/**
 * Analytics beacon hook. Sends events to the ingest endpoint via
 * `navigator.sendBeacon` (or `fetch` fallback). Auto-fires a `pageview` on
 * mount and tracks session duration for the unload beacon.
 */
export function useAnalyticsBeacon(): UseAnalyticsBeacon {
    const mountTime = useRef<number>(Date.now());
    const hasFiredPageview = useRef(false);

    const track = useCallback(
        (type: BeaconEventType, options: BeaconOptions = {}) => {
            if (typeof window === "undefined") return;

            const payload = {
                type,
                path: options.path ?? window.location.pathname,
                referrer: options.referrer ?? document.referrer,
                country: "", // resolved server-side if needed
                device: options.device ?? detectDevice(),
                browser: options.browser ?? detectBrowser(),
                duration: options.duration ?? 0,
                meta: options.meta ?? {},
            };

            const body = JSON.stringify(payload);

            // Prefer sendBeacon (non-blocking, survives page unload).
            if (
                typeof navigator !== "undefined" &&
                typeof navigator.sendBeacon === "function"
            ) {
                try {
                    const blob = new Blob([body], {
                        type: "application/json",
                    });
                    if (navigator.sendBeacon(ENDPOINT, blob)) return;
                } catch {
                    // Fall through to fetch.
                }
            }

            // Fallback: fetch with keepalive so it survives page unload.
            try {
                void fetch(ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body,
                    keepalive: true,
                });
            } catch {
                // Swallow — analytics must never break the UX.
            }
        },
        [],
    );

    // Auto-fire a pageview on mount (once per mount).
    useEffect(() => {
        if (hasFiredPageview.current) return;
        hasFiredPageview.current = true;
        mountTime.current = Date.now();
        track("pageview");
    }, [track]);

    // Fire a pageview with duration on page unload (session end).
    useEffect(() => {
        const onUnload = () => {
            const duration = Math.round(
                (Date.now() - mountTime.current) / 1000,
            );
            track("pageview", { duration });
        };

        // `pagehide` fires on both navigation and tab close (more reliable than
        // `beforeunload` on mobile).
        window.addEventListener("pagehide", onUnload);
        return () => window.removeEventListener("pagehide", onUnload);
    }, [track]);

    return { track };
}
