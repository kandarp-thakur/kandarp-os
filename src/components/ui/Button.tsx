"use client";

import { cloneElement, forwardRef, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

/** Visual style of the button (ui-system §5.2). */
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";

/** Size preset (ui-system §5.3). */
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual variant. Defaults to `"primary"`. */
    variant?: ButtonVariant;
    /** Size preset. Defaults to `"md"`. */
    size?: ButtonSize;
    /** Icon rendered before the label. */
    leftIcon?: ReactNode;
    /** Icon rendered after the label. */
    rightIcon?: ReactNode;
    /** When true, replaces the left icon with a spinner and disables interaction. */
    isLoading?: boolean;
    /** Stretch the button to the full width of its container. */
    fullWidth?: boolean;
    /** Extra classes (escape hatch). */
    className?: string;
    /** Accessible label — required when no text children are provided. */
    "aria-label"?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    // Primary — Docker Blue solid with AWS Orange hover.
    primary: cn(
        "bg-accent-solid text-text-inverse",
        "shadow-glow-sm",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/20",
        "hover:bg-accent-hover hover:shadow-warm-glow-md hover:-translate-y-0.5",
        "active:brightness-95 active:translate-y-0",
    ),
    // Secondary — dark glass with Cloud Cyan hover accent.
    secondary: cn(
        "glass-surface text-text-secondary",
        "hover:text-cyan hover:border-cyan/30 hover:shadow-glass-hover hover:-translate-y-0.5",
        "active:bg-overlay-active active:translate-y-0",
    ),
    // Ghost — transparent, subtle hover wash.
    ghost: cn(
        "bg-transparent text-text-primary",
        "hover:bg-overlay-hover",
        "active:bg-overlay-active",
    ),
    // Outline — transparent with Docker Blue border.
    outline: cn(
        "bg-transparent text-accent-solid border border-border-accent",
        "hover:border-warm-orange/40 hover:bg-warm-subtle hover:text-accent-hover hover:shadow-warm-glow-sm hover:-translate-y-0.5",
        "active:bg-overlay-active active:translate-y-0",
    ),
    // Danger — flat destructive red.
    danger: cn(
        "bg-error text-text-inverse",
        "hover:brightness-108",
        "active:brightness-95",
    ),
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: "h-7 gap-1.5 px-3 py-1 text-xs",
    md: "h-9 gap-2 px-4 py-2 text-sm",
    lg: "h-11 gap-2 px-5 py-2.5 text-base",
    xl: "h-[3.25rem] gap-2.5 px-7 py-3 text-lg",
};

const ICON_SIZE: Record<ButtonSize, string> = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-[18px] w-[18px]",
    xl: "h-5 w-5",
};

/**
 * Button — the primary action trigger (ui-system §5).
 *
 * Five variants (`primary`, `secondary`, `ghost`, `outline`, `danger`) and four
 * sizes (`sm`, `md`, `lg`, `xl`). The primary variant uses the signature
 * accent gradient with a subtle inner top highlight and an accent glow; the
 * secondary variant is a frosted glass surface.
 *
 * States follow the spec: hover brightens, active presses (`scale(0.98)`),
 * focus shows a 2px accent ring at 30% opacity, disabled drops to 40% opacity,
 * and loading swaps the left icon for a spinner without shifting layout.
 *
 * A Client Component because it manages `isLoading` state and forwards event
 * handlers. Use the `lg` size (44px) for primary mobile CTAs to meet the 44px
 * touch-target rule (ui-system §11.4).
 *
 * @example
 * <Button variant="primary" size="lg" leftIcon={<Mail />}>Get in touch</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    function Button(
        {
            variant = "primary",
            size = "md",
            leftIcon,
            rightIcon,
            isLoading = false,
            fullWidth = false,
            disabled,
            className,
            children,
            type = "button",
            ...props
        },
        ref,
    ) {
        const isDisabled = disabled || isLoading;
        const iconClass = ICON_SIZE[size];

        return (
            <button
                ref={ref}
                type={type}
                disabled={isDisabled}
                aria-busy={isLoading || undefined}
                className={cn(
                    "relative inline-flex select-none items-center justify-center",
                    "rounded-md font-sans font-medium leading-none",
                    "transition-[transform,filter,box-shadow,background-color,color,border-color] duration-fast ease-standard",
                    "active:scale-[0.98]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    VARIANT_CLASSES[variant],
                    SIZE_CLASSES[size],
                    fullWidth && "w-full",
                    className,
                )}
                {...props}
            >
                {isLoading ? (
                    <Loader2
                        className={cn(iconClass, "animate-spin")}
                        aria-hidden="true"
                    />
                ) : (
                    leftIcon && (
                        <span
                            className="inline-flex shrink-0"
                            aria-hidden="true"
                        >
                            {cloneIcon(leftIcon, iconClass)}
                        </span>
                    )
                )}
                {children && <span className="truncate">{children}</span>}
                {!isLoading && rightIcon && (
                    <span className="inline-flex shrink-0" aria-hidden="true">
                        {cloneIcon(rightIcon, iconClass)}
                    </span>
                )}
            </button>
        );
    },
);

Button.displayName = "Button";

/**
 * Applies a sizing class to a passed Lucide icon (or any element) so the icon
 * matches the button size. If the child already sets its own size, the
 * className is merged via `cn`.
 */
function cloneIcon(icon: ReactNode, iconClass: string): ReactNode {
    if (!isValidElement(icon)) return icon;
    const element = icon as ReactElement<{ className?: string }>;
    return cloneElement(element, {
        className: cn(iconClass, element.props.className),
    });
}
