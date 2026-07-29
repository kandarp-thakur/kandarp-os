import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@utils/cn";

/** Glass intensity preset (ui-system §6.2). */
type GlassCardTone = "default" | "strong" | "subtle";

/** Corner radius preset (ui-system §6.4). */
type GlassCardRadius = "sm" | "md" | "lg" | "xl";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    /** Glass opacity/blur intensity. Defaults to `"default"`. */
    tone?: GlassCardTone;
    /** Corner radius. Defaults to `"md"` (16px). */
    radius?: GlassCardRadius;
    /** Apply the gradient 1px border (featured/hover treatment, §6.2). */
    featured?: boolean;
    /** Enable the interactive hover lift (ui-system §6.5). Defaults to true. */
    interactive?: boolean;
    /** Extra classes (escape hatch). */
    className?: string;
    /** Card content. */
    children?: ReactNode;
}

const TONE_CLASSES: Record<GlassCardTone, string> = {
    default: "glass-surface",
    strong: "glass-surface-strong",
    subtle: "bg-glass-bg-subtle backdrop-blur-glass-subtle border border-border-default",
};

const RADIUS_CLASSES: Record<GlassCardRadius, string> = {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
};

/**
 * GlassCard — the signature glassmorphism surface (ui-system §6.1, §6.2).
 *
 * A focused convenience wrapper for the glass card variant. The glass surface
 * (translucent + blurred + dual inset edge highlight) is the defining element
 * of the Kandarp OS aesthetic — every elevated surface floats on frosted
 * glass rather than opaque color.
 *
 * Three tones: `default` (standard 16px blur), `strong` (24px blur, for
 * modals/popovers), and `subtle` (8px blur, for background panels). Set
 * `featured` for the gradient 1px border treatment used on highlighted cards.
 *
 * Glass cards need something behind them to blur — place over a gradient or
 * textured backdrop, never flat white (ui-system §6.6). Never nest glass in
 * glass; use a solid card inside instead.
 *
 * A Server Component — it renders no interactive UI of its own.
 *
 * @example
 * <GlassCard featured interactive>...</GlassCard>
 */
export function GlassCard({
    tone = "default",
    radius = "md",
    featured = false,
    interactive = true,
    className,
    children,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden",
                TONE_CLASSES[tone],
                RADIUS_CLASSES[radius],
                featured &&
                    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:p-px before:bg-accent-gradient before:[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] before:[mask-composite:exclude]",
                interactive &&
                    "transition-[box-shadow,transform,border-color] duration-normal ease-standard hover:-translate-y-1 hover:shadow-glass-hover hover:border-accent focus-within:border-accent focus-within:shadow-glass-hover",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

GlassCard.displayName = "GlassCard";
