/**
 * 3D subsystem shared types — Kandarp OS.
 *
 * Union types only (enums are banned per coding-standards §2.2). These describe
 * the contracts defined in docs/threejs-architecture.md and are consumed by
 * every system in src/3d/. Kept local to the 3D layer so the subsystem stays
 * modular and replaceable (folder-structure §4.3).
 */

/** Device capability tier. Drives every system's quality scaling (arch §11). */
export type DeviceTier = "high" | "medium" | "low" | "off";

/** Camera behaviour mode (arch §1.3). */
export type CameraMode = "idle" | "scroll" | "cinematic" | "interactive";

/** Named camera configuration key (arch §1.4). */
export type CameraPresetName =
    "hero-wide" | "hero-close" | "projects-orbit" | "detail-focus";

/** Named lighting setup key (arch §2.4). */
export type LightingPresetName = "studio" | "dramatic" | "soft" | "accent";

/** Named environment source key (arch §3.3). */
export type EnvironmentPresetName = "studio" | "sunset" | "gradient-env";

/** Named post-processing effect stack (arch §6.4). */
export type EffectPresetName = "cinematic" | "clean" | "dreamy" | "off";

/** A complete camera configuration (position, target, fov). */
export interface CameraPreset {
    readonly position: readonly [number, number, number];
    readonly lookAt: readonly [number, number, number];
    readonly fov: number;
}

/** A single light's declarative description. */
export interface LightConfig {
    readonly type: "ambient" | "directional" | "point" | "spot";
    readonly color: string;
    readonly intensity: number;
    readonly position?: readonly [number, number, number];
    readonly castShadow?: boolean;
}

/** A named lighting rig: an ordered list of lights + shadow config. */
export interface LightingPreset {
    readonly lights: readonly LightConfig[];
    /** Shadow map resolution (0 = shadows off). */
    readonly shadowMapSize: number;
}

/** Environment configuration (atmosphere + reflection source). */
export interface EnvironmentPreset {
    readonly name: EnvironmentPresetName;
    /** Scene background color, or "transparent" to keep the canvas clear. */
    readonly background: string;
    readonly fogColor: string;
    readonly fogDensity: number;
    readonly enableFog: boolean;
}

/** Post-processing effect intensities (arch §6.3). 0 = effect disabled. */
export interface EffectPreset {
    readonly bloom: number;
    readonly dof: number;
    readonly vignette: number;
    readonly chromaticAberration: number;
    readonly noise: number;
    readonly smaa: boolean;
}

/** Target camera state settable by external systems (scroll/mouse). */
export interface CameraTarget {
    position: readonly [number, number, number];
    lookAt: readonly [number, number, number];
    fov: number;
}

/** Per-tier render configuration (arch §11). */
export interface TierConfig {
    readonly pixelRatio: number;
    readonly shadowMapSize: number;
    readonly effects: EffectPresetName;
    readonly environment: EnvironmentPresetName;
    readonly frameTarget: number;
}
