"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

import { createCloudInfinityGeometry } from "./cloudInfinityGeometry";
import { useCloudInfinityMaterial } from "./CloudInfinityMaterial";
import { CloudInfinityLights } from "./CloudInfinityLights";
import { CloudInfinityAnimation } from "./CloudInfinityAnimation";
import type { DeviceTier } from "../types";

/**
 * The breath value written by {@link CloudInfinityAnimation} onto the group's
 * scale is read back here via this shared ref so the scroll-scale can compose
 * with it multiplicatively without squaring it. The animation writes the
 * breath to `group.scale` (for its own visual identity) AND to this ref (so
 * the mesh can apply `scrollScale * breath * scale` cleanly).
 */
export interface BreathRef {
    /** The current breathing scale factor (≈1 ± breathAmplitude). */
    value: number;
}

/**
 * CloudInfinity — the signature 3D object of Kandarp OS.
 *
 * One unified shape merging **Cloud** + **DevOps Infinity Loop** into a single
 * continuous frosted-glass form. It is the visual identity of the site —
 * recognizable without text, evoking Cloud Engineering, DevOps, Automation, and
 * Infrastructure.
 *
 * Composition (task §Technical Requirements — separate reusable components):
 *  - [`cloudInfinityGeometry`](./cloudInfinityGeometry.ts) — the lemniscate
 *    tube (cloud-swollen lobes + flow neck).
 *  - [`CloudInfinityMaterial`](./CloudInfinityMaterial.tsx) — frosted glass
 *    with Fresnel rim highlights.
 *  - [`CloudInfinityLights`](./CloudInfinityLights.tsx) — soft studio + blue
 *    accent rig.
 *  - [`CloudInfinityAnimation`](./CloudInfinityAnimation.tsx) — slow rotation,
 *    float, breathing, mouse tilt.
 *
 * The object is a **single mesh + single material = one draw call**. Geometry
 * segment counts scale by tier so low-end devices get a lighter mesh (arch
 * §11). The material is shared across the (single) mesh — no instancing needed
 * for one object, but the geometry/material factories are exported for reuse.
 *
 * Placement: this component renders only the object (group + mesh + lights +
 * animation). It is mounted inside a [`Scene3D`](../scenes/Scene3D.tsx) by the
 * host ([`CloudInfinityBackground`](./CloudInfinityBackground.tsx)) which owns
 * the canvas, camera, environment, and scroll wiring.
 *
 * Scroll (task §Placement): pass a `scrollProgressRef` (0 at hero top → 1 as
 * the user scrolls past) and the object scales slightly + fades into the
 * background of later sections. The scale composes multiplicatively with the
 * breathing animation so both stay independent.
 *
 * @example
 * ```tsx
 * <Canvas3D lightingPreset="soft" enableControls={false}>
 *   <CloudInfinity tier="high" scrollProgressRef={progressRef} />
 * </Canvas3D>
 * ```
 */
export interface CloudInfinityProps {
    /** Device tier — scales geometry density + material path (arch §11). */
    tier?: DeviceTier;
    /** Overall scale multiplier. Default 1. */
    scale?: number;
    /** Position offset [x, y, z]. Default centered at origin. */
    position?: [number, number, number];
    /** Accent light strength multiplier (0–2). Default 1. */
    accentStrength?: number;
    /** Rotation speed multiplier. 1 = default very-slow rotation. */
    rotationSpeedMultiplier?: number;
    /**
     * Scroll progress (0–1) ref. Drives a slight scale-down + opacity fade as
     * the user scrolls past the hero so the object recedes into the background
     * of later sections (task §Placement). Omit to keep the object static.
     */
    scrollProgressRef?: React.RefObject<number>;
    /** Disable the local lights (use when the scene rig is sufficient). */
    disableLights?: boolean;
}

/** Per-tier geometry density. Lower tiers get fewer segments (arch §11). */
const TIER_SEGMENTS: Record<DeviceTier, { tubular: number; radial: number }> = {
    high: { tubular: 256, radial: 18 },
    medium: { tubular: 180, radial: 14 },
    low: { tubular: 120, radial: 10 },
    off: { tubular: 96, radial: 8 },
};

/** Scroll-driven scale + opacity + depth range (task §Placement). */
const SCROLL_START_SCALE = 1;
const SCROLL_END_SCALE = 0.82;
const SCROLL_START_OPACITY = 1;
const SCROLL_END_OPACITY = 0.35;
/** Small Z recession (world units) as the user scrolls past the hero. */
const SCROLL_END_DEPTH = 1.6;

/** Smoothstep easing for the scroll transition. */
function smoothstep(x: number): number {
    const c = Math.max(0, Math.min(1, x));
    return c * c * (3 - 2 * c);
}

function CloudInfinityImpl({
    tier = "high",
    scale = 1,
    position = [0, 0, 0],
    accentStrength = 1,
    rotationSpeedMultiplier = 1,
    scrollProgressRef,
    disableLights = false,
}: CloudInfinityProps) {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    // Shared breath ref — the animation writes here; this component reads it so
    // the scroll-scale composes with the breath without squaring it.
    const breathRef = useRef<BreathRef>({ value: 1 });

    // Geometry is memoized on tier — rebuilt only when the tier changes.
    const geometry = useMemo(() => {
        const seg = TIER_SEGMENTS[tier];
        return createCloudInfinityGeometry({
            tubularSegments: seg.tubular,
            radialSegments: seg.radial,
        });
    }, [tier]);

    // Material is memoized on tier + theme (the hook reads the DOM theme).
    const material = useCloudInfinityMaterial({ tier });

    // Dispose geometry + material on unmount / tier change to avoid leaks.
    useEffect(() => {
        return () => {
            geometry.dispose();
            material.dispose();
        };
    }, [geometry, material]);

    // Compose the scroll-scale with the breathing scale each frame. Both stay
    // independent and multiplicative: the animation writes the breath to
    // `breathRef` (and to the group scale for its own visual identity); here we
    // apply `scrollScale * breath * scale` to the mesh so the breath is not
    // squared (it would be if we read it back from `group.scale`).
    useFrame(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const breath = breathRef.current.value;

        // Scroll scale + opacity fade + depth recession (task §Placement).
        let scrollScale = 1;
        let scrollDepth = 0;
        const progress = scrollProgressRef?.current ?? 0;
        if (scrollProgressRef) {
            const eased = smoothstep(progress);
            scrollScale =
                SCROLL_START_SCALE +
                (SCROLL_END_SCALE - SCROLL_START_SCALE) * eased;
            scrollDepth = SCROLL_END_DEPTH * eased;
            const opacity =
                SCROLL_START_OPACITY +
                (SCROLL_END_OPACITY - SCROLL_START_OPACITY) * eased;
            // Only standard/physical materials expose `opacity`.
            if ("opacity" in material) {
                (material as THREE.Material & { opacity: number }).opacity =
                    opacity;
            }
        }

        mesh.scale.setScalar(scrollScale * breath * scale);
        mesh.position.z = scrollDepth;
    });

    return (
        <group ref={groupRef} position={position}>
            {!disableLights ? (
                <CloudInfinityLights
                    tier={tier}
                    accentStrength={accentStrength}
                />
            ) : null}

            <mesh
                ref={meshRef}
                geometry={geometry}
                material={material}
                castShadow={tier === "high" || tier === "medium"}
                receiveShadow={tier === "high" || tier === "medium"}
            />

            <CloudInfinityAnimation
                targetRef={groupRef}
                breathRef={breathRef}
                tier={tier}
                rotationSpeed={0.06 * rotationSpeedMultiplier}
            />
        </group>
    );
}

/**
 * Memoized CloudInfinity. The component's output depends only on `tier`,
 * `scale`, `position`, `accentStrength`, `rotationSpeedMultiplier`, and
 * `scrollProgressRef` — all stable across re-renders once the tier resolves.
 * Without `memo`, the parent scene's re-renders (e.g. from `useIsDesktop` /
 * `useReducedMotion` settling) would re-run the geometry/material `useMemo`
 * dependency checks and reconcile the JSX tree unnecessarily
 * (task §Performance: "React optimization — memo").
 */
export const CloudInfinity = memo(CloudInfinityImpl);

CloudInfinity.displayName = "CloudInfinity";
