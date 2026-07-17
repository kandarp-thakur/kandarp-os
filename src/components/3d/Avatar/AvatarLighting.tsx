"use client";

import { memo, useMemo } from "react";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

import type { DeviceTier } from "@/3d/types";

interface AvatarLightingProps {
    tier?: DeviceTier;
    enableShadows?: boolean;
}

function AvatarLightingImpl({
    tier = "high",
    enableShadows = true,
}: AvatarLightingProps) {
    const shadowRes = useMemo(() => (tier === "high" ? 1024 : 512), [tier]);
    const contactShadows = enableShadows && tier === "high";

    return (
        <>
            <ambientLight color="#f8fbff" intensity={0.55} />
            <directionalLight
                color="#ffffff"
                intensity={1.05}
                position={[3, 5, 4]}
            />
            <directionalLight
                color="#38BDF8"
                intensity={0.72}
                position={[4, 2, -3]}
            />
            <directionalLight
                color="#2496ED"
                intensity={0.6}
                position={[-4, 3, -4]}
            />
            <pointLight
                color="#2496ED"
                intensity={0.45}
                position={[0, 0.9, -1.8]}
                distance={4}
                decay={2}
            />
            <Environment
                resolution={tier === "high" ? 256 : 128}
                background={false}
                frames={1}
            >
                <Lightformer
                    form="rect"
                    intensity={2.2}
                    position={[0, 5, -4]}
                    scale={[8, 4, 1]}
                    color="#ffffff"
                />
                <Lightformer
                    form="rect"
                    intensity={1.5}
                    position={[-5, 2, 2]}
                    rotation={[0, Math.PI / 2, 0]}
                    scale={[6, 4, 1]}
                    color="#9bb8ff"
                />
                <Lightformer
                    form="rect"
                    intensity={1.2}
                    position={[5, 1, 2]}
                    rotation={[0, -Math.PI / 2, 0]}
                    scale={[6, 4, 1]}
                    color="#326CE5"
                />
            </Environment>
            {contactShadows ? (
                <ContactShadows
                    position={[0, -1.38, 0]}
                    opacity={0.26}
                    scale={4.5}
                    blur={3}
                    far={3}
                    resolution={shadowRes}
                    color="#05060a"
                />
            ) : null}
        </>
    );
}

export const AvatarLighting = memo(AvatarLightingImpl);
AvatarLighting.displayName = "AvatarLighting";
