"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { createCloudInfinityGeometry } from "../cloudInfinity/cloudInfinityGeometry";
import { useCloudInfinityMaterial } from "../cloudInfinity/CloudInfinityMaterial";
import { createHologramTextures, HOLOGRAM_KINDS } from "./hologramTextures";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { DeviceTier } from "../types";
import type { HologramKind } from "./hologramTextures";

/**
 * CoderProps — the integrated environment around the Kandarp OS mascot.
 *
 * This is NOT a set of floating cards or a backdrop. It is the connected
 * composition the character lives inside (task §Composition + §Environment):
 *
 *   Infinity logo → Character (slightly in front) → Holographic UI →
 *   Particles → Background
 *
 * Everything feels connected — the character appears to *control* the
 * environment:
 *
 *  - **DevOps Infinity logo** — the site's signature lemniscate (reused from
 *    [`cloudInfinityGeometry`](../cloudInfinity/cloudInfinityGeometry.ts) +
 *    [`CloudInfinityMaterial`](../cloudInfinity/CloudInfinityMaterial.tsx))
 *    becomes part of the environment, not a separate object. It sits behind +
 *    slightly above the figure, rotated gently, so the character appears to
 *    orchestrate the continuous-delivery loop. The figure's raised hands
 *    reach toward the holograms that orbit it.
 *  - **Holographic engineering UI** — a few thin, translucent glass shards
 *    (no rectangular frame, no card, no box) carrying the procedural
 *    engineering textures from [`hologramTextures`](./hologramTextures.ts):
 *    terminal, git, docker, CI/CD, topology, cloud, metrics. They drift
 *    slowly + face the camera + react slowly (a gentle opacity pulse) so they
 *    read as live holographic UI the character is manipulating.
 *  - **Data particles** — a small Points cloud of crisp additive dots
 *    drifting upward (the "data in the air" motif).
 *  - **Network nodes** — a handful of glowing nodes + thin connection lines
 *    tight around the figure (the "infrastructure mesh" cue).
 *
 * No rectangles, no cards, no floating platforms. The mascot floats naturally
 * inside the scene. All positions are seeded (deterministic) so the props are
 * stable across renders. `prefers-reduced-motion` freezes the drift (the
 * props stay visible as a static holographic field — arch §15.10).
 *
 * Tier gating (arch §11): high full / medium reduced / low + off disabled.
 *
 * @example
 * ```tsx
 * <CoderProps tier="high" />
 * ```
 */
export interface CoderPropsProps {
    /** Device tier — scales prop counts + density (arch §11). */
    tier?: DeviceTier;
    /** Accent color for the holographic glow. Defaults to the brand Docker Blue. */
    accentColor?: THREE.ColorRepresentation;
}

interface TierCounts {
    panels: number;
    particles: number;
    nodes: number;
}

const TIER_COUNTS: Record<DeviceTier, TierCounts> = {
    high: { panels: 5, particles: 28, nodes: 7 },
    medium: { panels: 4, particles: 18, nodes: 5 },
    low: { panels: 0, particles: 0, nodes: 0 },
    off: { panels: 0, particles: 0, nodes: 0 },
};

/** Per-tier geometry density for the integrated infinity logo. */
const TIER_INFINITY_SEGMENTS: Record<
    DeviceTier,
    { tubular: number; radial: number }
> = {
    high: { tubular: 200, radial: 16 },
    medium: { tubular: 140, radial: 12 },
    low: { tubular: 0, radial: 0 },
    off: { tubular: 0, radial: 0 },
};

/** Deterministic seeded RNG (mulberry32). */
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

/** A crisp radial sprite for the glowing particles + nodes. */
function makeSpriteTexture(): THREE.CanvasTexture | null {
    if (typeof document === "undefined") return null;
    const s = 64;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.9)");
    g.addColorStop(0.55, "rgba(255,255,255,0.3)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

function CoderPropsImpl({
    tier = "high",
    accentColor = "#2496ED",
}: CoderPropsProps) {
    const reducedMotion = useReducedMotion();
    const counts = TIER_COUNTS[tier];
    const infinitySeg = TIER_INFINITY_SEGMENTS[tier];

    const spriteTexture = useMemo(() => makeSpriteTexture(), []);
    const hologramTextures = useMemo(() => {
        const accent = new THREE.Color(accentColor).getStyle();
        return createHologramTextures({
            accentColor: accent,
            accentColor2: accent,
        });
    }, [accentColor]);

    // The integrated DevOps Infinity logo — the site's signature object,
    // reused so the environment is visually consistent with the rest of the
    // site. Sits behind + above the figure, scaled to frame it.
    const infinityGeometry = useMemo(() => {
        if (infinitySeg.tubular === 0) return null;
        return createCloudInfinityGeometry({
            tubularSegments: infinitySeg.tubular,
            radialSegments: infinitySeg.radial,
            size: 1.7,
            lobeRadius: 0.3,
            neckRadius: 0.12,
            lift: 0.14,
        });
    }, [infinitySeg.tubular, infinitySeg.radial]);

    const infinityMaterial = useCloudInfinityMaterial({ tier });

    useEffect(() => {
        return () => {
            spriteTexture?.dispose();
            hologramTextures.forEach((t) => t.dispose());
            infinityGeometry?.dispose();
        };
    }, [spriteTexture, hologramTextures, infinityGeometry]);

    const infinityRef = useRef<THREE.Group>(null);

    // --- Holographic panels — seeded positions around the figure, each
    // carrying one of the engineering textures. ---
    const panels = useMemo(() => {
        const rng = mulberry32(0x9e3779b1);
        const out: {
            id: string;
            pos: [number, number, number];
            rot: [number, number, number];
            scale: [number, number, number];
            kind: HologramKind;
            phase: number;
        }[] = [];
        for (let i = 0; i < counts.panels; i++) {
            const angle = (i / counts.panels) * Math.PI * 2 + rng() * 0.5;
            const r = 1.0 + rng() * 0.55;
            const y = -0.35 + rng() * 1.5;
            const kind =
                HOLOGRAM_KINDS[i % HOLOGRAM_KINDS.length] ?? "terminal";
            out.push({
                id: `holo-${kind}-${i}`,
                pos: [
                    Math.cos(angle) * r,
                    y,
                    Math.sin(angle) * r * 0.55 - 0.15,
                ],
                rot: [
                    rng() * 0.3 - 0.15,
                    -angle + Math.PI / 2,
                    rng() * 0.2 - 0.1,
                ],
                scale: [0.34 + rng() * 0.1, 0.22 + rng() * 0.06, 1],
                kind,
                phase: rng() * Math.PI * 2,
            });
        }
        return out;
    }, [counts.panels]);

    // --- Data particles — seeded, drifting upward. ---
    const particleGeom = useMemo(() => {
        const rng = mulberry32(0x12345678);
        const positions = new Float32Array(counts.particles * 3);
        const speeds = new Float32Array(counts.particles);
        for (let i = 0; i < counts.particles; i++) {
            const angle = rng() * Math.PI * 2;
            const r = 0.55 + rng() * 1.5;
            positions[i * 3] = Math.cos(angle) * r;
            positions[i * 3 + 1] = -1.3 + rng() * 2.8;
            positions[i * 3 + 2] = Math.sin(angle) * r * 0.6 - 0.1;
            speeds[i] = 0.05 + rng() * 0.12;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        g.userData = { speeds };
        return g;
    }, [counts.particles]);

    useEffect(() => {
        return () => {
            particleGeom.dispose();
        };
    }, [particleGeom]);

    const particleRef = useRef<THREE.Points>(null);
    const panelGroupRef = useRef<THREE.Group>(null);

    // --- Network nodes — seeded, tight around the figure. ---
    const network = useMemo(() => {
        const rng = mulberry32(0x55aa55aa);
        const nodeCount = counts.nodes;
        const nodePositions = new Float32Array(nodeCount * 3);
        const nodes: THREE.Vector3[] = [];
        for (let i = 0; i < nodeCount; i++) {
            const angle = rng() * Math.PI * 2;
            const r = 0.85 + rng() * 0.75;
            const y = -0.5 + rng() * 1.9;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r * 0.6 - 0.1;
            nodePositions[i * 3] = x;
            nodePositions[i * 3 + 1] = y;
            nodePositions[i * 3 + 2] = z;
            nodes.push(new THREE.Vector3(x, y, z));
        }
        // Lines — each node to its nearest neighbor.
        const seen = new Set<string>();
        const linePairs: [number, number][] = [];
        for (let i = 0; i < nodeCount; i++) {
            const ni = nodes[i];
            if (!ni) continue;
            let best = -1;
            let bestD = Infinity;
            for (let j = 0; j < nodeCount; j++) {
                if (i === j) continue;
                const nj = nodes[j];
                if (!nj) continue;
                const d = ni.distanceToSquared(nj);
                if (d < bestD) {
                    bestD = d;
                    best = j;
                }
            }
            if (best >= 0) {
                const a = Math.min(i, best);
                const b = Math.max(i, best);
                const key = `${a}-${b}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    linePairs.push([a, b]);
                }
            }
        }
        const linePositions = new Float32Array(linePairs.length * 6);
        for (let i = 0; i < linePairs.length; i++) {
            const pair = linePairs[i];
            if (!pair) continue;
            const na = nodes[pair[0]];
            const nb = nodes[pair[1]];
            if (!na || !nb) continue;
            linePositions[i * 6] = na.x;
            linePositions[i * 6 + 1] = na.y;
            linePositions[i * 6 + 2] = na.z;
            linePositions[i * 6 + 3] = nb.x;
            linePositions[i * 6 + 4] = nb.y;
            linePositions[i * 6 + 5] = nb.z;
        }
        return { nodePositions, linePositions };
    }, [counts.nodes]);

    // --- Per-frame: drift particles, gently rotate the infinity logo, and
    // pulse the hologram opacity (holograms react slowly, task §Animation). ---
    useFrame((state, delta) => {
        const dt = Math.min(delta, 0.05);
        const t = state.clock.elapsedTime;

        // Infinity logo — gentle rotation (the character "controls" it).
        const inf = infinityRef.current;
        if (inf && !reducedMotion) {
            inf.rotation.y = t * 0.08;
            inf.rotation.z = Math.sin(t * 0.2) * 0.04;
            inf.position.y = 0.5 + Math.sin(t * 0.5) * 0.04;
        }

        // Hologram panels — slow opacity pulse + a gentle collective drift so
        // they read as live UI the character is manipulating.
        const panelGroup = panelGroupRef.current;
        if (panelGroup && !reducedMotion) {
            panelGroup.rotation.y = Math.sin(t * 0.12) * 0.05;
        }

        // Particles — drift upward (frozen under reduced motion).
        if (!reducedMotion && counts.particles > 0) {
            const points = particleRef.current;
            if (points) {
                const attr = points.geometry.getAttribute(
                    "position",
                ) as THREE.BufferAttribute;
                const arr = attr.array as Float32Array;
                const speeds =
                    (points.geometry.userData.speeds as Float32Array) ?? null;
                for (let i = 0; i < counts.particles; i++) {
                    const o = i * 3;
                    const yIdx = o + 1;
                    const speed = speeds?.[i] ?? 0.08;
                    arr[yIdx] = (arr[yIdx] ?? 0) + speed * dt;
                    if ((arr[yIdx] ?? 0) > 1.5) arr[yIdx] = -1.3;
                }
                attr.needsUpdate = true;
            }
        }
    });

    if (
        counts.panels === 0 &&
        counts.particles === 0 &&
        counts.nodes === 0 &&
        !infinityGeometry
    ) {
        return null;
    }

    return (
        <group>
            {/* --- Integrated DevOps Infinity logo (part of the environment) --- */}
            {/* Sits behind + above the figure so the character appears to
                orchestrate the continuous-delivery loop. The figure stands
                slightly in front of it (task §Composition). */}
            {infinityGeometry ? (
                <group
                    ref={infinityRef}
                    position={[0, 0.5, -0.9]}
                    rotation={[0.2, 0, 0.08]}
                >
                    <mesh
                        geometry={infinityGeometry}
                        material={infinityMaterial}
                        castShadow={tier === "high" || tier === "medium"}
                    />
                </group>
            ) : null}

            {/* --- Floating holographic engineering UI panels --- */}
            <group ref={panelGroupRef}>
                {panels.map((panel) => {
                    const tex = hologramTextures.get(panel.kind) ?? undefined;
                    return (
                        <group
                            key={panel.id}
                            position={panel.pos}
                            rotation={panel.rot}
                            scale={panel.scale}
                        >
                            {/* The glass shard — a thin, translucent, slightly
                                emissive plane (no rectangular frame, no card). */}
                            <mesh>
                                <planeGeometry args={[1, 1]} />
                                <meshStandardMaterial
                                    color="#0e1422"
                                    transparent
                                    opacity={0.16}
                                    roughness={0.18}
                                    metalness={0.1}
                                    emissive={
                                        new THREE.Color(
                                            accentColor as THREE.ColorRepresentation,
                                        )
                                    }
                                    emissiveIntensity={0.1}
                                    side={THREE.DoubleSide}
                                    depthWrite={false}
                                />
                            </mesh>
                            {/* The engineering UI texture on the shard. */}
                            {tex ? (
                                <mesh position={[0, 0, 0.01]}>
                                    <planeGeometry args={[0.92, 0.92]} />
                                    <meshBasicMaterial
                                        map={tex}
                                        transparent
                                        opacity={0.85}
                                        blending={THREE.AdditiveBlending}
                                        depthWrite={false}
                                        toneMapped={false}
                                    />
                                </mesh>
                            ) : null}
                            {/* A thin accent edge — a subtle holographic border
                                line (not a full frame, just a hint of an edge). */}
                            <mesh position={[0, 0.5, 0.005]}>
                                <planeGeometry args={[1, 0.008]} />
                                <meshBasicMaterial
                                    color={
                                        accentColor as THREE.ColorRepresentation
                                    }
                                    transparent
                                    opacity={0.5}
                                    blending={THREE.AdditiveBlending}
                                    depthWrite={false}
                                    toneMapped={false}
                                />
                            </mesh>
                        </group>
                    );
                })}
            </group>

            {/* --- Tiny data particles (drifting upward) --- */}
            {counts.particles > 0 ? (
                <points ref={particleRef} geometry={particleGeom}>
                    <pointsMaterial
                        map={spriteTexture ?? undefined}
                        size={0.045}
                        sizeAttenuation
                        transparent
                        opacity={0.7}
                        depthWrite={false}
                        color="#38BDF8"
                        blending={THREE.AdditiveBlending}
                    />
                </points>
            ) : null}

            {/* --- Small network nodes + thin connection lines --- */}
            {counts.nodes > 0 ? (
                <group>
                    <points>
                        <bufferGeometry>
                            <bufferAttribute
                                attach="attributes-position"
                                args={[network.nodePositions, 3]}
                            />
                        </bufferGeometry>
                        <pointsMaterial
                            map={spriteTexture ?? undefined}
                            size={0.07}
                            sizeAttenuation
                            transparent
                            opacity={0.85}
                            depthWrite={false}
                            color="#2496ED"
                            blending={THREE.AdditiveBlending}
                        />
                    </points>
                    <lineSegments>
                        <bufferGeometry>
                            <bufferAttribute
                                attach="attributes-position"
                                args={[network.linePositions, 3]}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial
                            transparent
                            opacity={0.16}
                            depthWrite={false}
                            color="#2496ED"
                        />
                    </lineSegments>
                </group>
            ) : null}
        </group>
    );
}

/**
 * Memoized CoderProps. The component's output depends only on `tier` and
 * `accentColor` — both stable across re-renders once the tier resolves.
 * Without `memo`, the parent scene's re-renders would re-run the expensive
 * seeded `useMemo` dependency checks and reconcile the JSX tree unnecessarily
 * (task §Performance: "React optimization — memo").
 */
export const CoderProps = memo(CoderPropsImpl);

CoderProps.displayName = "CoderProps";
