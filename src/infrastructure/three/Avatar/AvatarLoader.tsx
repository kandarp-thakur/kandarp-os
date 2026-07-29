"use client";

import { Html, useProgress } from "@react-three/drei";

export function AvatarLoader() {
    const { progress } = useProgress();

    return (
        <Html center className="pointer-events-none select-none">
            <div className="rounded-full border border-cyan-400/20 bg-black/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-100/80 backdrop-blur-md">
                avatar {Math.round(progress)}%
            </div>
        </Html>
    );
}
