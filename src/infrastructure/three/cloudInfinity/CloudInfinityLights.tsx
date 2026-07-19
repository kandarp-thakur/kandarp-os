"use client";

import { useMemo } from "react";

import type { DeviceTier } from "../types";

/**
 * CloudInfinityLights — the bespoke lighting rig for the signature object.
 *
 * Design contract (task §Lighting):
 *  - Soft studio lighting.
 *  - Ambient light.
 *  - HDRI reflections (provided by the scene's [`Environment3D`]).
 *  - Subtle blue accent light.
 *  - Very soft shadows.
 *  - No dramatic lighting.
 *
 * This is a **local** rig — it complements (not replaces) the scene-level
 * [`LightingRig`](../LightingRig.tsx). The scene rig provides the ambient base
 * and key/fill; this rig adds the object-specific accents that make the
 * frosted glass read as premium: a soft key from camera-left, a cool fill
 * from camera-right, and the signature **subtle blue accent** that grazes the
 * rim to bring out the Fresnel edge highlights.
 *
 * Shadows are tier-gated: only the key casts, and only on high/medium tiers,
 * with a tight frustum + large radius for the "very soft shadow" look. Low
 * tiers skip shadows entirely (arch §2.5, §11).
 *
 * No per-frame work — lighting is static (arch §2.6).
 */

export interface CloudInfinityLightsProps {
    /** Device tier — gates shadow casting (arch §11). */
    tier?: DeviceTier;
    /** Intensity multiplier for the blue accent (0–2). Default 1. */
    accentStrength?: number;
}

/**
 * Renders the local light group for the CloudInfinity object. Compose inside
 * the object's parent group so the lights track the object's world position.
 *
 * @example
 * ```tsx
 * <group>
 *   <CloudInfinityLights tier={tier} />
 *   <mesh geometry={geo} material={mat} />
 * </group>
 * ```
 */
export function CloudInfinityLights({
    tier = "high",
    accentStrength = 1,
}: CloudInfinityLightsProps) {
    const castShadow = tier === "high" || tier === "medium";
    const shadowMap = tier === "high" ? 2048 : 1024;

    // Memoize the shadow config so it doesn't thrash the light on re-render.
    const shadowProps = useMemo(
        () =>
            castShadow
                ? {
                      castShadow: true,
                      "shadow-mapSize": [shadowMap, shadowMap] as [
                          number,
                          number,
                      ],
                      "shadow-bias": -0.0001,
                      "shadow-normalBias": 0.02,
                      "shadow-camera-near": 0.5,
                      "shadow-camera-far": 30,
                      "shadow-camera-left": -6,
                      "shadow-camera-right": 6,
                      "shadow-camera-top": 6,
                      "shadow-camera-bottom": -6,
                      "shadow-radius": 6,
                  }
                : {},
        [castShadow, shadowMap],
    );

    return (
        <group>
            {/* Ambient base — soft, even fill so no face is ever black. */}
            <ambientLight color="#ffffff" intensity={0.5} />

            {/* Soft key — camera-left, slightly above. The main light that
                catches the glass surface and casts the (very soft) shadow. */}
            <directionalLight
                color="#ffffff"
                intensity={1.0}
                position={[4, 6, 5]}
                {...shadowProps}
            />

            {/* Cool fill — camera-right, low. Lifts the shadow side without
                adding contrast; keeps the look soft, not dramatic. */}
            <directionalLight
                color="#e6ecff"
                intensity={0.45}
                position={[-5, 2, 3]}
            />

            {/* Subtle blue accent — the signature rim grazer. Positioned
                behind + above so it catches the Fresnel edges of the glass,
                producing the thin glowing highlight. Tunable via
                `accentStrength`. */}
            <pointLight
                color="#5b8cff"
                intensity={2.2 * accentStrength}
                position={[-2, 3, -4]}
                distance={18}
                decay={1.6}
            />

            {/* Warm counter-accent — a whisper of warmth from the opposite
                side so the blue never reads as cold/clinical. Very low. */}
            <pointLight
                color="#ffd9b3"
                intensity={0.5 * accentStrength}
                position={[3, -1, -3]}
                distance={14}
                decay={1.8}
            />
        </group>
    );
}

CloudInfinityLights.displayName = "CloudInfinityLights";
