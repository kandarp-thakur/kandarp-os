/**
 * coderModel barrel — the 3D mascot of Kandarp OS.
 *
 * A premium stylized human mascot (the signature visual identity of Kandarp
 * OS), built from primitive geometries (zero network weight) with procedural
 * holographic engineering UI textures. This module groups the reusable
 * components:
 *
 *  - [`CoderModel`](./CoderModel.tsx) — the composed figure (realistic
 *    proportions, mature confident face with a strong jawline + defined
 *    cheekbones + short beard + round glasses, modern textured hair with a
 *    clean fade, premium techwear: black turtleneck + open graphite bomber
 *    jacket + dark trousers + premium sneakers + smartwatch; one hand in the
 *    jacket pocket, the other raised to interact with holographic interfaces).
 *  - [`CoderAnimation`](./CoderAnimation.tsx) — the living motion (breathing,
 *    eye movement, subtle blinking, hair/collar movement, right-hand reach
 *    (the left hand rests in the pocket), mouse body rotation).
 *  - [`CoderProps`](./CoderProps.tsx) — the integrated environment (the DevOps
 *    Infinity logo as part of the scene the character controls, floating
 *    holographic engineering UI, data particles, network nodes).
 *  - [`CoderScene`](./CoderScene.tsx) — the in-canvas composition (model +
 *    props + bespoke frameless lighting + environment + contact shadows +
 *    fog).
 *  - [`hologramTextures`](./hologramTextures.ts) — the procedural holographic
 *    engineering UI textures (terminal, git, docker, CI/CD, topology, cloud,
 *    metrics).
 *
 * The host wrapper ([`HeroPortrait3D`](../../components/sections/HeroPortrait3D.tsx))
 * lives with the other sections, not here, because it owns DOM/lazy-load
 * concerns rather than 3D-object concerns.
 */

export { CoderModel } from "./CoderModel";
export type { CoderModelProps } from "./CoderModel";

export { CoderScene } from "./CoderScene";
export type { CoderSceneProps } from "./CoderScene";

export { CoderAnimation } from "./CoderAnimation";
export type { CoderAnimationProps } from "./CoderAnimation";

export { CoderProps } from "./CoderProps";
export type { CoderPropsProps } from "./CoderProps";

export {
    createHologramTexture,
    createHologramTextures,
    HOLOGRAM_KINDS,
} from "./hologramTextures";
export type { HologramKind, HologramTextureOptions } from "./hologramTextures";
