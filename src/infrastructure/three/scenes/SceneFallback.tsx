"use client";

import { cn } from "@utils/cn";

interface SceneFallbackProps {
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * The 2D/CSS fallback for WebGL-unsupported devices (arch §12, component
 * inventory #23). Rendered automatically by {@link Canvas3D} when the device
 * tier resolves to `"off"`.
 *
 * Meaningful, not blank: a subtle accent radial glow + faint dot-grid that
 * mirrors the hero placeholder treatment, so the fallback is intentional and
 * discoverable. Decorative only — `aria-hidden`, no pointer events, sits
 * behind content. All real content lives in the DOM, never only in 3D
 * (arch §12).
 *
 * @example
 * ```tsx
 * <SceneFallback />
 * ```
 */
export function SceneFallback({ className }: SceneFallbackProps) {
    return (
        <div
            className={cn(
                "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
                className,
            )}
            aria-hidden="true"
        >
            {/* Soft accent glow — depth behind the content (upper-right bias). */}
            <div
                className="absolute -top-1/4 right-0 h-[60vh] w-[60vh] rounded-full opacity-20 blur-3xl"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at center, var(--accent-solid), transparent 70%)",
                }}
            />

            {/* Faint dot-grid — a "constellation" hint. */}
            <div
                className="absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage:
                        "radial-gradient(var(--border-subtle) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                    maskImage:
                        "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
                }}
            />
        </div>
    );
}

SceneFallback.displayName = "SceneFallback";
