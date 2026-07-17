"use client";

import { memo, Suspense, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { DeviceTier } from "@/3d/types";

import { Avatar } from "./Avatar";
import { AvatarController } from "./AvatarController";
import { AvatarLighting } from "./AvatarLighting";
import { AvatarLoader } from "./AvatarLoader";
import { useAvatarSettings } from "./AvatarHooks";
import type { AvatarSettings } from "./AvatarMaterials";

interface AvatarSceneProps {
    settings?: Partial<AvatarSettings> | null;
    tier?: DeviceTier;
}

function AvatarSceneImpl({ settings, tier = "high" }: AvatarSceneProps) {
    const resolved = useAvatarSettings(settings);
    const avatarSettings = useMemo(
        () => ({
            ...resolved,
            avatarScale: resolved.avatarScale * 0.68,
            avatarPosition: [
                resolved.avatarPosition[0] + 0.42,
                resolved.avatarPosition[1] - 0.02,
                resolved.avatarPosition[2] + 0.22,
            ] as [number, number, number],
        }),
        [resolved],
    );
    const { camera } = useThree();
    const basePos = useMemo(() => new THREE.Vector3(0.35, 0.2, 4.8), []);
    const targetPos = useRef(basePos.clone());
    const fogColor = useMemo(() => {
        if (typeof document === "undefined") return "#0a0a0f";
        return document.documentElement.getAttribute("data-theme") === "light"
            ? "#fbfbfd"
            : "#0a0a0f";
    }, []);

    useFrame((state, delta) => {
        if (!resolved.mouseFollow) return;
        const pointer = state.pointer;
        targetPos.current.set(
            basePos.x + pointer.x * 0.18,
            basePos.y + pointer.y * 0.12,
            basePos.z,
        );
        const f = 1 - Math.pow(1 - 0.045, delta * 60);
        camera.position.lerp(targetPos.current, f);
        camera.lookAt(0.35, 0.08, 0);
    });

    return (
        <>
            <AvatarController enableBloom={resolved.enableBloom} />
            <AvatarLighting
                tier={tier}
                enableShadows={resolved.enableShadows}
            />
            {avatarSettings.avatarUrl ? (
                <Suspense fallback={<AvatarLoader />}>
                    <Avatar settings={avatarSettings} />
                </Suspense>
            ) : null}
            <fogExp2 attach="fog" args={[fogColor, 0.014]} />
        </>
    );
}

export const AvatarScene = memo(AvatarSceneImpl);
AvatarScene.displayName = "AvatarScene";
