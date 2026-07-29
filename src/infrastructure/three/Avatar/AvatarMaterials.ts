"use client";

import type * as THREE from "three";

export interface AvatarSettings {
    avatarUrl: string;
    avatarScale: number;
    avatarPosition: [number, number, number];
    avatarRotation: [number, number, number];
    animationSpeed: number;
    idleAnimation: boolean;
    mouseFollow: boolean;
    enableShadows: boolean;
    enableBloom: boolean;
}

export interface AvatarRuntimeRefs {
    rootRef: React.RefObject<THREE.Group>;
    headRef: React.RefObject<THREE.Object3D | null>;
}

export const DEFAULT_AVATAR_SETTINGS: AvatarSettings = {
    avatarUrl: "",
    avatarScale: 1,
    avatarPosition: [0, -1.35, 0],
    avatarRotation: [0, 0, 0],
    animationSpeed: 1,
    idleAnimation: true,
    mouseFollow: true,
    enableShadows: true,
    enableBloom: true,
};

export function normalizeAvatarSettings(
    settings?: Partial<AvatarSettings> | null,
): AvatarSettings {
    return {
        ...DEFAULT_AVATAR_SETTINGS,
        ...(settings ?? {}),
        avatarUrl:
            settings?.avatarUrl?.trim() ?? DEFAULT_AVATAR_SETTINGS.avatarUrl,
    };
}
