"use client";

import { useMemo } from "react";
import type * as THREE from "three";

import {
    DEFAULT_AVATAR_SETTINGS,
    normalizeAvatarSettings,
    type AvatarSettings,
} from "./AvatarMaterials";

export function useAvatarSettings(
    settings?: Partial<AvatarSettings> | null,
): AvatarSettings {
    return useMemo(() => normalizeAvatarSettings(settings), [settings]);
}

export function useAvatarTransform(settings: AvatarSettings) {
    return useMemo(
        () => ({
            scale: settings.avatarScale || DEFAULT_AVATAR_SETTINGS.avatarScale,
            position: settings.avatarPosition,
            rotation: settings.avatarRotation,
        }),
        [
            settings.avatarPosition,
            settings.avatarRotation,
            settings.avatarScale,
        ],
    );
}

export function findAvatarHead(root: THREE.Object3D): THREE.Object3D | null {
    let head: THREE.Object3D | null = null;
    root.traverse((child) => {
        const name = child.name.toLowerCase();
        if (!head && (name.includes("head") || name.includes("neck"))) {
            head = child;
        }
    });
    return head;
}
