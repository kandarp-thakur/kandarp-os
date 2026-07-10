"use client";

import { useEffect, useRef } from "react";
import type { Object3D } from "three";

import type { RaycastTargetHandlers } from "./useMouse";
import { useMouse } from "./useMouse";

/**
 * Registers a 3D object for centralized picking (arch §8.2 Raycaster). The
 * {@link MouseProvider} raycasts once per frame against all registered targets
 * and fires the supplied hover/click handlers — never the full scene
 * (arch §8.5). Interaction is imperative via the handlers; the hook returns
 * nothing.
 *
 * The latest handlers are kept in a ref so re-renders don't re-register the
 * target (which would flicker hover state). Re-registration only happens when
 * the `object` identity changes.
 *
 * Must be used inside a `MouseProvider`.
 *
 * @example
 * ```tsx
 * const ref = useRef<THREE.Mesh>(null);
 * useRaycaster(ref.current, { onHover: setHovered, onClick: open });
 * ```
 */
export function useRaycaster(
    object: Object3D | null | undefined,
    handlers: RaycastTargetHandlers,
): void {
    const { registerTarget } = useMouse();

    // Keep the latest handlers without re-registering on every render.
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        if (!object) return;
        return registerTarget({
            object,
            handlers: {
                onHover: (h) => handlersRef.current.onHover?.(h),
                onClick: () => handlersRef.current.onClick?.(),
            },
        });
    }, [object, registerTarget]);
}
