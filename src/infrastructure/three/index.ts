/**
 * 3D subsystem barrel — Kandarp OS.
 *
 * Single entry point for the reusable Three.js scene layer (arch §0). Import
 * from `@3d` (see tsconfig path alias). Everything is a Client Component or a
 * client-only hook — the host (`Canvas3D`) is dynamically imported with
 * `{ ssr: false }` by consumers (folder-structure §4.3).
 *
 * Exports the reusable stage only — **no models**. Content (orbs, particles,
 * geometry) is composed by pages as children of `Canvas3D` / `Scene3D`.
 */

/* Host + composed scene ------------------------------------------------ */
export { Canvas3D } from "./Canvas3D";
export { Scene3D } from "./scenes/Scene3D";
export { SceneFallback } from "./scenes/SceneFallback";

/* Core systems --------------------------------------------------------- */
export { CameraRig } from "./CameraRig";
export { LightingRig } from "./LightingRig";
export { Environment3D } from "./Environment3D";
export { PostProcessing } from "./PostProcessing";
export { PerformanceMonitor } from "./PerformanceMonitor";

/* Hooks (state bus + capability detection) ----------------------------- */
export { CameraProvider, useCamera } from "./hooks/useCamera";
export type { CameraApi, CameraState } from "./hooks/useCamera";
export { MouseProvider, useMouse } from "./hooks/useMouse";
export type {
    MouseApi,
    MouseState,
    RaycastTarget,
    RaycastTargetHandlers,
} from "./hooks/useMouse";
export { useRaycaster } from "./hooks/useRaycaster";
export { useDeviceTier } from "./hooks/useDeviceTier";
export { useReducedMotion } from "./hooks/useReducedMotion";
export { useIsDesktop } from "./hooks/useIsDesktop";

/* Preset data (declarative source of truth) ---------------------------- */
export {
    CAMERA_PRESETS,
    LIGHTING_PRESETS,
    ENVIRONMENT_PRESETS,
    EFFECT_PRESETS,
    TIER_CONFIG,
} from "./presets";

/* Types ---------------------------------------------------------------- */
export type {
    CameraMode,
    CameraPreset,
    CameraPresetName,
    CameraTarget,
    DeviceTier,
    EffectPreset,
    EffectPresetName,
    EnvironmentPreset,
    EnvironmentPresetName,
    LightConfig,
    LightingPreset,
    LightingPresetName,
    TierConfig,
} from "./types";
