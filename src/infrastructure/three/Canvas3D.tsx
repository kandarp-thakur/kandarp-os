"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";

import { useDeviceTier } from "./hooks/useDeviceTier";
import { TIER_CONFIG } from "./presets";
import { Scene3D } from "./scenes/Scene3D";
import { SceneFallback } from "./scenes/SceneFallback";
import type {
    CameraPresetName,
    EffectPresetName,
    EnvironmentPresetName,
    LightingPresetName,
} from "./types";

/** R3F render-loop mode (mirrors @react-three/fiber). */
type FrameLoop = "always" | "demand" | "never";

interface Canvas3DProps {
    /** Camera preset to seed the rig with. Defaults to `hero-wide`. */
    cameraPreset?: CameraPresetName;
    /** Lighting setup. Defaults to `studio`. */
    lightingPreset?: LightingPresetName;
    /** Environment source. Defaults to `studio`. */
    environmentPreset?: EnvironmentPresetName;
    /** Effect stack override (defaults to the tier's stack). */
    effectPreset?: EffectPresetName;
    /** Enable desktop orbit controls. Defaults to `true`. */
    enableControls?: boolean;
    /**
     * Skip the generic lighting rig. Use when the scene content brings its own
     * bespoke lighting (e.g. the CloudInfinity hero) to avoid double-lighting.
     * Defaults to `false`.
     */
    disableLighting?: boolean;
    /**
     * Skip the generic environment (fog + HDRI). Use when the scene content
     * brings its own environment. Defaults to `false`.
     */
    disableEnvironment?: boolean;
    /**
     * Called once when FPS drops below the decline threshold for the decline
     * duration (arch §11). Lets the host downgrade the tier at runtime.
     */
    onPerformanceDecline?: () => void;
    /**
     * Called once when FPS recovers above the incline threshold for the incline
     * duration (arch §11). Lets the host upgrade the tier at runtime.
     */
    onPerformanceIncline?: () => void;
    /** Scene content (models, particles, objects). None by default. */
    children?: React.ReactNode;
    /** Fallback rendered while the tier is being detected / assets load. */
    fallback?: React.ReactNode;
    /** Extra classes on the host wrapper. */
    className?: string;
    /**
     * R3F render-loop mode. `"always"` (default) renders every frame; `"demand"`
     * renders only on invalidation; `"never"` stops the loop entirely. The host
     * can toggle this to pause rendering when the canvas is off-screen or the
     * tab is backgrounded (task §Performance: "render only what's visible").
     */
    frameloop?: FrameLoop;
    /**
     * Skip the generic {@link CameraRig} frame loop. Use when the scene content
     * drives the camera itself (e.g. CloudInfinityScene's parallax) so the rig
     * doesn't fight the scene for camera control — eliminating a duplicate
     * per-frame camera write. Defaults to `false`.
     */
    passiveCamera?: boolean;
}

/**
 * The single R3F canvas host (arch §0, component inventory #1). Mounts the
 * WebGL canvas, detects the device tier, and renders either the full 3D scene
 * or the 2D fallback — never both (arch §12).
 *
 * Responsibilities:
 *   - **Tier detection.** Probes WebGL + device capability on mount. While the
 *     probe is pending, the optimistic fallback is shown (no layout shift).
 *   - **Fallback mandate.** When the tier resolves to `"off"`, the 2D
 *     [`SceneFallback`] renders instead of the canvas. WebGL absence never
 *     blocks content (arch §4, §12).
 *   - **Suspense.** 3D assets (models, textures) suspend; the fallback shows
 *     until they resolve.
 *   - **Pixel ratio.** Capped by the tier to protect fill rate (arch §11).
 *
 * This component renders **no models** — it is the reusable host. Content is
 * passed as children into [`Scene3D`].
 *
 * @example
 * ```tsx
 * <Canvas3D lightingPreset="dramatic">
 *   <Orb />
 * </Canvas3D>
 * ```
 */
export function Canvas3D({
    cameraPreset,
    lightingPreset,
    environmentPreset,
    effectPreset,
    enableControls,
    disableLighting = false,
    disableEnvironment = false,
    onPerformanceDecline,
    onPerformanceIncline,
    children,
    fallback,
    className,
    frameloop = "always",
    passiveCamera = false,
}: Canvas3DProps) {
    const tier = useDeviceTier();

    // No WebGL → render the 2D fallback. Never both (arch §12).
    if (tier === "off") {
        return <SceneFallback className={className} />;
    }

    const pixelRatio = TIER_CONFIG[tier].pixelRatio;
    // Shadows are expensive (a separate render pass). Only enable on capable
    // tiers — low/off get the flat look (arch §11).
    const enableShadows = tier === "high" || tier === "medium";

    return (
        <div className={className} aria-hidden="true">
            <Canvas
                // Transparent so the page canvas color shows through (arch §3.5).
                gl={{
                    antialias: false,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                dpr={[1, pixelRatio]}
                shadows={enableShadows}
                frameloop={frameloop}
                camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0, 8] }}
            >
                <Suspense fallback={fallback}>
                    <Scene3D
                        tier={tier}
                        cameraPreset={cameraPreset}
                        lightingPreset={lightingPreset}
                        environmentPreset={environmentPreset}
                        effectPreset={effectPreset}
                        enableControls={enableControls}
                        disableLighting={disableLighting}
                        disableEnvironment={disableEnvironment}
                        onPerformanceDecline={onPerformanceDecline}
                        onPerformanceIncline={onPerformanceIncline}
                        passiveCamera={passiveCamera}
                    >
                        {children}
                    </Scene3D>
                </Suspense>
            </Canvas>
        </div>
    );
}

Canvas3D.displayName = "Canvas3D";
