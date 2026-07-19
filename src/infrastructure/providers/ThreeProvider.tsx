"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

/**
 * Three Provider — Kandarp OS.
 *
 * The 3D layer is isolated in `src/3d/` (folder-structure §4.3). This provider
 * is the **app-root bridge** to that subsystem: it exposes a context that lets
 * any descendant opt into 3D, and it lazily mounts the R3F canvas host
 * (`Canvas3D`) only after the page is interactive (arch §5.1 — the canvas
 * mounts post-LCP to protect initial page weight).
 *
 * Responsibilities:
 *   - **Lazy mount.** The canvas is not rendered until `enable()` is called
 *     (or `enabled` is passed). Consumers (e.g. the hero) call `enable()` once
 *     they are confident the LCP element has painted.
 *   - **Reduced-motion gate.** When the user prefers reduced motion, 3D is
 *     never enabled — the 2D fallback path in `Canvas3D` handles the rest
 *     (arch §5.2, animation-design §3.1).
 *   - **SSR safety.** The canvas host is dynamically imported with
 *     `{ ssr: false }` by consumers; this provider itself renders no canvas —
 *     it only carries the readiness flag.
 *
 * Boundary: this provider renders no 3D content. It is a thin readiness gate.
 * The actual `<Canvas3D>` is mounted by the consumer that owns the 3D region.
 */
export interface ThreeContextValue {
    /** Whether 3D is permitted to mount. */
    enabled: boolean;
    /** Permit 3D to mount (post-LCP). Idempotent. */
    enable: () => void;
}

const ThreeContext = createContext<ThreeContextValue | null>(null);

interface ThreeProviderProps {
    /** Mount 3D immediately (skip the lazy post-LCP gate). Defaults to `false`. */
    enabled?: boolean;
    children: ReactNode;
}

/**
 * Provides the 3D readiness context. Mounted once at the app root.
 */
export function ThreeProvider({
    enabled = false,
    children,
}: ThreeProviderProps) {
    const [is3DEnabled, setIs3DEnabled] = useState<boolean>(enabled);

    const enable = useCallback(() => {
        setIs3DEnabled(true);
    }, []);

    const value = useMemo<ThreeContextValue>(
        () => ({ enabled: is3DEnabled, enable }),
        [is3DEnabled, enable],
    );

    return (
        <ThreeContext.Provider value={value}>{children}</ThreeContext.Provider>
    );
}

/**
 * Read the 3D readiness context. Must be used inside a `ThreeProvider`.
 *
 * @throws If used outside a `ThreeProvider` — guards against silent no-ops.
 */
export function useThree(): ThreeContextValue {
    const ctx = useContext(ThreeContext);
    if (!ctx) {
        throw new Error("useThree must be used within a <ThreeProvider>.");
    }
    return ctx;
}
