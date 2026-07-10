"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { CameraProvider, useCamera } from "./hooks/useCamera";
import { useIsDesktop } from "./hooks/useIsDesktop";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { CAMERA_PRESETS } from "./presets";
import type { CameraPresetName } from "./types";

interface CameraRigProps {
    /** Initial preset to seed the camera target with. Defaults to `hero-wide`. */
    initialPreset?: CameraPresetName;
    /**
     * Enable desktop orbit controls (arch §1.5). Disabled on mobile and during
     * scroll-driven sections. Defaults to `true`.
     */
    enableControls?: boolean;
    /**
     * Skip the per-frame camera damping loop. Use when the scene content drives
     * the camera itself (e.g. CloudInfinityScene's parallax) so the rig doesn't
     * fight the scene for camera control — eliminating a duplicate per-frame
     * camera write. The camera is still seeded from the initial preset.
     * Defaults to `false`.
     */
    passive?: boolean;
    children?: React.ReactNode;
}

/**
 * The internal rig that owns the R3F camera and damps it toward the shared
 * target each frame. Rendered inside {@link CameraProvider} so it can read
 * the state bus. Never exported directly — use `CameraRig`.
 *
 * Damping uses `THREE.MathUtils.damp` (frame-rate independent). When the user
 * prefers reduced motion, the rig snaps directly to the target (no breathing,
 * no parallax) per arch §1.5.
 */
function CameraRigInner({
    initialPreset = "hero-wide",
    enableControls = true,
    passive = false,
    children,
}: CameraRigProps) {
    const { camera, gl } = useThree();
    const { stateRef } = useCamera();
    const isDesktop = useIsDesktop();
    const reducedMotion = useReducedMotion();

    // Reusable vectors — avoids per-frame allocation (task §Performance:
    // "memory management"). Previously a new THREE.Vector3 was created every
    // frame inside the lerp call.
    const lookAtTarget = useRef(new THREE.Vector3());
    const lerpTarget = useRef(new THREE.Vector3());

    // Seed the camera from the initial preset on first render.
    const initial = CAMERA_PRESETS[initialPreset];
    camera.position.set(...initial.position);

    // When `passive` is set, the scene content drives the camera itself (e.g.
    // CloudInfinityScene's parallax). Skip the rig's frame loop entirely so it
    // doesn't fight the scene for camera control — eliminating a duplicate
    // per-frame camera write (task §Performance: "avoid multiple render loops").
    useFrame((_, delta) => {
        if (passive) return;

        const { target, smoothing, mode } = stateRef.current;

        // Reduced motion: snap to target, skip idle breathing entirely.
        if (reducedMotion) {
            camera.position.set(...target.position);
            lookAtTarget.current.set(...target.lookAt);
            camera.lookAt(lookAtTarget.current);
            return;
        }

        // Frame-rate independent damping toward the target position.
        const factor = 1 - Math.pow(1 - smoothing, delta * 60);
        lerpTarget.current.set(
            target.position[0],
            target.position[1],
            target.position[2],
        );
        camera.position.lerp(lerpTarget.current, factor);

        // Idle mode adds a gentle "breathing" bob (arch §1.3). Disabled for
        // scroll/cinematic/interactive modes where motion is externally driven.
        if (mode === "idle") {
            const t = performance.now() * 0.0005;
            camera.position.y += Math.sin(t) * 0.02;
        }

        lookAtTarget.current.set(...target.lookAt);
        camera.lookAt(lookAtTarget.current);
    });

    // Orbit controls are desktop-only and disabled during scroll-driven
    // sections (mode !== "interactive"). Also disabled when passive — the
    // scene owns the camera. See arch §1.5.
    const controlsEnabled =
        enableControls &&
        !passive &&
        isDesktop &&
        stateRef.current.mode === "interactive";

    return (
        <>
            {controlsEnabled ? (
                <OrbitControls
                    makeDefault
                    enableDamping
                    dampingFactor={0.1}
                    enablePan={false}
                    minDistance={3}
                    maxDistance={20}
                    // Pitch clamp keeps the camera from flipping under the scene.
                    maxPolarAngle={Math.PI * 0.85}
                    args={[camera, gl.domElement]}
                />
            ) : null}
            {children}
        </>
    );
}

/**
 * The camera orchestrator (arch §1.2). One per canvas. Owns the camera and
 * exposes the shared state bus via {@link useCamera} to descendant systems.
 *
 * @example
 * ```tsx
 * <Canvas3D>
 *   <CameraRig initialPreset="hero-wide">
 *     <LightingRig />
 *     <Environment3D />
 *   </CameraRig>
 * </Canvas3D>
 * ```
 */
export function CameraRig(props: CameraRigProps) {
    return (
        <CameraProvider initialPreset={props.initialPreset}>
            <CameraRigInner {...props} />
        </CameraProvider>
    );
}

CameraRig.displayName = "CameraRig";
