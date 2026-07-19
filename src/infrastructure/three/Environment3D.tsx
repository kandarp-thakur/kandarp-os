"use client";

import { useMemo } from "react";
import { Environment as DreiEnvironment } from "@react-three/drei";
import * as THREE from "three";

import { ENVIRONMENT_PRESETS } from "./presets";
import type { DeviceTier, EnvironmentPresetName } from "./types";

interface Environment3DProps {
    /** Named environment source (arch §3.3). Defaults to `studio`. */
    preset?: EnvironmentPresetName;
    /** Device tier — gates fog and HDRI vs procedural (arch §11). */
    tier?: DeviceTier;
}

/**
 * The environment system (arch §3.2). Provides image-based lighting (IBL)
 * reflections, scene fog, and atmosphere. Scene-scoped: each scene declares
 * its own environment.
 *
 * Reflections come from drei's built-in HDR presets (zero asset weight — no
 * custom HDR files are fetched). On low/off tiers, reflections are skipped in
 * favour of a procedural gradient environment to keep the layer cheap
 * (arch §3.5, §11). Fog is tier-gated off on low-end.
 *
 * The background is intentionally left transparent so the 3D canvas blends
 * seamlessly with the page (arch §3.5) — the DOM canvas color shows through.
 *
 * @example
 * ```tsx
 * <Environment3D preset="sunset" tier="high" />
 * ```
 */
export function Environment3D({
    preset = "studio",
    tier = "high",
}: Environment3DProps) {
    const config = ENVIRONMENT_PRESETS[preset];

    // Fog is tier-gated: off on low/off tiers (arch §3.5, §11).
    const enableFog = config.enableFog && tier !== "low" && tier !== "off";

    // HDRI reflections are skipped on low/off tiers — procedural gradient env
    // is preferred for abstract scenes and zero asset weight (arch §3.5).
    const enableHDRI = tier === "high" || tier === "medium";

    // drei's Environment accepts a `preset` string that maps to built-in HDRIs.
    // We only pass it when HDRI is enabled; otherwise we render nothing (the
    // scene falls back to the lighting rig + transparent background).
    const dreiPreset = useMemo<"studio" | "sunset" | undefined>(() => {
        if (!enableHDRI) return undefined;
        if (preset === "studio") return "studio";
        if (preset === "sunset") return "sunset";
        // gradient-env is procedural — no drei preset maps to it.
        return undefined;
    }, [enableHDRI, preset]);

    return (
        <>
            {enableFog ? (
                <fogExp2
                    attach="fog"
                    args={[new THREE.Color(config.fogColor), config.fogDensity]}
                />
            ) : null}

            {dreiPreset ? (
                <DreiEnvironment preset={dreiPreset} background={false} />
            ) : null}
        </>
    );
}

Environment3D.displayName = "Environment3D";
