"use client";

import { useMemo } from "react";

import { LIGHTING_PRESETS } from "./presets";
import type { DeviceTier, LightConfig, LightingPresetName } from "./types";

interface LightingRigProps {
    /** Named lighting setup (arch §2.4). Defaults to `studio`. */
    preset?: LightingPresetName;
    /** Device tier — gates shadow map size (arch §2.5, §11). */
    tier?: DeviceTier;
}

/**
 * Renders a single declarative light from a {@link LightConfig}. Kept as a
 * small component so the rig body stays readable and each light is a stable
 * node in the scene graph.
 */
function Light({
    config,
    shadowMapSize,
}: {
    config: LightConfig;
    shadowMapSize: number;
}) {
    const position = config.position ?? [0, 0, 0];
    const castShadow = config.castShadow === true && shadowMapSize > 0;

    switch (config.type) {
        case "ambient":
            return (
                <ambientLight
                    color={config.color}
                    intensity={config.intensity}
                />
            );
        case "directional":
            return (
                <directionalLight
                    color={config.color}
                    intensity={config.intensity}
                    position={position}
                    castShadow={castShadow}
                    shadow-mapSize={
                        castShadow ? [shadowMapSize, shadowMapSize] : undefined
                    }
                    shadow-bias={castShadow ? -0.0001 : undefined}
                    shadow-normalBias={castShadow ? 0.02 : undefined}
                    shadow-camera-near={castShadow ? 0.5 : undefined}
                    shadow-camera-far={castShadow ? 50 : undefined}
                    shadow-camera-left={castShadow ? -10 : undefined}
                    shadow-camera-right={castShadow ? 10 : undefined}
                    shadow-camera-top={castShadow ? 10 : undefined}
                    shadow-camera-bottom={castShadow ? -10 : undefined}
                />
            );
        case "point":
            return (
                <pointLight
                    color={config.color}
                    intensity={config.intensity}
                    position={position}
                />
            );
        case "spot":
            return (
                <spotLight
                    color={config.color}
                    intensity={config.intensity}
                    position={position}
                />
            );
        default:
            return null;
    }
}

/**
 * The standardized lighting rig (arch §2.2). One per scene. Renders the
 * declarative light list from a named preset, with shadow map size gated by
 * the device tier (off on low-end to save fill rate).
 *
 * No per-frame work — lighting is static unless a specific effect animates it
 * (arch §2.6). The rig is composed inside the scene, not the canvas root.
 *
 * @example
 * ```tsx
 * <LightingRig preset="dramatic" tier="high" />
 * ```
 */
export function LightingRig({
    preset = "studio",
    tier = "high",
}: LightingRigProps) {
    const config = LIGHTING_PRESETS[preset];

    // Shadows are tier-gated: low/off tiers force the map size to 0, which the
    // Light component interprets as "shadows off" (arch §2.5, §11).
    const effectiveShadowMapSize =
        tier === "low" || tier === "off" ? 0 : config.shadowMapSize;

    const lights = useMemo(
        () =>
            config.lights.map((light) => (
                <Light
                    key={`${light.type}-${light.color}`}
                    config={light}
                    shadowMapSize={effectiveShadowMapSize}
                />
            )),
        [config, effectiveShadowMapSize],
    );

    return <group>{lights}</group>;
}

LightingRig.displayName = "LightingRig";
