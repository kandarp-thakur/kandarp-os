"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { memo, useMemo } from "react";

import type { DeviceTier } from "../types";

/**
 * EnvironmentLights — the scene-level environment for the CloudInfinity hero.
 *
 * Design contract (task §Lighting + §Environment):
 *  - Ambient Light (soft, even base so no face is ever black).
 *  - Directional Light (the key — camera-left, slightly above).
 *  - Rim Light (violet, from behind/above — the signature edge grazer that
 *    brings out the Fresnel highlights on the frosted glass).
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
 * controlled reflections (soft white overhead + cool-blue left + violet right +
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
    /** Multiplier for the violet rim + accent light (0–2). Default 1. */
    accentStrength?: number;
    /** Y position of the contact-shadow plane (below the object). */
    shadowY?: number;
    /** Fog color override. Defaults to the active theme's canvas color. */
    fogColor?: string;
    /** Fog density. Default 0.022 — subtle, only affects distant particles. */
    fogDensity?: number;
}

const DARK_FOG = "#0a0a0f";
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
            {/* Ambient base — soft, even fill. */}
            <ambientLight color="#ffffff" intensity={0.4} />

            {/* Directional key — camera-left, above. The main light that catches
                the glass surface. No castShadow: the soft contact shadow is
                owned by <ContactShadows> below (avoids a second shadow pass). */}
            <directionalLight
                color="#ffffff"
                intensity={1.05}
                position={[5, 8, 5]}
            />

            {/* Rim — violet, from behind/above. The signature edge grazer that
                brings out the Fresnel highlights on the frosted glass. */}
            <directionalLight
                color="#8b5cf6"
                intensity={0.85 * accentStrength}
                position={[-2, 5, -8]}
            />

            {/* Cool fill — camera-right, low. Lifts the shadow side without
                adding contrast; keeps the look soft, not dramatic. */}
            <directionalLight
                color="#e6ecff"
                intensity={0.4}
                position={[-5, 2, 3]}
            />

            {/* HDR environment — procedural lightformers (no network fetch).
                Baked once (frames={1}) since the lightformers are static; the
                glass still shows shifting reflections as it rotates. */}
            {enableHDRI ? (
                <Environment resolution={256} background={false} frames={1}>
                    {/* Soft white overhead panel — the key reflection band. */}
                    <Lightformer
                        form="rect"
                        intensity={2.2}
                        position={[0, 5, -6]}
                        scale={[10, 5, 1]}
                        color="#ffffff"
                    />
                    {/* Cool blue side panel — camera-left. */}
                    <Lightformer
                        form="rect"
                        intensity={1.6}
                        position={[-7, 2, 2]}
                        rotation={[0, Math.PI / 2, 0]}
                        scale={[7, 5, 1]}
                        color="#9bb8ff"
                    />
                    {/* Violet side panel — camera-right. */}
                    <Lightformer
                        form="rect"
                        intensity={1.4}
                        position={[7, 1, 2]}
                        rotation={[0, -Math.PI / 2, 0]}
                        scale={[7, 5, 1]}
                        color="#c4b5fd"
                    />
                    {/* Cyan ring — below, for the under-glow + edge tint. */}
                    <Lightformer
                        form="ring"
                        intensity={1.1}
                        position={[0, -4, 4]}
                        scale={[5, 5, 1]}
                        color="#7dd3fc"
                    />
                </Environment>
            ) : null}

            {/* Soft contact shadows — the object grounded on a faint plane.
                A separate render pass → high tier only. Very subtle so it never
                reads as a dark blob behind the content. */}
            {enableContactShadows ? (
                <ContactShadows
                    position={[0, shadowY, 0]}
                    opacity={0.32}
                    scale={16}
                    blur={3.2}
                    far={6}
                    resolution={shadowRes}
                    color="#05060a"
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
