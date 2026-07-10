"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useReducedMotion } from "../hooks/useReducedMotion";
import type { DeviceTier } from "../types";

/**
 * CloudParticles — the soft floating cloud puffs around the signature object.
 *
 * Design contract (task §Environment):
 *  - Small floating cloud particles — soft, semi-transparent, white-cool.
 *  - Slow, calm drift (never fast, never distracting).
 *  - Minimal — they support the main object, never compete with it.
 *
 * Implementation:
 *  - A single `Points` cloud with a soft radial sprite texture (generated once,
 *    no asset fetch). `sizeAttenuation` makes the near puffs larger and the far
 *    puffs smaller, giving a sense of depth.
 *  - Per-puff drift is driven from one `useFrame` loop that mutates the position
 *    buffer in place — no React re-renders, no per-puff JS objects (arch §15.5).
 *  - Motion is composed of a slow lateral sway + a gentle vertical rise, each
 *    puff phase-offset so the cloud never reads as synchronized.
 *  - `prefers-reduced-motion` freezes the puffs in place (they stay visible as a
 *    static cloud mass — arch §15.10).
 *
 * Tier gating (arch §11): high 18 / medium 12 / low 6 / off 0. The geometry +
 * texture are rebuilt only when the count changes.
 *
 * @example
 * ```tsx
 * <CloudParticles tier="high" center={[2.4, -0.4, 0]} radius={4.5} />
 * ```
 */
export interface CloudParticlesProps {
    /** Device tier — scales the puff count (arch §11). */
    tier?: DeviceTier;
    /** Override the puff count (otherwise tier-scaled). */
    count?: number;
    /** Center of the cloud (the object's world position). */
    center?: [number, number, number];
    /** Spread radius around the center. Default 4.5. */
    radius?: number;
}

const TIER_COUNT: Record<DeviceTier, number> = {
    high: 18,
    medium: 12,
    low: 6,
    off: 0,
};

/** Deterministic seeded RNG (mulberry32) so the layout is stable across renders. */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** A soft radial sprite — the "cloud puff" look. White alpha → tinted by the material. */
function makeSoftTexture(): THREE.CanvasTexture | null {
    if (typeof document === "undefined") return null;
    const s = 64;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

function CloudParticlesImpl({
    tier = "high",
    count,
    center = [0, 0, 0],
    radius = 4.5,
}: CloudParticlesProps) {
    const reducedMotion = useReducedMotion();
    const n = count ?? TIER_COUNT[tier];

    const texture = useMemo(() => makeSoftTexture(), []);

    // Dispose the CanvasTexture on unmount to avoid GPU memory leaks
    // (task §Performance: "dispose textures"). Previously the texture was
    // created but never disposed — a leak on every tier change / unmount.
    useEffect(() => {
        return () => {
            texture?.dispose();
        };
    }, [texture]);

    const geomRef = useRef<THREE.BufferGeometry>(null);

    // Base positions + per-puff drift params — all stable Float32Arrays.
    const data = useMemo(() => {
        const positions = new Float32Array(n * 3);
        const base = new Float32Array(n * 3);
        const drift = new Float32Array(n * 3);
        const phase = new Float32Array(n);
        const speed = new Float32Array(n);
        const rise = new Float32Array(n);

        const rng = mulberry32(0x9e3779b9);
        for (let i = 0; i < n; i++) {
            // Random point in a flattened sphere shell around the center.
            const u = rng();
            const v = rng();
            const r = radius * (0.35 + 0.65 * rng());
            const theta = u * Math.PI * 2;
            const phi = Math.acos(2 * v - 1);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta) * 0.55; // flatter in Y
            const z = r * Math.cos(phi) * 0.7;
            base[i * 3] = center[0] + x;
            base[i * 3 + 1] = center[1] + y;
            base[i * 3 + 2] = center[2] + z;
            positions[i * 3] = base[i * 3] ?? 0;
            positions[i * 3 + 1] = base[i * 3 + 1] ?? 0;
            positions[i * 3 + 2] = base[i * 3 + 2] ?? 0;
            drift[i * 3] = (rng() - 0.5) * 0.5;
            drift[i * 3 + 1] = (rng() - 0.5) * 0.3;
            drift[i * 3 + 2] = (rng() - 0.5) * 0.5;
            phase[i] = rng() * Math.PI * 2;
            speed[i] = 0.12 + rng() * 0.18; // very slow
            rise[i] = 0.08 + rng() * 0.12; // gentle vertical rise
        }
        return { positions, base, drift, phase, speed, rise };
    }, [n, center, radius]);

    useFrame(() => {
        if (reducedMotion || n === 0) return;
        const geom = geomRef.current;
        if (!geom) return;
        const attr = geom.getAttribute("position") as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        const t = performance.now() * 0.001;
        const { base, drift, phase, speed, rise } = data;
        for (let i = 0; i < n; i++) {
            const o = i * 3;
            const sp = speed[i] ?? 0.15;
            const ph = phase[i] ?? 0;
            const rs = rise[i] ?? 0.1;
            const s = Math.sin(t * sp + ph);
            arr[o] = (base[o] ?? 0) + (drift[o] ?? 0) * s;
            arr[o + 1] =
                (base[o + 1] ?? 0) +
                (drift[o + 1] ?? 0) * s +
                Math.sin(t * 0.3 + ph) * rs;
            arr[o + 2] = (base[o + 2] ?? 0) + (drift[o + 2] ?? 0) * s;
        }
        attr.needsUpdate = true;
    });

    if (n === 0) return null;

    return (
        <points frustumCulled={false}>
            <bufferGeometry ref={geomRef}>
                <bufferAttribute
                    attach="attributes-position"
                    args={[data.positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                map={texture ?? undefined}
                size={1.5}
                sizeAttenuation
                transparent
                opacity={0.4}
                depthWrite={false}
                color="#e8eeff"
                blending={THREE.NormalBlending}
            />
        </points>
    );
}

/**
 * Memoized CloudParticles. The component's output depends only on `tier`,
 * `count`, `center`, and `radius` — all stable across re-renders once the
 * tier resolves. Without `memo`, the parent scene's re-renders would re-run
 * the position-buffer `useMemo` dependency checks and reconcile the JSX tree
 * unnecessarily (task §Performance: "React optimization — memo").
 */
export const CloudParticles = memo(CloudParticlesImpl);

CloudParticles.displayName = "CloudParticles";
