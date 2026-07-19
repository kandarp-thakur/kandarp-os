"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { memo, useMemo } from "react";

import type { DeviceTier } from "../types";

/**
 * EnvironmentLights — the scene-level environment for the CloudInfinity hero.
 *
 * Design contract (task §Lighting + §Environment):
 *  - Three-point lighting: Cloud Blue key, neutral-white fill, soft AWS Orange rim.
 *  - Ambient Light (soft, even base so no face is ever black).
 *  - Directional Light (the key — camera-left, slightly above).
 *  - Warm rim light (soft AWS Orange, from behind/above — a studio-light edge
 *    grazer that separates the frosted glass from the blue cloud field).
 *  - HDR Environment (image-based lighting for soft reflections + refraction).
 *  - Soft Contact Shadows (a faint grounded shadow plane — high tier only).
 *  - Soft volumetric fog (distant particles recede into the page).
 *
 * This is the **scene** environment — it complements (not duplicates) the
 * object-local [`CloudInfinityLights`](./CloudInfinityLights.tsx), which owns
 * only the object-tracking accents (the blue rim grazer + warm counter). To
 * avoid double-lighting, the host mounts this via a `Scene3D` that has its own
 * `LightingRig` + `Environment3D` **disabled** (see
 * [`CloudInfinityBackground`](../../components/background/CloudInfinityBackground.tsx)
 * → `disableLighting` / `disableEnvironment`).
 *
 * The HDR environment is built **procedurally** from `Lightformer` area lights —
 * no network fetch, no HDR file. This gives the frosted glass the premium,
 * controlled reflections (soft white overhead + cool-blue left + Kubernetes Blue right +
 * cyan under-glow) that read as Apple / Vercel / Linear, not a generic HDRI.
 * The env map is baked once (`frames={1}`) because the lightformers are static;
 * the glass still shows shifting reflections as the object rotates through the
 * baked environment.
 *
 * Tier gating (arch §11):
 *  - HDRI + contact shadows: high (medium gets HDRI only).
 *  - Fog: high + medium (off on low/off).
 *  - Contact shadows are a separate render pass → high tier only.
 *
 * No per-frame work — lighting + environment are static (arch §2.6).
 */

export interface EnvironmentLightsProps {
    /** Device tier — gates HDRI / contact shadows / fog (arch §11). */
    tier?: DeviceTier;
    /** Multiplier for the Docker Blue rim + accent light (0–2). Default 1. */
    accentStrength?: number;
    /** Y position of the contact-shadow plane (below the object). */
    shadowY?: number;
    /** Fog color override. Defaults to the active theme's canvas color. */
    fogColor?: string;
    /** Fog density. Default 0.022 — subtle, only affects distant particles. */
    fogDensity?: number;
}

const DARK_FOG = "#050816";
const LIGHT_FOG = "#fbfbfd";

/** Resolves the active theme from the document root. SSR-safe. */
function readTheme(): "light" | "dark" {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
}

function EnvironmentLightsImpl({
    tier = "high",
    accentStrength = 1,
    shadowY = -2.4,
    fogColor,
    fogDensity = 0.022,
}: EnvironmentLightsProps) {
    const enableHDRI = tier === "high" || tier === "medium";
    const enableContactShadows = tier === "high";
    const enableFog = tier !== "low" && tier !== "off";
    const shadowRes = tier === "high" ? 1024 : 512;

    // Resolve the fog color once (theme-aware) so distant particles fade into
    // the page canvas, not into a fixed color.
    const resolvedFogColor = useMemo(() => {
        if (!enableFog) return null;
        if (fogColor) return fogColor;
        return readTheme() === "light" ? LIGHT_FOG : DARK_FOG;
    }, [enableFog, fogColor]);

    return (
        <>
            {/* Ambient base — soft, even fill for the dark canvas. */}
            <ambientLight color="#0F172A" intensity={0.6} />

            {/* Directional key — camera-left, above. Cloud Cyan tint catches
                the frosted glass surface with a cool engineering glow. */}
            <directionalLight
                color="#38BDF8"
                intensity={0.85}
                position={[5, 8, 5]}
            />

            {/* Warm rim — soft AWS Orange from behind/above. Provides studio
                separation and a subtle engineering status highlight. */}
            <directionalLight
                color="#FF9900"
                intensity={0.32 * accentStrength}
                position={[-2.8, 4.6, -8]}
            />

            {/* Docker Blue fill — camera-right, low. Lifts the shadow side
                with a cool technical undertone. */}
            <directionalLight
                color="#2496ED"
                intensity={0.35}
                position={[-5, 2, 3]}
            />

            {/* HDR environment — procedural lightformers (no network fetch).
                Baked once (frames={1}) since the lightformers are static; the
                glass still shows shifting reflections as it rotates. */}
            {enableHDRI ? (
                <Environment resolution={256} background={false} frames={1}>
                    {/* Docker Blue overhead panel — the key reflection band. */}
                    <Lightformer
                        form="rect"
                        intensity={1.8}
                        position={[0, 5, -6]}
                        scale={[10, 5, 1]}
                        color="#2496ED"
                    />
                    {/* Cloud Cyan key reflection — camera-left. */}
                    <Lightformer
                        form="rect"
                        intensity={1.2}
                        position={[-7, 2, 2]}
                        rotation={[0, Math.PI / 2, 0]}
                        scale={[7, 5, 1]}
                        color="#38BDF8"
                    />
                    {/* AWS Orange rim reflection — camera-right edge only. */}
                    <Lightformer
                        form="rect"
                        intensity={0.35}
                        position={[7, 1, 2]}
                        rotation={[0, -Math.PI / 2, 0]}
                        scale={[5, 4, 1]}
                        color="#FF9900"
                    />
                    {/* Cool cyan under-glow — below the object, for the
                        inner energy + edge tint. */}
                    <Lightformer
                        form="ring"
                        intensity={0.8}
                        position={[0, -4, 4]}
                        scale={[5, 5, 1]}
                        color="#22D3EE"
                    />
                </Environment>
            ) : null}

            {/* Soft contact shadows — the object grounded on a faint plane.
                A separate render pass → high tier only. Very subtle so it never
                reads as a dark blob behind the content. */}
            {enableContactShadows ? (
                <ContactShadows
                    position={[0, shadowY, 0]}
                    opacity={0.45}
                    scale={16}
                    blur={3.2}
                    far={6}
                    resolution={shadowRes}
                    color="#020617"
                />
            ) : null}

            {/* Soft volumetric fog — distant particles recede into the page.
                Density is kept very low so the hero object (near the camera) is
                essentially unaffected; only the far cloud puffs fade. */}
            {enableFog && resolvedFogColor ? (
                <fogExp2 attach="fog" args={[resolvedFogColor, fogDensity]} />
            ) : null}
        </>
    );
}

/**
 * Memoized EnvironmentLights. The component's output depends only on `tier`,
 * `accentStrength`, `shadowY`, `fogColor`, and `fogDensity` — all stable once
 * the tier resolves. Without `memo`, the parent scene's re-renders would
 * re-evaluate the tier-gating conditionals and reconcile the JSX tree
 * unnecessarily (task §Performance: "React optimization — memo").
 */
export const EnvironmentLights = memo(EnvironmentLightsImpl);

EnvironmentLights.displayName = "EnvironmentLights";
