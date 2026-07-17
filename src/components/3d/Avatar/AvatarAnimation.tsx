"use client";

import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

import { useMouse } from "@/3d/hooks/useMouse";
import { useReducedMotion } from "@/3d/hooks/useReducedMotion";

interface AvatarAnimationProps {
    rootRef: React.RefObject<THREE.Group | null>;
    headRef: React.RefObject<THREE.Object3D | null>;
    enabled?: boolean;
    mouseFollow?: boolean;
    speed?: number;
}

function AvatarAnimationImpl({
    rootRef,
    headRef,
    enabled = true,
    mouseFollow = true,
    speed = 1,
}: AvatarAnimationProps) {
    const reducedMotion = useReducedMotion();
    const { stateRef: mouseStateRef } = useMouse();
    const rotY = useRef(0);
    const headX = useRef(0);
    const headY = useRef(0);
    const phase = useRef(Math.random() * Math.PI * 2);

    useFrame((_, delta) => {
        const root = rootRef.current;
        if (!root) return;

        const dt = Math.min(delta, 0.05);
        const f = 1 - Math.pow(1 - 0.055, dt * 60);
        const t = performance.now() * 0.001 * Math.max(speed, 0.1);

        if (!enabled || reducedMotion) {
            root.rotation.y += (0 - root.rotation.y) * f;
            return;
        }

        const mouse = mouseStateRef.current.smoothed;
        const idleY = Math.sin(t * 0.8 + phase.current) * 0.018;
        const breath = 1 + Math.sin(t * 1.35 + phase.current) * 0.006;
        root.position.y = idleY;
        root.scale.y = breath;

        const targetRotY = mouseFollow ? mouse.x * 0.18 : 0;
        rotY.current += (targetRotY - rotY.current) * f;
        root.rotation.y = rotY.current;

        const head = headRef.current;
        if (head) {
            const targetHeadX = mouseFollow ? -mouse.y * 0.08 : 0;
            const targetHeadY = mouseFollow ? mouse.x * 0.1 : 0;
            headX.current += (targetHeadX - headX.current) * f;
            headY.current += (targetHeadY - headY.current) * f;
            head.rotation.x = headX.current + Math.sin(t * 0.55) * 0.012;
            head.rotation.y = headY.current;
        }
    });

    return null;
}

export const AvatarAnimation = memo(AvatarAnimationImpl);
AvatarAnimation.displayName = "AvatarAnimation";
