"use client";

import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

import { useMouse } from "../hooks/useMouse";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { DeviceTier } from "../types";
import type { BreathRef } from "./CloudInfinity";

/**
 * CloudInfinityAnimation — the living motion of the signature object.
 *
 * Design contract (task §Animation + §Interaction):
 *  - The object never stops moving.
 *  - Movement is calm, very slow.
 *  - Slow rotation (around Y).
 *  - Gentle floating (vertical bob).
 *  - Small breathing motion (uniform scale pulse).
 *  - Slight tilt based on mouse movement.
 *  - Smooth easing (frame-rate independent damping).
 *  - Never spin quickly, never bounce, never distract.
 *
 * Interaction (task §Interaction):
 *  - Mouse movement → small camera parallax (handled by the scene's camera
 *    rig) + gentle object tilt + light reflection shift.
 *  - No dragging, no orbit controls on the object itself.
 *
 * Implementation:
 *  - All motion is driven from a single `useFrame` loop writing directly to
 *    the group's transform refs — no React re-renders per frame (arch §15.5).
 *  - Motion is composed of independent sine layers at very different periods
 *    so it never reads as mechanical or synchronized.
 *  - Mouse tilt is damped toward the smoothed pointer (from the mouse state
 *    bus) so it eases in and out — never snaps.
 *  - `prefers-reduced-motion` freezes the object: it holds a static, elegant
 *    pose (arch §15.10). The object is still visible — just still.
 *
 * The component renders nothing visible; it attaches to a target group ref
 * passed by the parent ([`CloudInfinity`](./CloudInfinity.tsx)).
 */

export interface CloudInfinityAnimationProps {
    /** The group whose transform this animation drives. */
    targetRef: React.RefObject<THREE.Group>;
    /**
     * Shared breath ref. The animation writes the current breathing scale here
     * so the parent ([`CloudInfinity`](./CloudInfinity.tsx)) can compose it with
     * the scroll-scale without squaring it (it would be squared if read back
     * from `group.scale`). Optional — when omitted, the breath is applied to
     * the group scale only.
     */
    breathRef?: React.RefObject<BreathRef>;
    /** Device tier — low tiers reduce motion amplitude (arch §11). */
    tier?: DeviceTier;
    /** Rotation speed in radians/sec (Y axis). Default ~0.06 (very slow). */
    rotationSpeed?: number;
    /** Floating bob amplitude in world units. Default 0.12. */
    floatAmplitude?: number;
    /** Breathing scale amplitude (fraction of base scale). Default 0.015. */
    breathAmplitude?: number;
    /** Max tilt from mouse in radians. Default 0.18 (~10°). */
    tiltAmplitude?: number;
    /** Damping factor for the mouse tilt (0–1). Lower = smoother/slower. */
    tiltSmoothing?: number;
}

/** Per-tier motion amplitude multiplier — low tiers move less. */
const TIER_AMP: Record<DeviceTier, number> = {
    high: 1,
    medium: 0.8,
    low: 0.5,
    off: 0,
};

/**
 * Drives the CloudInfinity group's transform each frame. Mount as a sibling
 * of the target group inside the R3F tree (it needs `useFrame` + `useMouse`,
 * both of which require the R3F context).
 *
 * @example
 * ```tsx
 * const groupRef = useRef<THREE.Group>(null);
 * <group ref={groupRef}>
 *   <mesh ... />
 * </group>
 * <CloudInfinityAnimation targetRef={groupRef} tier={tier} />
 * ```
 */
function CloudInfinityAnimationImpl({
    targetRef,
    breathRef,
    tier = "high",
    rotationSpeed = 0.06,
    floatAmplitude = 0.12,
    breathAmplitude = 0.015,
    tiltAmplitude = 0.18,
    tiltSmoothing = 0.04,
}: CloudInfinityAnimationProps) {
    const reducedMotion = useReducedMotion();
    const { stateRef: mouseStateRef } = useMouse();

    // Smoothed tilt targets — damped toward the mouse so the tilt eases.
    const tiltX = useRef(0);
    const tiltY = useRef(0);

    // Accumulated rotation so we can advance it smoothly each frame (the
    // group's rotation.y is the source of truth, but we keep a running value
    // to avoid reading back from the object).
    const rotY = useRef(0);

    // Seed the phase offsets once so the motion doesn't start at zero (which
    // would make float + breath begin in sync). Pseudo-random but stable.
    const phase = useRef({
        float: Math.random() * Math.PI * 2,
        breath: Math.random() * Math.PI * 2,
        tilt: Math.random() * Math.PI * 2,
    });

    useFrame((_, delta) => {
        const group = targetRef.current;
        if (!group) return;

        // Clamp delta so a backgrounded tab doesn't fast-forward the motion.
        const dt = Math.min(delta, 0.05);
        const amp = TIER_AMP[tier];

        if (reducedMotion) {
            // Frozen pose: hold a gentle, static tilt so the object still
            // looks composed (not dead-flat). No per-frame writes needed
            // after the first settle — but we set it each frame cheaply.
            group.rotation.set(0.04, 0.5, 0.02);
            group.position.y = 0;
            group.scale.setScalar(1);
            return;
        }

        const t = performance.now() * 0.001;
        const ph = phase.current;

        /* Slow rotation — continuous, never stops. Very slow (default
           ~0.06 rad/s ≈ 3.4°/s → one full turn ≈ 105s). */
        rotY.current += rotationSpeed * amp * dt;
        group.rotation.y = rotY.current;

        /* Gentle floating — vertical sine bob. Period ~9s, very calm. */
        group.position.y = Math.sin(t * 0.7 + ph.float) * floatAmplitude * amp;

        /* Small breathing — uniform scale pulse. Period ~6s, subtle. */
        const breath =
            1 + Math.sin(t * 1.05 + ph.breath) * breathAmplitude * amp;
        group.scale.setScalar(breath);
        // Mirror the breath into the shared ref so the parent can compose it
        // with the scroll-scale without squaring it.
        if (breathRef?.current) breathRef.current.value = breath;

        /* Mouse tilt — damped toward the smoothed pointer. The tilt is
           applied as X/Z rotation so the object leans toward where the user
           looks, creating the "alive" feeling + shifting reflections. */
        const mouse = mouseStateRef.current.smoothed;
        const targetTiltX = mouse.y * tiltAmplitude * amp;
        const targetTiltY = mouse.x * tiltAmplitude * amp;

        // Frame-rate independent damping.
        const f = 1 - Math.pow(1 - tiltSmoothing, dt * 60);
        tiltX.current += (targetTiltX - tiltX.current) * f;
        tiltY.current += (targetTiltY - tiltY.current) * f;

        group.rotation.x = tiltX.current;
        group.rotation.z = tiltY.current;
    });

    // Nothing renders — this is a frame-loop side effect.
    return null;
}

/**
 * Memoized CloudInfinityAnimation. The component's output depends only on its
 * props (all stable across re-renders once the tier resolves) — it renders
 * `null` and only registers a `useFrame` callback. Without `memo`, the parent
 * CloudInfinity's re-renders would re-register the frame callback unnecessarily
 * (task §Performance: "React optimization — memo").
 */
export const CloudInfinityAnimation = memo(CloudInfinityAnimationImpl);

CloudInfinityAnimation.displayName = "CloudInfinityAnimation";
