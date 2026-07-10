"use client";

import { useEffect, useState } from "react";

import type { DeviceTier } from "../types";

/**
 * Detects the device's WebGL capability and assigns a performance tier
 * (arch §11). Detection is intentionally lightweight and SSR-safe: it runs
 * only on the client after mount, defaulting to "high" during SSR so the
 * server markup matches the optimistic client render (no hydration mismatch).
 *
 * Strategy mirrors the architecture doc:
 *   1. No WebGL support → "off" (triggers the 2D fallback).
 *   2. Low cores / memory → "low".
 *   3. Otherwise → "high" (full benchmarking is deferred to a future task).
 *
 * @returns The resolved {@link DeviceTier}. `"high"` until the client probe
 *   completes, so the first paint is never blocked.
 */
export function useDeviceTier(): DeviceTier {
    const [tier, setTier] = useState<DeviceTier>("high");

    useEffect(() => {
        // Probe WebGL availability. We only need a throwaway context — the real
        // renderer is created by R3F inside <Canvas>.
        const canvas = document.createElement("canvas");
        const gl =
            canvas.getContext("webgl2") ??
            canvas.getContext("webgl") ??
            canvas.getContext("experimental-webgl");

        if (!gl) {
            setTier("off");
            return;
        }

        // Heuristic capability check. `hardwareConcurrency` and `deviceMemory`
        // are widely supported but optional — guard with `??`.
        const cores = navigator.hardwareConcurrency ?? 8;
        const memory =
            (navigator as Navigator & { deviceMemory?: number }).deviceMemory ??
            8;

        if (cores <= 2 || memory <= 2) {
            setTier("low");
            return;
        }

        if (cores <= 4 || memory <= 4) {
            setTier("medium");
            return;
        }

        setTier("high");
    }, []);

    return tier;
}
