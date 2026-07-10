"use client";

import { useMemo } from "react";
import * as THREE from "three";

import type { DeviceTier } from "../types";

/**
 * CloudInfinityMaterial — the frosted-glass surface of the signature object.
 *
 * Design contract (task §Materials):
 *  - Frosted glass, semi-transparent.
 *  - Soft reflections, very subtle roughness.
 *  - Thin glowing edge highlights (Fresnel rim).
 *  - No metal, no chrome, no plastic, no bright neon.
 *
 * Implementation strategy:
 *  - On **high/medium** tiers we use `MeshPhysicalMaterial` with `transmission`
 *    for real refractive glass. Transmission gives the premium, semi-transparent
 *    look that catches the environment map and the rim light — the signature
 *    "frosted glass" read.
 *  - On **low** tiers transmission is too expensive (it needs a render pass),
 *    so we fall back to a cheap `MeshStandardMaterial` with low opacity + a
 *    Fresnel-style emissive tint. Same silhouette, fraction of the cost.
 *
 * The Fresnel rim is driven by `iridescence` + `clearcoat` on the physical
 * path and by a precomputed rim term on the standard path. Both produce the
 * thin glowing edge highlight without a custom shader pass — keeping the
 * object a single draw call and GPU-friendly.
 *
 * The material is **theme-aware**: it reads the active theme from the DOM
 * (`data-theme`) so the glass tint + rim color shift between light and dark
 * canvases. This keeps the object seamless against the page (arch §3.5).
 */

export interface CloudInfinityMaterialProps {
    /** Device tier — selects the physical vs standard path (arch §11). */
    tier?: DeviceTier;
    /** Base glass tint. Defaults to a near-white that inherits env color. */
    color?: THREE.ColorRepresentation;
    /** Rim / edge highlight color. Defaults to the brand accent. */
    rimColor?: THREE.ColorRepresentation;
    /** Rim intensity (0–1). Higher = brighter glowing edges. */
    rimIntensity?: number;
    /** Transmission (0–1). Only used on the physical path. */
    transmission?: number;
    /** Surface roughness. Low = polished; higher = frosted. */
    roughness?: number;
    /** Glass thickness for refraction depth (physical path only). */
    thickness?: number;
    /** Index of refraction (physical path only). */
    ior?: number;
}

const LIGHT_TINT = "#ffffff";
const DARK_TINT = "#cdd6f4";
const LIGHT_RIM = "#8b5cf6";
const DARK_RIM = "#7dd3fc";

/**
 * Resolves the active theme from the document root. SSR-safe — defaults to
 * dark (the OS aesthetic default per design-system §13) when unavailable.
 */
function readTheme(): "light" | "dark" {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
}

/**
 * Builds (and memoizes) the frosted-glass material for the CloudInfinity
 * object. Returns a `MeshPhysicalMaterial` on capable tiers and a cheaper
 * `MeshStandardMaterial` on low tiers.
 *
 * The caller is responsible for disposing the material on unmount — R3F does
 * this automatically when the material is attached via the `material` prop or
 * returned from a hook used inside `<mesh>`.
 */
export function useCloudInfinityMaterial(
    props: CloudInfinityMaterialProps = {},
): THREE.Material {
    const {
        tier = "high",
        color,
        rimColor,
        rimIntensity = 0.9,
        // Reduced from 0.86: high transmission samples the empty background
        // (transparent canvas = black), making the glass transmit black and
        // vanish. A lower value keeps the frosted look while letting the
        // surface color + emissive rim define the silhouette.
        transmission = 0.35,
        roughness = 0.14,
        thickness = 0.6,
        ior = 1.4,
    } = props;

    return useMemo(() => {
        const theme = readTheme();
        const baseColor = color ?? (theme === "light" ? LIGHT_TINT : DARK_TINT);
        const rim = rimColor ?? (theme === "light" ? LIGHT_RIM : DARK_RIM);

        // Low tier: cheap standard material, no transmission pass.
        if (tier === "low" || tier === "off") {
            const mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(baseColor),
                roughness: 0.35,
                metalness: 0.0,
                transparent: true,
                opacity: 0.55,
                envMapIntensity: 0.6,
            });
            // Subtle rim via emissive — a faint self-glow on the tint.
            mat.emissive = new THREE.Color(rim);
            mat.emissiveIntensity = rimIntensity * 0.18;
            return mat;
        }

        // High / medium: real refractive frosted glass.
        const mat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(baseColor),
            roughness,
            metalness: 0.0,
            transmission,
            thickness,
            ior,
            // Clearcoat gives the polished, glossy surface with slight
            // imperfection — the "soft reflections" requirement.
            clearcoat: 1.0,
            clearcoatRoughness: 0.12,
            // Iridescence produces the thin, view-dependent edge highlight
            // (Fresnel rim) without a custom shader — premium, not neon.
            iridescence: 1.0,
            iridescenceIOR: 1.3,
            iridescenceThicknessRange: [100, 400],
            // Attenuation tints the glass interior toward the rim color,
            // giving the "thin glowing edge" a coherent hue.
            attenuationColor: new THREE.Color(rim),
            attenuationDistance: 2.5,
            envMapIntensity: 1.1,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
        });

        // A gentle emissive rim so the silhouette reads even where the
        // environment is dark. Bumped from 0.06 so the object is visible
        // against a transparent (dark) canvas — still elegant, not neon.
        mat.emissive = new THREE.Color(rim);
        mat.emissiveIntensity = rimIntensity * 0.22;

        return mat;
    }, [
        tier,
        color,
        rimColor,
        rimIntensity,
        transmission,
        roughness,
        thickness,
        ior,
    ]);
}

/**
 * Imperative factory variant — for callers that build the material outside a
 * hook (e.g. inside a `useMemo` in a component that already manages disposal).
 * Mirrors {@link useCloudInfinityMaterial} exactly.
 */
export function createCloudInfinityMaterial(
    props: CloudInfinityMaterialProps = {},
): THREE.Material {
    // Delegate to the hook's logic by reconstructing the same path. Kept as a
    // standalone function so non-hook callers don't pay the React overhead.
    const {
        tier = "high",
        color,
        rimColor,
        rimIntensity = 0.9,
        transmission = 0.35,
        roughness = 0.14,
        thickness = 0.6,
        ior = 1.4,
    } = props;

    const theme = readTheme();
    const baseColor = color ?? (theme === "light" ? LIGHT_TINT : DARK_TINT);
    const rim = rimColor ?? (theme === "light" ? LIGHT_RIM : DARK_RIM);

    if (tier === "low" || tier === "off") {
        const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(baseColor),
            roughness: 0.35,
            metalness: 0.0,
            transparent: true,
            opacity: 0.55,
            envMapIntensity: 0.6,
        });
        mat.emissive = new THREE.Color(rim);
        mat.emissiveIntensity = rimIntensity * 0.18;
        return mat;
    }

    const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(baseColor),
        roughness,
        metalness: 0.0,
        transmission,
        thickness,
        ior,
        clearcoat: 1.0,
        clearcoatRoughness: 0.12,
        iridescence: 1.0,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [100, 400],
        attenuationColor: new THREE.Color(rim),
        attenuationDistance: 2.5,
        envMapIntensity: 1.1,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
    });
    mat.emissive = new THREE.Color(rim);
    mat.emissiveIntensity = rimIntensity * 0.22;
    return mat;
}
