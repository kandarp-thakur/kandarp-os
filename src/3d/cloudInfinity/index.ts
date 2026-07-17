/**
 * CloudInfinity barrel — the signature 3D object of Kandarp OS.
 *
 * One unified shape merging Cloud + DevOps Infinity Loop into a single
 * continuous frosted-glass form. This module groups the reusable components
 * required by the task (§Technical Requirements):
 *
 *  - [`CloudInfinity`](./CloudInfinity.tsx) — the composed object.
 *  - [`CloudInfinityMaterial`](./CloudInfinityMaterial.tsx) — frosted glass.
 *  - [`CloudInfinityAnimation`](./CloudInfinityAnimation.tsx) — living motion.
 *  - [`CloudInfinityLights`](./CloudInfinityLights.tsx) — object-local accents.
 *  - [`EnvironmentLights`](./EnvironmentLights.tsx) — scene-level environment
 *    (ambient + directional + rim + HDR + contact shadows + fog).
 *  - [`CloudParticles`](./CloudParticles.tsx) — soft floating cloud puffs.
 *  - [`NetworkNodes`](./NetworkNodes.tsx) — glowing nodes + lines + packets.
 *  - [`cloudInfinityGeometry`](./cloudInfinityGeometry.ts) — the lemniscate tube.
 *  - [`CloudInfinityScene`](./CloudInfinityScene.tsx) — in-canvas composition.
 *
 * The host wrapper ([`CloudInfinityBackground`](../../components/background/CloudInfinityBackground.tsx))
 * lives with the other backgrounds, not here, because it owns DOM/lazy-load
 * concerns rather than 3D-object concerns.
 */

export { CloudInfinity } from "./CloudInfinity";
export type { CloudInfinityProps } from "./CloudInfinity";
export type { BreathRef } from "../types";

export { CloudInfinityScene } from "./CloudInfinityScene";
export type { CloudInfinitySceneProps } from "./CloudInfinityScene";

export {
    useCloudInfinityMaterial,
    createCloudInfinityMaterial,
} from "./CloudInfinityMaterial";
export type { CloudInfinityMaterialProps } from "./CloudInfinityMaterial";

export { CloudInfinityLights } from "./CloudInfinityLights";
export type { CloudInfinityLightsProps } from "./CloudInfinityLights";

export { EnvironmentLights } from "./EnvironmentLights";
export type { EnvironmentLightsProps } from "./EnvironmentLights";

export { CloudParticles } from "./CloudParticles";
export type { CloudParticlesProps } from "./CloudParticles";

export { NetworkNodes } from "./NetworkNodes";
export type { NetworkNodesProps } from "./NetworkNodes";

export { CloudInfinityAnimation } from "./CloudInfinityAnimation";
export type { CloudInfinityAnimationProps } from "./CloudInfinityAnimation";

export { createCloudInfinityGeometry } from "./cloudInfinityGeometry";
export type { CloudInfinityGeometryOptions } from "./cloudInfinityGeometry";
