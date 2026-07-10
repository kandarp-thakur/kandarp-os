"use client";

import { useMemo } from "react";
import type { ReactElement } from "react";
import {
    Bloom,
    ChromaticAberration,
    DepthOfField,
    EffectComposer,
    Noise,
    SMAA,
    Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

import { EFFECT_PRESETS } from "./presets";
import { useReducedMotion } from "./hooks/useReducedMotion";
import type { DeviceTier, EffectPresetName } from "./types";

interface PostProcessingProps {
    /** Named effect stack (arch §6.4). Defaults to `clean`. */
    preset?: EffectPresetName;
    /** Device tier — forces the `off` stack on low/off tiers (arch §6.5). */
    tier?: DeviceTier;
}

/**
 * The post-processing system (arch §6.2). Renders the cinematic effect stack
 * as a final render pass. Effects are the most expensive layer, so they are
 * tier-gated aggressively: low/off tiers render nothing (arch §6.5).
 *
 * Effect order is fixed by the composer (arch §6.5): Bloom → DOF → Vignette →
 * Chromatic Aberration → Noise → SMAA. Each effect is enabled by its preset
 * intensity (0 = disabled, omitted from the stack).
 *
 * `prefers-reduced-motion` disables the animated effects (noise + chromatic
 * shift) per arch §6.5 — the static passes (Bloom, Vignette, SMAA) remain.
 *
 * @example
 * ```tsx
 * <PostProcessing preset="cinematic" tier="high" />
 * ```
 */
export function PostProcessing({
    preset = "clean",
    tier = "high",
}: PostProcessingProps) {
    const reducedMotion = useReducedMotion();

    // Hooks must run unconditionally (rules-of-hooks). The tier/preset gating
    // happens inside the memo and via the early returns below it.
    const disabled = tier === "low" || tier === "off";
    const config = EFFECT_PRESETS[preset];

    // Reduced motion: keep static passes, drop animated noise + chromatic shift.
    const enableChromatic = config.chromaticAberration > 0 && !reducedMotion;
    const enableNoise = config.noise > 0 && !reducedMotion;

    // EffectComposer children must be concrete elements (no nulls), so we
    // build an ordered array of only the enabled effects. Order is fixed by
    // the architecture (arch §6.5). When the tier disables post-processing,
    // the memo short-circuits to an empty array.
    const effects = useMemo(() => {
        if (disabled) {
            return [];
        }

        const list: ReactElement[] = [];

        if (config.bloom > 0) {
            list.push(
                <Bloom
                    key="bloom"
                    intensity={config.bloom}
                    luminanceThreshold={0.6}
                    luminanceSmoothing={0.9}
                    mipmapBlur
                />,
            );
        }

        if (config.dof > 0) {
            list.push(
                <DepthOfField
                    key="dof"
                    focusDistance={0.02}
                    focalLength={0.05}
                    bokehScale={config.dof * 6}
                />,
            );
        }

        if (config.vignette > 0) {
            list.push(
                <Vignette
                    key="vignette"
                    eskil={false}
                    offset={0.3}
                    darkness={config.vignette}
                />,
            );
        }

        if (enableChromatic) {
            list.push(
                <ChromaticAberration
                    key="chromatic"
                    blendFunction={BlendFunction.NORMAL}
                    offset={
                        new THREE.Vector2(
                            config.chromaticAberration,
                            config.chromaticAberration,
                        )
                    }
                    radialModulation={false}
                    modulationOffset={0}
                />,
            );
        }

        if (enableNoise) {
            list.push(
                <Noise
                    key="noise"
                    blendFunction={BlendFunction.SCREEN}
                    opacity={config.noise}
                />,
            );
        }

        if (config.smaa) {
            list.push(<SMAA key="smaa" />);
        }

        return list;
    }, [config, disabled, enableChromatic, enableNoise]);

    // No enabled effects → skip the composer entirely (avoids an empty pass).
    if (effects.length === 0) {
        return null;
    }

    return <EffectComposer multisampling={0}>{effects}</EffectComposer>;
}

PostProcessing.displayName = "PostProcessing";
