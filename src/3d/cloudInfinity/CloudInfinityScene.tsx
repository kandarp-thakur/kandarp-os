"use client";

import { memo, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { CloudInfinity } from "./CloudInfinity";
import { EnvironmentLights } from "./EnvironmentLights";
import { NetworkNodes } from "./NetworkNodes";
import { useIsDesktop } from "../hooks/useIsDesktop";
import { useMouse } from "../hooks/useMouse";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { DeviceTier } from "../types";

/**
 * CloudInfinityScene — the in-canvas composition for the signature object.
 *
 * Mounts the full hero environment (task §Environment + §Placement):
 *  - [`EnvironmentLights`](./EnvironmentLights.tsx) — ambient + directional +
 *    rim + procedural HDR + soft contact shadows + fog.
 *  - [`CloudInfinity`](./CloudInfinity.tsx) — the signature object, positioned
 *    on the **right** of the hero, ~60–70% viewport height, partially behind
 *    the content. The object's local lights are disabled (the scene owns the
 *    lighting) to avoid double-lighting.
 *  - [`CloudParticles`](./CloudParticles.tsx) — soft floating cloud puffs.
 *  - [`NetworkNodes`](./NetworkNodes.tsx) — glowing nodes + thin lines + data
 *    packets (the cloud-infrastructure motif).
 *
 * Plus a small camera-parallax driver that translates the smoothed mouse
 * position into a subtle camera shift (task §Interaction: "small camera
 * parallax"). This is the object-side counterpart to the object tilt handled
 * by [`CloudInfinityAnimation`](./CloudInfinityAnimation.tsx) — together they
 * make the object feel alive to the cursor without dragging or orbit
 * controls.
 *
 * The camera parallax is intentionally tiny (±0.4 units) and damped so it
 * never distracts. Under `prefers-reduced-motion` it is disabled (arch §15.10).
 *
 * **Placement** (task §Placement): the object lives on the right side of the
 * hero. On desktop it sits at x ≈ +2.4 (right of center), y ≈ −0.4 (slightly
 * below vertical center, ~60–70% viewport height), and is scaled so it
 * partially hides behind the content column. On mobile (narrow viewports) it
 * recenters and scales down so it never crowds the single-column layout.
 *
 * This component is rendered as the `children` of the reusable
 * [`Scene3D`](../scenes/Scene3D.tsx) (which owns camera/post-processing). The
 * host ([`CloudInfinityBackground`](../../components/background/CloudInfinityBackground.tsx))
 * passes `disableLighting` + `disableEnvironment` so this scene's bespoke
 * environment is the only one — no double-lighting, no double-fog.
 *
 * @example
 * ```tsx
 * <Canvas3D disableLighting disableEnvironment enableControls={false}>
 *   <Scene3D tier={tier} disableLighting disableEnvironment enableControls={false}>
 *     <CloudInfinityScene tier={tier} scrollProgressRef={progressRef} />
 *   </Scene3D>
 * </Canvas3D>
 * ```
 */
export interface CloudInfinitySceneProps {
    /** Device tier — forwarded to the object + environment (arch §11). */
    tier?: DeviceTier;
    /** Scroll progress ref (0–1) for the scale + opacity + depth fade. */
    scrollProgressRef?: React.RefObject<number>;
    /** Overall object scale multiplier. Default 1. */
    scale?: number;
    /**
     * Override the object's world position [x, y, z]. When omitted, the scene
     * computes a responsive placement (right-side on desktop, centered on
     * mobile) per task §Placement.
     */
    position?: [number, number, number];
    /** Multiplier for the violet rim + accent light. Default 1. */
    accentStrength?: number;
}

/** Camera parallax amplitude (world units). Tiny — never distracts. */
const PARALLAX_AMP = 0.4;
/** Damping for the camera parallax (0–1). Lower = smoother/slower. */
const PARALLAX_SMOOTHING = 0.04;

/** Desktop placement — right side, slightly below center (task §Placement). */
const DESKTOP_POSITION: [number, number, number] = [2.4, -0.4, 0];
/** Mobile placement — centered + scaled down so it never crowds content. */
const MOBILE_POSITION: [number, number, number] = [0, -0.2, 0.5];
/** Mobile scale multiplier (object is smaller on narrow viewports). */
const MOBILE_SCALE = 0.72;

function CloudInfinitySceneImpl({
    tier = "high",
    scrollProgressRef,
    scale = 1,
    position,
    accentStrength = 1,
}: CloudInfinitySceneProps) {
    const { camera } = useThree();
    const reducedMotion = useReducedMotion();
    const isDesktop = useIsDesktop();
    const { stateRef: mouseStateRef } = useMouse();

    // Responsive placement: right-side on desktop, centered on mobile.
    const objectPosition = useMemo<[number, number, number]>(() => {
        if (position) return position;
        return isDesktop ? DESKTOP_POSITION : MOBILE_POSITION;
    }, [position, isDesktop]);

    const objectScale = isDesktop ? scale : scale * MOBILE_SCALE;

    // The camera's resting position (hero-wide preset). Parallax offsets from
    // here so the camera always returns to center.
    const basePos = useRef(new THREE.Vector3(0, 0, 8));
    const targetPos = useRef(new THREE.Vector3(0, 0, 8));

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
        camera.lookAt(0, 0, 0);
    });

    return (
        <>
            {/* The bespoke hero environment — ambient + directional + rim +
                procedural HDR + soft contact shadows + fog. This replaces the
                generic LightingRig + Environment3D (the host disables them). */}
            <EnvironmentLights tier={tier} accentStrength={accentStrength} />

            {/* The signature object — right-side on desktop, centered on
                mobile. Local lights disabled (the scene owns lighting). */}
            <CloudInfinity
                tier={tier}
                scale={objectScale}
                position={objectPosition}
                scrollProgressRef={scrollProgressRef}
                accentStrength={accentStrength}
                // The scene's EnvironmentLights owns the full rig; the object's
                // local lights would double-light the glass.
                disableLights
            />

            {/* Glowing nodes + thin lines + data packets — the cloud-
                infrastructure motif, tighter around the object. The soft
                floating cloud puffs were removed (hero-background-redesign):
                they read as random blurry blobs. Only crisp engineering
                elements remain. */}
            <NetworkNodes tier={tier} center={objectPosition} radius={3.2} />
        </>
    );
}

/**
 * Memoized CloudInfinityScene. This is the top-level scene component — memoizing
 * it prevents the entire 3D subtree from re-rendering when the parent
 * (CloudInfinityBackground) re-renders due to the `frameloop` state change
 * (visibility-based pause). The scene's output depends only on `tier`,
 * `scrollProgressRef`, `scale`, `position`, and `accentStrength` — all stable
 * across re-renders once the tier resolves (task §Performance: "React
 * optimization — memo").
 */
export const CloudInfinityScene = memo(CloudInfinitySceneImpl);

CloudInfinityScene.displayName = "CloudInfinityScene";
