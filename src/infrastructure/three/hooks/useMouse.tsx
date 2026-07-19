"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useReducedMotion } from "./useReducedMotion";

/**
 * Live pointer state read by consumers each frame (arch §8.2). Held in refs so
 * per-frame writes from the tracker never trigger React re-renders — the same
 * ref-bus pattern as the camera state.
 */
export interface MouseState {
    /** Raw pixel position (clientX, clientY). (0,0) = canvas top-left. */
    raw: THREE.Vector2;
    /** Normalized device coords (-1..1) — the raycasting space. */
    ndc: THREE.Vector2;
    /** Damped NDC position for parallax. Zeroed under reduced-motion. */
    smoothed: THREE.Vector2;
    /** Movement velocity in NDC units/sec. */
    velocity: THREE.Vector2;
    /** Pointer is currently pressed (drag in progress). */
    isDown: boolean;
}

/** Per-target interaction handlers (arch §8.4). */
export interface RaycastTargetHandlers {
    onHover?: (hovered: boolean) => void;
    onClick?: () => void;
}

/** A registered pickable object + its handlers. */
export interface RaycastTarget {
    object: THREE.Object3D;
    handlers: RaycastTargetHandlers;
}

/** Imperative API exposed via the mouse context. */
export interface MouseApi {
    /** Live state ref — read by consumers each frame. */
    stateRef: MutableRefObject<MouseState>;
    /** Register a pickable object. Returns an unsubscribe function. */
    registerTarget: (target: RaycastTarget) => () => void;
}

const MouseContext = createContext<MouseApi | null>(null);

interface MouseProviderProps {
    /**
     * Damping factor for the smoothed position (arch §8.5, default 0.08).
     * Lower = slower / smoother.
     */
    smoothing?: number;
    children: ReactNode;
}

/**
 * The mouse interaction system (arch §8). One per canvas. Translates
 * pointer/touch position into 3D-space data — NDC for raycasting, a damped
 * smoothed position for parallax, and velocity for effects — consumed by all
 * systems via {@link useMouse}.
 *
 * Tracking is throttled to `pointermove` (no rAF polling, arch §8.5). The
 * smoothed position is damped per frame; raycasting runs once per frame
 * against registered targets only (never the full scene). `prefers-reduced-
 * motion` zeroes parallax + velocity while keeping raycasting active.
 *
 * @example
 * ```tsx
 * <MouseProvider><Orb /></MouseProvider>
 * ```
 */
export function MouseProvider({
    smoothing = 0.08,
    children,
}: MouseProviderProps) {
    const { gl } = useThree();
    const reducedMotion = useReducedMotion();

    const stateRef = useRef<MouseState>({
        raw: new THREE.Vector2(),
        ndc: new THREE.Vector2(),
        smoothed: new THREE.Vector2(),
        velocity: new THREE.Vector2(),
        isDown: false,
    });

    // Registry of pickable objects (arch §8.2 InteractionTargets). Keyed by the
    // object so a hit maps back to its handlers in O(1).
    const targetsRef = useRef<Map<THREE.Object3D, RaycastTarget>>(new Map());
    const objectsRef = useRef<THREE.Object3D[]>([]);

    // Scratch objects — reused across frames to avoid per-frame allocation.
    const raycaster = useRef(new THREE.Raycaster());
    const prevSmoothed = useRef(new THREE.Vector2());
    const pointerDownNdc = useRef(new THREE.Vector2());
    const hoveredRef = useRef<Set<RaycastTarget>>(new Set());
    const nowHoveredRef = useRef<Set<RaycastTarget>>(new Set());
    const clickPendingRef = useRef(false);

    // Track the pointer via DOM events on the canvas element (arch §8.5).
    useEffect(() => {
        const el = gl.domElement;

        const updateNDC = (clientX: number, clientY: number) => {
            const rect = el.getBoundingClientRect();
            const s = stateRef.current;
            s.raw.set(clientX, clientY);
            s.ndc.set(
                ((clientX - rect.left) / rect.width) * 2 - 1,
                -(((clientY - rect.top) / rect.height) * 2 - 1),
            );
        };
        const onPointerMove = (e: PointerEvent) =>
            updateNDC(e.clientX, e.clientY);
        const onPointerDown = (e: PointerEvent) => {
            stateRef.current.isDown = true;
            updateNDC(e.clientX, e.clientY);
            pointerDownNdc.current.copy(stateRef.current.ndc);
            clickPendingRef.current = true;
        };
        const onPointerUp = () => {
            stateRef.current.isDown = false;
        };

        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("pointerup", onPointerUp);
        return () => {
            el.removeEventListener("pointermove", onPointerMove);
            el.removeEventListener("pointerdown", onPointerDown);
            el.removeEventListener("pointerup", onPointerUp);
        };
    }, [gl]);

    const api = useMemo<MouseApi>(
        () => ({
            stateRef,
            registerTarget: (target) => {
                targetsRef.current.set(target.object, target);
                objectsRef.current = Array.from(targetsRef.current.keys());
                return () => {
                    targetsRef.current.delete(target.object);
                    objectsRef.current = Array.from(targetsRef.current.keys());
                };
            },
        }),
        [],
    );

    useFrame((state, delta) => {
        const s = stateRef.current;

        // Reduced motion: zero parallax + velocity (arch §8.5). NDC/raw stay
        // live so raycasting keeps working.
        if (reducedMotion) {
            s.smoothed.set(0, 0);
            s.velocity.set(0, 0);
        } else {
            // Frame-rate independent damping toward the NDC position.
            const factor = 1 - Math.pow(1 - smoothing, delta * 60);
            prevSmoothed.current.copy(s.smoothed);
            s.smoothed.lerp(s.ndc, factor);
            s.velocity
                .copy(s.smoothed)
                .sub(prevSmoothed.current)
                .divideScalar(Math.max(delta, 0.001));
        }

        // Raycast once per frame against registered targets only (arch §8.5).
        const objects = objectsRef.current;
        if (objects.length === 0) return;

        raycaster.current.setFromCamera(s.ndc, state.camera);
        const intersects = raycaster.current.intersectObjects(objects, true);

        // Map hits back to registered targets, walking the parent chain so
        // groups (not just leaf meshes) can be pickable.
        const nowHovered = nowHoveredRef.current;
        nowHovered.clear();
        for (const hit of intersects) {
            const target = findRegisteredTarget(targetsRef.current, hit.object);
            if (target) nowHovered.add(target);
        }

        // Diff hover state; fire handlers only on change.
        const prevHovered = hoveredRef.current;
        for (const t of prevHovered) {
            if (!nowHovered.has(t)) t.handlers.onHover?.(false);
        }
        for (const t of nowHovered) {
            if (!prevHovered.has(t)) t.handlers.onHover?.(true);
        }
        // Swap sets — the old "now" becomes next frame's "prev" (cleared then).
        hoveredRef.current = nowHovered;
        nowHoveredRef.current = prevHovered;

        // Click: fire on the hovered target when a tap completes (not a drag).
        if (clickPendingRef.current && !s.isDown) {
            clickPendingRef.current = false;
            const moved = s.ndc.distanceTo(pointerDownNdc.current);
            const firstHit = intersects[0];
            if (moved < 0.05 && firstHit) {
                const target = findRegisteredTarget(
                    targetsRef.current,
                    firstHit.object,
                );
                target?.handlers.onClick?.();
            }
        }
    });

    return (
        <MouseContext.Provider value={api}>{children}</MouseContext.Provider>
    );
}

/** Walks the parent chain to find the registered target for a hit object. */
function findRegisteredTarget(
    registry: Map<THREE.Object3D, RaycastTarget>,
    object: THREE.Object3D,
): RaycastTarget | undefined {
    let cur: THREE.Object3D | null = object;
    while (cur) {
        const target = registry.get(cur);
        if (target) return target;
        cur = cur.parent;
    }
    return undefined;
}

/**
 * Reads the mouse state bus. Must be used inside a {@link MouseProvider}.
 * Returns the imperative API: `stateRef` for position/velocity, and
 * `registerTarget` for picking.
 *
 * @throws If used outside a `MouseProvider` — guards against silent no-ops.
 */
export function useMouse(): MouseApi {
    const ctx = useContext(MouseContext);
    if (!ctx) {
        throw new Error("useMouse must be used within a <MouseProvider>.");
    }
    return ctx;
}
