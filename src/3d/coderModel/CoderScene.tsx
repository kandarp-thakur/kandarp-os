"use client";

import { memo, useMemo, useRef } from "react";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { CoderModel } from "./CoderModel";
import { CoderProps } from "./CoderProps";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { useMouse } from "../hooks/useMouse";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { DeviceTier } from "../types";

/**
 * CoderScene — the in-canvas composition for the Kandarp OS mascot.
 *
 * Mounts the redesigned premium mascot inside a frameless, integrated
 * environment so the character floats naturally (task §Environment +
 * §Composition):
 *
 *   Infinity logo → Character (slightly in front) → Holographic UI →
 *   Particles → Background
 *
 *  - **No card, no box, no rectangular frame, no large backdrop, no floating
 *    platform.** The character is the composition. The DevOps Infinity logo
 *    is part of the environment (owned by [`CoderProps`](./CoderProps.tsx)),
 *    not a separate object — the character appears to control it.
 *  - **Studio lighting** — soft ambient + key + rim, with **blue and Cloud Cyan
 *    accent lights** (task §Lighting). Clean shadows, no dramatic contrast.
 *  - **Soft ambient glow** — a faint, large radial light behind the figure so
 *    it reads as "floating in light", not "floating in a box".
 *  - **Floating holographic engineering UI + the integrated infinity logo +
 *    data particles + network nodes** — the [`CoderProps`] field that
 *    integrates the character into the environment.
 *  - A procedural HDR environment (lightformers) for soft reflections on the
 *    minimal metal accents (watch, zipper) — no network fetch.
 *  - Soft contact shadows grounding the figure (high tier only).
 *  - A subtle camera parallax driven by the mouse so the figure feels alive
 *    to the cursor (the body rotation is handled by
 *    [`CoderAnimation`](./CoderAnimation.tsx)).
 *
 * The scene is rendered as the `children` of the reusable
 * [`Scene3D`](../scenes/Scene3D.tsx) (which owns camera/post-processing). The
 * host ([`HeroPortrait3D`](../../components/sections/HeroPortrait3D.tsx))
 * passes `disableLighting` + `disableEnvironment` so this scene's bespoke
 * environment is the only one — no double-lighting, no double-fog.
 *
 * @example
 * ```tsx
 * <Canvas3D disableLighting disableEnvironment enableControls={false}>
 *   <Scene3D tier={tier} disableLighting disableEnvironment enableControls={false}>
 *     <CoderScene tier={tier} />
 *   </Scene3D>
 * </Canvas3D>
 * ```
 */
export interface CoderSceneProps {
    /** Device tier — forwarded to the model + environment (arch §11). */
    tier?: DeviceTier;
    /** Overall model scale multiplier. Default 1. */
    scale?: number;
    /** Multiplier for the Docker Blue rim + accent light. Default 1. */
    accentStrength?: number;
}

/** Camera parallax amplitude (world units). Tiny — never distracts. */
const PARALLAX_AMP = 0.3;
/** Damping for the camera parallax (0–1). Lower = smoother/slower. */
const PARALLAX_SMOOTHING = 0.04;

/** Desktop scale — the figure fills the portrait frame. */
const DESKTOP_SCALE = 1.0;
/** Mobile scale — slightly smaller so it never crowds the narrow frame. */
const MOBILE_SCALE = 0.82;

function CoderSceneImpl({
    tier = "high",
    scale = 1,
    accentStrength = 1,
}: CoderSceneProps) {
    const { camera } = useThree();
    const reducedMotion = useReducedMotion();
    const isDesktop = useIsDesktop();
    const { stateRef: mouseStateRef } = useMouse();

    const modelScale = (isDesktop ? DESKTOP_SCALE : MOBILE_SCALE) * scale;

    // The camera's resting position. Parallax offsets from here so the camera
    // always returns to center.
    const basePos = useRef(new THREE.Vector3(0, 0.15, 4.4));
    const targetPos = useRef(new THREE.Vector3(0, 0.15, 4.4));

    // Tier gating for the expensive passes.
    const enableHDRI = tier === "high" || tier === "medium";
    const enableContactShadows = tier === "high";
    const enableProps = tier === "high" || tier === "medium";
    const shadowRes = tier === "high" ? 1024 : 512;

    // Fog color resolved once (theme-aware) so the scene blends with the page.
    const fogColor = useMemo(() => {
        if (typeof document === "undefined") return "#050816";
        return document.documentElement.getAttribute("data-theme") === "light"
            ? "#fbfbfd"
            : "#050816";
    }, []);

    useFrame((_, delta) => {
        if (reducedMotion) return;

        const mouse = mouseStateRef.current.smoothed;
        // Offset the camera target by the smoothed mouse — small parallax.
        targetPos.current.set(
            basePos.current.x + mouse.x * PARALLAX_AMP,
            basePos.current.y + mouse.y * PARALLAX_AMP,
            basePos.current.z,
        );

        // Frame-rate independent damping toward the parallax target.
        const f = 1 - Math.pow(1 - PARALLAX_SMOOTHING, delta * 60);
        camera.position.lerp(targetPos.current, f);
        camera.lookAt(0, 0.15, 0);
    });

    return (
        <>
            {/* Ambient base — soft, even fill so no face is ever black. */}
            <ambientLight color="#ffffff" intensity={0.45} />

            {/* Key — camera-left, above. The main light that catches the
                figure. No castShadow: the soft contact shadow is owned by
                <ContactShadows> below (avoids a second shadow pass). */}
            <directionalLight
                color="#ffffff"
                intensity={1.0}
                position={[4, 6, 5]}
            />

            {/* Rim — Docker Blue, from behind/above. The signature edge grazer that
                separates the figure from the background + brings out the
                hair/hoodie silhouette. */}
            <directionalLight
                color="#2496ED"
                intensity={0.75 * accentStrength}
                position={[-3, 4, -6]}
            />

            {/* Blue accent — camera-right, mid. The cool counter-light that
                gives the figure the "blue accent" (task §Lighting) without
                dramatic contrast. */}
            <directionalLight
                color="#38BDF8"
                intensity={0.5 * accentStrength}
                position={[5, 2, 2]}
            />

            {/* Cool fill — camera-right, low. Lifts the shadow side. */}
            <directionalLight
                color="#e6ecff"
                intensity={0.3}
                position={[-5, 1, 3]}
            />

            {/* Soft ambient glow — a faint, large point light behind the
                figure so it reads as "floating in light", not "floating in a
                box". This replaces the old square glass panel backdrop. */}
            <pointLight
                color="#2496ED"
                intensity={0.6 * accentStrength}
                position={[0, 0.4, -1.8]}
                distance={4}
                decay={2}
            />

            {/* HDR environment — procedural lightformers (no network fetch).
                Baked once (frames={1}) since the lightformers are static. */}
            {enableHDRI ? (
                <Environment resolution={256} background={false} frames={1}>
                    {/* Soft white overhead panel — the key reflection band. */}
                    <Lightformer
                        form="rect"
                        intensity={2.0}
                        position={[0, 5, -4]}
                        scale={[8, 4, 1]}
                        color="#ffffff"
                    />
                    {/* Cool blue side panel — camera-left. */}
                    <Lightformer
                        form="rect"
                        intensity={1.5}
                        position={[-6, 2, 2]}
                        rotation={[0, Math.PI / 2, 0]}
                        scale={[6, 4, 1]}
                        color="#9bb8ff"
                    />
                    {/* Docker Blue side panel — camera-right. */}
                    <Lightformer
                        form="rect"
                        intensity={1.3}
                        position={[6, 1, 2]}
                        rotation={[0, -Math.PI / 2, 0]}
                        scale={[6, 4, 1]}
                        color="#326CE5"
                    />
                </Environment>
            ) : null}

            {/* The integrated environment — the DevOps Infinity logo (part of
                the scene, the character controls it) + floating holographic
                engineering UI + data particles + network nodes. Frameless
                integration (no card, no box). Disabled on low/off tiers. */}
            {enableProps ? <CoderProps tier={tier} /> : null}

            {/* The mascot — centered, facing the camera, standing slightly in
                front of the infinity logo (task §Composition). */}
            <CoderModel tier={tier} scale={modelScale} position={[0, 0, 0]} />

            {/* Soft contact shadows — the figure grounded on a faint plane.
                A separate render pass → high tier only. Very subtle. */}
            {enableContactShadows ? (
                <ContactShadows
                    position={[0, -1.42, 0]}
                    opacity={0.28}
                    scale={5}
                    blur={3}
                    far={3}
                    resolution={shadowRes}
                    color="#05060a"
                />
            ) : null}

            {/* Soft volumetric fog — distant geometry recedes into the page.
                Density is very low so the figure (near the camera) is
                essentially unaffected. */}
            <fogExp2 attach="fog" args={[fogColor, 0.016]} />
        </>
    );
}

/**
 * Memoized CoderScene. This is the top-level scene component — memoizing it
 * prevents the entire 3D subtree from re-rendering when the parent
 * (HeroPortrait3D) re-renders due to the `frameloop` state change
 * (visibility-based pause). The scene's output depends only on `tier`,
 * `scale`, and `accentStrength` — all stable across re-renders once the tier
 * resolves (task §Performance: "React optimization — memo").
 */
export const CoderScene = memo(CoderSceneImpl);

CoderScene.displayName = "CoderScene";
