"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
    createHologramTextures,
    HOLOGRAM_KINDS,
} from "../coderModel/hologramTextures";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { DeviceTier } from "../types";

interface EngineeringHologramsProps {
    tier?: DeviceTier;
    center?: [number, number, number];
}

const TIER_PANEL_COUNT: Record<DeviceTier, number> = {
    high: 4,
    medium: 2,
    low: 0,
    off: 0,
};

function EngineeringHologramsImpl({
    tier = "high",
    center = [0, 0, 0],
}: EngineeringHologramsProps) {
    const reducedMotion = useReducedMotion();
    const groupRef = useRef<THREE.Group>(null);
    const count = TIER_PANEL_COUNT[tier];

    const textures = useMemo(
        () =>
            createHologramTextures({
                accentColor: "#38BDF8",
                accentColor2: "#2496ED",
            }),
        [],
    );

    const panels = useMemo(() => {
        const positions: {
            id: string;
            kind: (typeof HOLOGRAM_KINDS)[number];
            position: [number, number, number];
            rotation: [number, number, number];
            scale: [number, number, number];
        }[] = [];

        const layout: [number, number, number][] = [
            [-2.9, 1.35, -0.35],
            [2.65, 1.05, -0.25],
            [-3.15, -0.9, -0.15],
            [2.9, -0.72, -0.2],
            [-1.1, 1.85, -0.55],
            [1.2, -1.55, -0.45],
        ];

        for (let i = 0; i < count; i++) {
            const p = layout[i] ?? [0, 0, 0];
            const side = p[0] < 0 ? 1 : -1;
            positions.push({
                id: `engineering-hologram-${i}`,
                kind: HOLOGRAM_KINDS[i % HOLOGRAM_KINDS.length] ?? "terminal",
                position: [
                    center[0] + p[0],
                    center[1] + p[1],
                    center[2] + p[2],
                ],
                rotation: [0.08, side * 0.32, side * 0.05],
                scale: [0.58, 0.36, 1],
            });
        }
        return positions;
    }, [center, count]);

    useEffect(() => {
        return () => {
            textures.forEach((texture) => texture.dispose());
        };
    }, [textures]);

    useFrame((state) => {
        if (reducedMotion) return;
        const group = groupRef.current;
        if (!group) return;
        const t = state.clock.elapsedTime;
        group.position.y = Math.sin(t * 0.28) * 0.02;
        group.rotation.y = Math.sin(t * 0.12) * 0.014;
    });

    if (count === 0) return null;

    return (
        <group ref={groupRef}>
            {panels.map((panel) => {
                const texture = textures.get(panel.kind) ?? undefined;
                return (
                    <group
                        key={panel.id}
                        position={panel.position}
                        rotation={panel.rotation}
                        scale={panel.scale}
                    >
                        <mesh>
                            <planeGeometry args={[1, 1]} />
                            <meshBasicMaterial
                                color="#07111f"
                                transparent
                                opacity={0.12}
                                depthWrite={false}
                                side={THREE.DoubleSide}
                                blending={THREE.AdditiveBlending}
                                toneMapped={false}
                            />
                        </mesh>
                        {texture ? (
                            <mesh position={[0, 0, 0.012]}>
                                <planeGeometry args={[0.92, 0.92]} />
                                <meshBasicMaterial
                                    map={texture}
                                    transparent
                                    opacity={0.46}
                                    depthWrite={false}
                                    side={THREE.DoubleSide}
                                    blending={THREE.AdditiveBlending}
                                    toneMapped={false}
                                />
                            </mesh>
                        ) : null}
                    </group>
                );
            })}
        </group>
    );
}

export const EngineeringHolograms = memo(EngineeringHologramsImpl);
EngineeringHolograms.displayName = "EngineeringHolograms";
