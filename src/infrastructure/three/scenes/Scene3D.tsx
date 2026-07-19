"use client";

import { CameraRig } from "../CameraRig";
import { Environment3D } from "../Environment3D";
import { LightingRig } from "../LightingRig";
import { PerformanceMonitor } from "../PerformanceMonitor";
import { PostProcessing } from "../PostProcessing";
import { MouseProvider } from "../hooks/useMouse";
import { TIER_CONFIG } from "../presets";
import type {
    CameraPresetName,
    DeviceTier,
    EffectPresetName,
    EnvironmentPresetName,
    LightingPresetName,
} from "../types";

interface Scene3DProps {
    /** Device tier — drives every system's quality scaling. */
    tier: DeviceTier;
    /** Camera preset to seed the rig with. Defaults to `hero-wide`. */
    cameraPreset?: CameraPresetName;
    /** Lighting setup. Defaults to `studio`. */
    lightingPreset?: LightingPresetName;
    /** Environment source. Defaults to `studio`. */
    environmentPreset?: EnvironmentPresetName;
    /**
     * Effect stack override. When omitted, the tier's default stack is used
     * (arch §11) — e.g. `cinematic` on high, `clean` on medium, `off` on low.
     */
    effectPreset?: EffectPresetName;
    /** Enable desktop orbit controls. Defaults to `true`. */
    enableControls?: boolean;
    /**
     * Skip the generic {@link LightingRig}. Use when the scene content brings
     * its own bespoke lighting (e.g. the CloudInfinity hero's
     * [`EnvironmentLights`](../cloudInfinity/EnvironmentLights.tsx)) to avoid
     * double-lighting. Defaults to `false`.
     */
    disableLighting?: boolean;
    /**
     * Skip the generic {@link Environment3D} (fog + HDRI). Use when the scene
     * content brings its own environment to avoid a second fog/HDRI pass.
     * Defaults to `false`.
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
    /**
     * Skip the generic {@link CameraRig} frame loop. Use when the scene content
     * drives the camera itself (e.g. CloudInfinityScene's parallax) so the rig
     * doesn't fight the scene for camera control — eliminating a duplicate
     * per-frame camera write. Defaults to `false`.
     */
    passiveCamera?: boolean;
}

/**
 * A composed, reusable 3D scene (arch §0). Assembles the four core systems —
 * Camera, Lighting, Environment, and Post-Processing — into a single
 * declarative unit. Scenes are JSX; logic lives in hooks (arch §15.9).
 *
 * The tier is the master switch: it flows into every system so quality scales
 * consistently. Effect preset defaults to the tier's configured stack unless
 * explicitly overridden.
 *
 * This component renders **no models** — it is the reusable stage. Content is
 * passed as children so each page composes its own scene without rebuilding
 * the rig.
 *
 * @example
 * ```tsx
 * <Scene3D tier="high" lightingPreset="dramatic">
 *   <Orb />
 * </Scene3D>
 * ```
 */
export function Scene3D({
    tier,
    cameraPreset = "hero-wide",
    lightingPreset = "studio",
    environmentPreset = "studio",
    effectPreset,
    enableControls = true,
    disableLighting = false,
    disableEnvironment = false,
    onPerformanceDecline,
    onPerformanceIncline,
    children,
    passiveCamera = false,
}: Scene3DProps) {
    // Effect stack defaults to the tier's configured preset (arch §11) unless
    // the caller explicitly overrides it.
    const effects = effectPreset ?? TIER_CONFIG[tier].effects;

    // The mouse interaction system (arch §8) wraps the scene content so any
    // descendant can register pickable targets via useRaycaster / useMouse.
    // The performance monitor (arch §11) runs inside the frame loop and reports
    // sustained declines/inclines so the host can adjust the tier at runtime.
    return (
        <CameraRig
            initialPreset={cameraPreset}
            enableControls={enableControls}
            passive={passiveCamera}
        >
            {disableLighting ? null : (
                <LightingRig preset={lightingPreset} tier={tier} />
            )}
            {disableEnvironment ? null : (
                <Environment3D preset={environmentPreset} tier={tier} />
            )}
            <MouseProvider>{children}</MouseProvider>
            <PostProcessing preset={effects} tier={tier} />
            <PerformanceMonitor
                onDecline={onPerformanceDecline}
                onIncline={onPerformanceIncline}
            />
        </CameraRig>
    );
}

Scene3D.displayName = "Scene3D";
