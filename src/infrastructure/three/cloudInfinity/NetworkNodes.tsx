"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useReducedMotion } from "../hooks/useReducedMotion";
import type { DeviceTier } from "../types";

/**
 * NetworkNodes — the cloud-infrastructure motif around the signature object.
 *
 * Design contract (task §Environment):
 *  - Tiny glowing nodes (the "servers" / "pods").
 *  - Thin network connection lines (the "infrastructure mesh").
 *  - Data packets traveling along the lines (the "continuous delivery").
 *  - Minimal — they support the main object, never compete with it.
 *
 * Implementation (three cheap draw calls, all tier-gated):
 *  - **Nodes**: a `Points` cloud with a crisp radial sprite, small size, blue/
 *    Docker Blue tint, additive blending for the soft glow. Static positions.
 *  - **Lines**: `LineSegments` connecting each node to its 2 nearest neighbors,
 *    thin, low-opacity, blue. Static.
 *  - **Data packets**: a small `Points` cloud whose positions are animated each
 *    frame along a subset of the lines (progress 0→1, looping). This is the
 *    "data flowing through the network" — the only per-frame work, and it only
 *    touches a handful of points.
 *
 * All positions are seeded (deterministic) so the network is stable across
 * renders. `prefers-reduced-motion` freezes the packets in place (the nodes +
 * lines stay visible as a static mesh — arch §15.10).
 *
 * Tier gating (arch §11): high full / medium reduced / low + off disabled.
 *
 * @example
 * ```tsx
 * <NetworkNodes tier="high" center={[2.4, -0.4, 0]} radius={3.2} />
 * ```
 */
export interface NetworkNodesProps {
    /** Device tier — scales node/line/packet counts (arch §11). */
    tier?: DeviceTier;
    /** Center of the network (the object's world position). */
    center?: [number, number, number];
    /** Spread radius around the center. Default 3.2 (tighter than cloud puffs). */
    radius?: number;
}

interface TierCounts {
    nodes: number;
    packets: number;
}

const TIER_COUNTS: Record<DeviceTier, TierCounts> = {
    high: { nodes: 12, packets: 3 },
    medium: { nodes: 8, packets: 2 },
    low: { nodes: 0, packets: 0 },
    off: { nodes: 0, packets: 0 },
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

/** A crisp radial sprite for the glowing nodes + packets. */
function makeNodeTexture(): THREE.CanvasTexture | null {
    if (typeof document === "undefined") return null;
    const s = 64;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(255,255,255,0.95)");
    g.addColorStop(0.5, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

function NetworkNodesImpl({
    tier = "high",
    center = [0, 0, 0],
    radius = 3.2,
}: NetworkNodesProps) {
    const reducedMotion = useReducedMotion();
    const counts = TIER_COUNTS[tier];
    const nodeCount = counts.nodes;
    const packetCount = counts.packets;

    const texture = useMemo(() => makeNodeTexture(), []);

    // Dispose the CanvasTexture on unmount to avoid GPU memory leaks
    // (task §Performance: "dispose textures"). Previously the texture was
    // created but never disposed — a leak on every tier change / unmount.
    useEffect(() => {
        return () => {
            texture?.dispose();
        };
    }, [texture]);

    const packetPointsRef = useRef<THREE.Points>(null);

    // Build the network: node positions, nearest-2 lines, and packet routes.
    const network = useMemo(() => {
        const rng = mulberry32(0x85ebca77);

        // Nodes — seeded in a flattened sphere shell.
        const nodePositions = new Float32Array(nodeCount * 3);
        const nodes: THREE.Vector3[] = [];
        for (let i = 0; i < nodeCount; i++) {
            const u = rng();
            const v = rng();
            const r = radius * (0.5 + 0.5 * rng());
            const theta = u * Math.PI * 2;
            const phi = Math.acos(2 * v - 1);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta) * 0.6;
            const z = r * Math.cos(phi) * 0.7;
            const px = center[0] + x;
            const py = center[1] + y;
            const pz = center[2] + z;
            nodePositions[i * 3] = px;
            nodePositions[i * 3 + 1] = py;
            nodePositions[i * 3 + 2] = pz;
            nodes.push(new THREE.Vector3(px, py, pz));
        }

        // Lines — each node connected to its 2 nearest neighbors (dedup).
        const seen = new Set<string>();
        const linePairs: [number, number][] = [];
        for (let i = 0; i < nodeCount; i++) {
            const dists: { j: number; d: number }[] = [];
            for (let j = 0; j < nodeCount; j++) {
                if (i === j) continue;
                const ni = nodes[i];
                const nj = nodes[j];
                if (!ni || !nj) continue;
                dists.push({ j, d: ni.distanceToSquared(nj) });
            }
            dists.sort((a, b) => a.d - b.d);
            for (let k = 0; k < Math.min(2, dists.length); k++) {
                const dj = dists[k];
                if (!dj) continue;
                const a = Math.min(i, dj.j);
                const b = Math.max(i, dj.j);
                const key = `${a}-${b}`;
                if (seen.has(key)) continue;
                seen.add(key);
                linePairs.push([a, b]);
            }
        }

        const linePositions = new Float32Array(linePairs.length * 6);
        for (let i = 0; i < linePairs.length; i++) {
            const pair = linePairs[i];
            if (!pair) continue;
            const [a, b] = pair;
            const na = nodes[a];
            const nb = nodes[b];
            if (!na || !nb) continue;
            linePositions[i * 6] = na.x;
            linePositions[i * 6 + 1] = na.y;
            linePositions[i * 6 + 2] = na.z;
            linePositions[i * 6 + 3] = nb.x;
            linePositions[i * 6 + 4] = nb.y;
            linePositions[i * 6 + 5] = nb.z;
        }

        // Packets — each rides a random line, with its own speed + phase offset.
        const packetPositions = new Float32Array(packetCount * 3);
        const packetRoutes: {
            a: number;
            b: number;
            speed: number;
            progress: number;
        }[] = [];
        for (let i = 0; i < packetCount; i++) {
            const pair = linePairs[Math.floor(rng() * linePairs.length)];
            if (!pair) continue;
            const [a, b] = pair;
            packetRoutes.push({
                a,
                b,
                speed: 0.08 + rng() * 0.14,
                progress: rng(),
            });
        }

        return {
            nodePositions,
            linePositions,
            packetPositions,
            packetRoutes,
            nodes,
        };
    }, [nodeCount, packetCount, center, radius]);

    useFrame((_, delta) => {
        if (reducedMotion || packetCount === 0) return;
        const points = packetPointsRef.current;
        const geom = points?.geometry as THREE.BufferGeometry | undefined;
        if (!geom) return;
        const attr = geom.getAttribute("position") as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        const dt = Math.min(delta, 0.033);
        const { packetRoutes, nodes } = network;

        for (let i = 0; i < packetCount; i++) {
            const route = packetRoutes[i];
            if (!route) continue;
            route.progress += route.speed * dt;
            if (route.progress > 1) route.progress -= 1;
            const na = nodes[route.a];
            const nb = nodes[route.b];
            if (!na || !nb) continue;
            const p = route.progress;
            const o = i * 3;
            arr[o] = na.x + (nb.x - na.x) * p;
            arr[o + 1] = na.y + (nb.y - na.y) * p;
            arr[o + 2] = na.z + (nb.z - na.z) * p;
        }
        attr.needsUpdate = true;
    });

    if (nodeCount === 0) return null;

    return (
        <group>
            {/* Glowing nodes — static. */}
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[network.nodePositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    map={texture ?? undefined}
                    size={0.18}
                    sizeAttenuation
                    transparent
                    opacity={0.88}
                    depthWrite={false}
                    color="#38BDF8"
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Thin connection lines — static. */}
            <lineSegments>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[network.linePositions, 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial
                    transparent
                    opacity={0.14}
                    depthWrite={false}
                    color="#326CE5"
                />
            </lineSegments>

            {/* Data packets — animated along the lines. */}
            {packetCount > 0 ? (
                <points ref={packetPointsRef}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            args={[network.packetPositions, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        map={texture ?? undefined}
                        size={0.13}
                        sizeAttenuation
                        transparent
                        opacity={1}
                        depthWrite={false}
                        color="#FF9900"
                        blending={THREE.AdditiveBlending}
                    />
                </points>
            ) : null}
        </group>
    );
}

/**
 * Memoized NetworkNodes. The component's output depends only on `tier`,
 * `center`, and `radius` — all of which are stable across re-renders once the
 * tier resolves. Without `memo`, the parent scene's re-renders (e.g. from
 * `useIsDesktop` / `useReducedMotion` settling) would re-run the expensive
 * network-building `useMemo` dependency checks and reconcile the JSX tree
 * unnecessarily (task §Performance: "React optimization — memo").
 */
export const NetworkNodes = memo(NetworkNodesImpl);

NetworkNodes.displayName = "NetworkNodes";
