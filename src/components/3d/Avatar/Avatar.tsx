"use client";

import { memo, useEffect, useRef } from "react";
import { Clone, useGLTF } from "@react-three/drei";
import type * as THREE from "three";

import { AvatarAnimation } from "./AvatarAnimation";
import { findAvatarHead, useAvatarTransform } from "./AvatarHooks";
import type { AvatarSettings } from "./AvatarMaterials";

interface AvatarProps {
    settings: AvatarSettings;
}

function AvatarImpl({ settings }: AvatarProps) {
    const rootRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Object3D | null>(null);
    const { scene } = useGLTF(settings.avatarUrl);
    const transform = useAvatarTransform(settings);

    useEffect(() => {
        headRef.current = findAvatarHead(scene);
        scene.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh) return;
            mesh.castShadow = settings.enableShadows;
            mesh.receiveShadow = settings.enableShadows;
            const material = mesh.material as
                THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(material)) {
                material.forEach((m) => (m.needsUpdate = true));
            } else if (material) {
                material.needsUpdate = true;
            }
        });
    }, [scene, settings.enableShadows]);

    return (
        <group
            ref={rootRef}
            position={transform.position}
            rotation={transform.rotation}
            scale={transform.scale}
        >
            <Clone object={scene} />
            <AvatarAnimation
                rootRef={rootRef}
                headRef={headRef}
                enabled={settings.idleAnimation}
                mouseFollow={settings.mouseFollow}
                speed={settings.animationSpeed}
            />
        </group>
    );
}

export const Avatar = memo(AvatarImpl);
Avatar.displayName = "Avatar";
