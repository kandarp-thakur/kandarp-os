/**
 * 3D preset data — Kandarp OS.
 *
 * The single source of truth for camera, lighting, environment, effect, and
 * tier configurations. Systems read this data declaratively; no magic numbers
 * live inside components. Values mirror docs/threejs-architecture.md.
 */

import type {
    CameraPreset,
    CameraPresetName,
    DeviceTier,
    EffectPreset,
    EffectPresetName,
    EnvironmentPreset,
    EnvironmentPresetName,
    LightingPreset,
    LightingPresetName,
    TierConfig,
} from "./types";

/* ------------------------------------------------------------------ */
/* Camera (arch §1.4)                                                  */
/* ------------------------------------------------------------------ */

export const CAMERA_PRESETS: Record<CameraPresetName, CameraPreset> = {
    "hero-wide": { position: [0, 0, 8], lookAt: [0, 0, 0], fov: 50 },
    "hero-close": { position: [0, 0, 5], lookAt: [0, 0, 0], fov: 45 },
    "projects-orbit": { position: [0, 2, 12], lookAt: [0, 0, 0], fov: 55 },
    "detail-focus": { position: [0, 0, 4], lookAt: [0, 0, 0], fov: 40 },
};

/* ------------------------------------------------------------------ */
/* Lighting (arch §2.3, §2.4)                                          */
/* ------------------------------------------------------------------ */

const LIGHT = {
    ambient: { type: "ambient", color: "#FFFFFF", intensity: 0.4 },
    key: {
        type: "directional",
        color: "#FFFFFF",
        intensity: 1.2,
        position: [5, 8, 5],
        castShadow: true,
    },
    fill: {
        type: "directional",
        color: "#EEF0FF",
        intensity: 0.5,
        position: [-5, 3, 2],
    },
    rim: {
        type: "directional",
        color: "#8B5CF6",
        intensity: 0.8,
        position: [0, 5, -8],
    },
    accent: {
        type: "point",
        color: "#6366F1",
        intensity: 2.0,
        position: [0, 2, 4],
    },
} as const;

export const LIGHTING_PRESETS: Record<LightingPresetName, LightingPreset> = {
    // Bright, even, neutral — default product-like look.
    studio: {
        lights: [LIGHT.ambient, LIGHT.key, LIGHT.fill],
        shadowMapSize: 2048,
    },
    // High contrast, strong rim — hero / featured moments.
    dramatic: {
        lights: [
            { ...LIGHT.ambient, intensity: 0.2 },
            { ...LIGHT.key, intensity: 1.6 },
            { ...LIGHT.rim, intensity: 1.4 },
        ],
        shadowMapSize: 2048,
    },
    // Diffused, low contrast — ambient sections.
    soft: {
        lights: [
            { ...LIGHT.ambient, intensity: 0.7 },
            { ...LIGHT.key, intensity: 0.7 },
            { ...LIGHT.fill, intensity: 0.7 },
        ],
        shadowMapSize: 1024,
    },
    // Colored accent dominant — brand moments.
    accent: {
        lights: [
            { ...LIGHT.ambient, intensity: 0.3 },
            LIGHT.key,
            { ...LIGHT.accent, intensity: 3.0 },
            LIGHT.rim,
        ],
        shadowMapSize: 2048,
    },
};

/* ------------------------------------------------------------------ */
/* Environment (arch §3.3, §3.4)                                       */
/* ------------------------------------------------------------------ */

export const ENVIRONMENT_PRESETS: Record<
    EnvironmentPresetName,
    EnvironmentPreset
> = {
    // Default product lighting — neutral, seamless with the page.
    studio: {
        name: "studio",
        background: "transparent",
        fogColor: "#FBFBFD",
        fogDensity: 0.02,
        enableFog: true,
    },
    // Warm hero scenes.
    sunset: {
        name: "sunset",
        background: "transparent",
        fogColor: "#1A1A2E",
        fogDensity: 0.02,
        enableFog: true,
    },
    // Procedural brand gradient — zero asset weight, abstract scenes.
    "gradient-env": {
        name: "gradient-env",
        background: "transparent",
        fogColor: "#FBFBFD",
        fogDensity: 0.015,
        enableFog: false,
    },
};

/* ------------------------------------------------------------------ */
/* Post-processing (arch §6.3, §6.4)                                   */
/* ------------------------------------------------------------------ */

export const EFFECT_PRESETS: Record<EffectPresetName, EffectPreset> = {
    // Subtle Bloom + SMAA only — hero, featured. Redesigned
    // (hero-background-redesign): DOF (bokeh/blur), Noise (film grain), and
    // ChromaticAberration removed — they were the source of the "blurry, noisy,
    // low quality" read. The signature object now reads crisp + premium.
    cinematic: {
        bloom: 0.35,
        dof: 0,
        vignette: 0,
        chromaticAberration: 0,
        noise: 0,
        smaa: true,
    },
    // Subtle Bloom + SMAA only — default, performant.
    clean: {
        bloom: 0.35,
        dof: 0,
        vignette: 0,
        chromaticAberration: 0,
        noise: 0,
        smaa: true,
    },
    // Soft Bloom + SMAA — ambient sections. No DOF, no noise.
    dreamy: {
        bloom: 0.5,
        dof: 0,
        vignette: 0,
        chromaticAberration: 0,
        noise: 0,
        smaa: true,
    },
    // None — low-end devices.
    off: {
        bloom: 0,
        dof: 0,
        vignette: 0,
        chromaticAberration: 0,
        noise: 0,
        smaa: false,
    },
};

/* ------------------------------------------------------------------ */
/* Performance tiers (arch §11)                                        */
/* ------------------------------------------------------------------ */

export const TIER_CONFIG: Record<DeviceTier, TierConfig> = {
    high: {
        pixelRatio: 2,
        shadowMapSize: 2048,
        effects: "cinematic",
        environment: "studio",
        frameTarget: 60,
    },
    medium: {
        pixelRatio: 1.5,
        shadowMapSize: 1024,
        effects: "clean",
        environment: "studio",
        frameTarget: 60,
    },
    low: {
        pixelRatio: 1,
        shadowMapSize: 0,
        effects: "off",
        environment: "gradient-env",
        frameTarget: 30,
    },
    off: {
        pixelRatio: 1,
        shadowMapSize: 0,
        effects: "off",
        environment: "gradient-env",
        frameTarget: 0,
    },
};
