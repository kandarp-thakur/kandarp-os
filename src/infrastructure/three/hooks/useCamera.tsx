"use client";

import { createContext, useContext, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";

import type { CameraMode, CameraPresetName, CameraTarget } from "../types";
import { CAMERA_PRESETS } from "../presets";

/**
 * The shared camera state bus (arch §10.1). Systems communicate with the
 * camera exclusively through this context — no direct mutation of the R3F
 * camera object from outside the rig. The rig reads `target` each frame and
 * damps toward it; other systems write to `target` (or call `setPreset`).
 *
 * Everything is held in refs (not state) so writes from `useFrame` loops and
 * event handlers never trigger React re-renders. The rig is the single
 * consumer that reads these refs per-frame.
 */
export interface CameraState {
    /** Current interpolation target the rig damps toward. */
    target: CameraTarget;
    /** Active behaviour mode (arch §1.3). */
    mode: CameraMode;
    /** Smoothing factor for damping (0–1). Lower = slower / smoother. */
    smoothing: number;
}

export interface CameraApi {
    /** Live state ref — read by the rig each frame. */
    stateRef: MutableRefObject<CameraState>;
    /** Snap to a named preset (sets the target; rig damps to it). */
    setPreset: (preset: CameraPresetName) => void;
    /** Set an explicit target (used by scroll/mouse systems). */
    setTarget: (target: Partial<CameraTarget>) => void;
    /** Switch the active behaviour mode. */
    setMode: (mode: CameraMode) => void;
}

const CameraContext = createContext<CameraApi | null>(null);

interface CameraProviderProps {
    /** Initial preset to seed the target with. Defaults to `hero-wide`. */
    initialPreset?: CameraPresetName;
    children: React.ReactNode;
}

/**
 * Provides the camera state bus. Mounted once per canvas by the `CameraRig`.
 * Descendant systems consume it via {@link useCamera}.
 */
export function CameraProvider({
    initialPreset = "hero-wide",
    children,
}: CameraProviderProps) {
    const initial = CAMERA_PRESETS[initialPreset];

    // Held in a ref so per-frame writes never cause re-renders.
    const stateRef = useRef<CameraState>({
        target: {
            position: [...initial.position] as [number, number, number],
            lookAt: [...initial.lookAt] as [number, number, number],
            fov: initial.fov,
        },
        mode: "idle",
        smoothing: 0.1,
    });

    const api = useMemo<CameraApi>(
        () => ({
            stateRef,
            setPreset: (preset) => {
                const p = CAMERA_PRESETS[preset];
                const s = stateRef.current;
                s.target = {
                    position: [...p.position] as [number, number, number],
                    lookAt: [...p.lookAt] as [number, number, number],
                    fov: p.fov,
                };
            },
            setTarget: (target) => {
                const s = stateRef.current;
                const cur = s.target;
                s.target = {
                    position: target.position
                        ? ([...target.position] as [number, number, number])
                        : cur.position,
                    lookAt: target.lookAt
                        ? ([...target.lookAt] as [number, number, number])
                        : cur.lookAt,
                    fov: target.fov ?? cur.fov,
                };
            },
            setMode: (mode) => {
                stateRef.current.mode = mode;
            },
        }),
        [],
    );

    return (
        <CameraContext.Provider value={api}>{children}</CameraContext.Provider>
    );
}

/**
 * Reads the camera state bus. Must be used inside a {@link CameraProvider}
 * (which the `CameraRig` mounts). Returns the imperative API for steering
 * the camera from any system.
 *
 * @throws If used outside a `CameraProvider` — guards against silent no-ops.
 */
export function useCamera(): CameraApi {
    const ctx = useContext(CameraContext);
    if (!ctx) {
        throw new Error("useCamera must be used within a <CameraProvider>.");
    }
    return ctx;
}
