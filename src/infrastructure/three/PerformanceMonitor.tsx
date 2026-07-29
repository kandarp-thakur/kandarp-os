"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

interface PerformanceMonitorProps {
    /** FPS below this triggers a decline (arch §11). Default 30. */
    declineThreshold?: number;
    /** FPS above this triggers an incline. Default 50. */
    inclineThreshold?: number;
    /** Sustained low FPS before declining (ms). Default 2000. */
    declineDuration?: number;
    /** Sustained high FPS before inclining (ms). Default 2000. */
    inclineDuration?: number;
    /** Called once when FPS drops below the threshold for the decline duration. */
    onDecline?: () => void;
    /** Called once when FPS recovers above the threshold for the incline duration. */
    onIncline?: () => void;
    /** Enable monitoring. Default `true`. */
    enabled?: boolean;
}

/**
 * The performance monitor (arch §11, component inventory 3D #25). Measures
 * frame rate inside the R3F loop and reports sustained declines/inclines so
 * the host can adjust the device tier at runtime (arch §11 detection strategy
 * #5: "if < 30 for 2s, downgrade tier").
 *
 * FPS is smoothed with an exponential moving average to absorb single-frame
 * spikes. Hysteresis prevents oscillation: a decline fires once, then the
 * monitor waits for a sustained incline before firing recovery. Frames with an
 * abnormally large delta (e.g. returning from a backgrounded tab) are skipped
 * so they don't trigger false declines.
 *
 * Renders nothing — it is a frame-loop side effect only.
 *
 * @example
 * ```tsx
 * <PerformanceMonitor onDecline={downgradeTier} onIncline={upgradeTier} />
 * ```
 */
export function PerformanceMonitor({
    declineThreshold = 30,
    inclineThreshold = 50,
    declineDuration = 2000,
    inclineDuration = 2000,
    onDecline,
    onIncline,
    enabled = true,
}: PerformanceMonitorProps) {
    const ewmaRef = useRef(60);
    const ewmaInitRef = useRef(false);
    const declineStartRef = useRef<number | null>(null);
    const inclineStartRef = useRef<number | null>(null);
    const declinedRef = useRef(false);

    useFrame((_, delta) => {
        if (!enabled) return;

        // Skip abnormally long frames (tab was backgrounded, etc.) so a pause
        // never reads as a sustained decline.
        if (delta > 0.25) return;

        const fps = 1 / Math.max(delta, 0.001);

        // Seed the EWMA with the first sample so it doesn't ramp up from 0.
        if (!ewmaInitRef.current) {
            ewmaRef.current = fps;
            ewmaInitRef.current = true;
            return;
        }
        ewmaRef.current = ewmaRef.current * 0.9 + fps * 0.1;

        const now = performance.now();
        const ewma = ewmaRef.current;

        if (ewma < declineThreshold) {
            if (declineStartRef.current === null) declineStartRef.current = now;
            inclineStartRef.current = null;
            if (
                now - declineStartRef.current >= declineDuration &&
                !declinedRef.current
            ) {
                declinedRef.current = true;
                onDecline?.();
            }
        } else if (ewma > inclineThreshold) {
            if (inclineStartRef.current === null) inclineStartRef.current = now;
            declineStartRef.current = null;
            if (
                now - inclineStartRef.current >= inclineDuration &&
                declinedRef.current
            ) {
                declinedRef.current = false;
                onIncline?.();
            }
        } else {
            // Dead zone between thresholds — reset both timers.
            declineStartRef.current = null;
            inclineStartRef.current = null;
        }
    });

    return null;
}

PerformanceMonitor.displayName = "PerformanceMonitor";
