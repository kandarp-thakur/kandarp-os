import { cloneElement, isValidElement } from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";

import { cn } from "@utils/cn";

/** Semantic tone — maps to the flat semantic colors (ui-system §1.6). */
type BadgeTone =
    "neutral" | "accent" | "success" | "warning" | "error" | "info";

/** Visual weight. */
type BadgeVariant = "soft" | "solid" | "outline";

/** Size preset. */
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    /** Semantic tone. Defaults to `"neutral"`. */
    tone?: BadgeTone;
    /** Visual weight. Defaults to `"soft"`. */
    variant?: BadgeVariant;
    /** Size preset. Defaults to `"sm"`. */
    size?: BadgeSize;
    /** Optional leading icon. */
    icon?: ReactNode;
    /** Render as a dot-only indicator (no children). */
    dot?: boolean;
    /** Extra classes (escape hatch). */
    className?: string;
    /** Badge content. */
    children?: ReactNode;
}

const SOFT_CLASSES: Record<BadgeTone, string> = {
    neutral: "bg-canvas-tint text-text-secondary",
    accent: "bg-accent-subtle text-accent-solid",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-error/10 text-error",
    info: "bg-info/10 text-info",
};

const SOLID_CLASSES: Record<BadgeTone, string> = {
    neutral: "bg-text-secondary text-canvas-base",
    accent: "bg-accent-gradient text-text-inverse",
    success: "bg-success text-canvas-base",
    warning: "bg-warning text-canvas-base",
    error: "bg-error text-text-inverse",
    info: "bg-info text-text-inverse",
};

const OUTLINE_CLASSES: Record<BadgeTone, string> = {
    neutral: "border border-border-default text-text-secondary",
    accent: "border border-border-accent text-accent-solid",
    success: "border border-success/40 text-success",
    warning: "border border-warning/40 text-warning",
    error: "border border-error/40 text-error",
    info: "border border-info/40 text-info",
};

const DOT_CLASSES: Record<BadgeTone, string> = {
    neutral: "bg-text-tertiary",
    accent: "bg-accent-solid",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
    info: "bg-info",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
    sm: "h-5 gap-1 px-2 text-2xs",
    md: "h-6 gap-1 px-2.5 text-xs",
};

const ICON_SIZE: Record<BadgeSize, string> = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
};

/**
 * Badge — a small status/label indicator (component-inventory UI #4,
 * ui-system §8.3).
 *
 * Six semantic tones (`neutral`, `accent`, `success`, `warning`, `error`,
 * `info`) in three variants: `soft` (tinted background, the default),
 * `solid` (filled, for emphasis), and `outline` (hairline border, for inline
 * grouping). Semantic colors are flat — only the `accent` solid variant uses
 * the gradient (ui-system §1.9).
 *
 * Pass `dot` to render a status dot indicator (no children), or `icon` for a
 * leading icon. Badges use `radius-xs` (4px) per the spec and inherit the
 * current font.
 *
 * A Server Component — it renders no interactive UI of its own.
 *
 * @example
 * <Badge tone="success" dot /> <Badge tone="accent" icon={<Star />}>Featured</Badge>
 */
export function Badge({
    tone = "neutral",
    variant = "soft",
    size = "sm",
    icon,
    dot = false,
    className,
    children,
    ...props
}: BadgeProps) {
    const variantClass =
        variant === "soft"
            ? SOFT_CLASSES[tone]
            : variant === "solid"
              ? SOLID_CLASSES[tone]
              : OUTLINE_CLASSES[tone];

    if (dot) {
        return (
            <span
                role="img"
                aria-label={typeof children === "string" ? children : undefined}
                className={cn(
                    "inline-block h-2 w-2 shrink-0 rounded-full",
                    DOT_CLASSES[tone],
                    className,
                )}
                {...props}
            />
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center justify-center font-sans font-medium leading-none",
                "rounded-xs whitespace-nowrap",
                SIZE_CLASSES[size],
                variantClass,
                className,
            )}
            {...props}
        >
            {icon && (
                <span className="inline-flex shrink-0" aria-hidden="true">
                    {cloneIcon(icon, ICON_SIZE[size])}
                </span>
            )}
            {children}
        </span>
    );
}

Badge.displayName = "Badge";

/** Applies a sizing class to a passed icon element. */
function cloneIcon(icon: ReactNode, iconClass: string): ReactNode {
    if (!isValidElement(icon)) return icon;
    const element = icon as ReactElement<{ className?: string }>;
    return cloneElement(element, {
        className: cn(iconClass, element.props.className),
    });
}
