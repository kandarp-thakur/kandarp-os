"use client";

import { cloneElement, forwardRef, isValidElement, useId } from "react";
import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";

import { cn } from "@utils/cn";

/** Surface treatment (ui-system §7.2). */
type InputVariant = "glass" | "solid" | "flush";

/** Size preset (ui-system §7.3). */
type InputSize = "sm" | "md" | "lg";

/** Validation state. */
type InputState = "default" | "error" | "success";

interface InputProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size"
> {
    /** Surface treatment. Defaults to `"glass"`. */
    variant?: InputVariant;
    /** Size preset. Defaults to `"md"`. */
    inputSize?: InputSize;
    /** Accessible label text. Required — placeholder is not a label (§7.7). */
    label?: ReactNode;
    /** Helper text below the input (§7.5). */
    helperText?: ReactNode;
    /** Error text — sets the error state and overrides helper text (§7.5). */
    errorText?: ReactNode;
    /** Leading icon (18px, §7.5). */
    leadingIcon?: ReactNode;
    /** Trailing affix node (e.g. a unit or counter, §7.5). */
    trailingAffix?: ReactNode;
    /** Explicit validation state. Inferred from `errorText` when omitted. */
    state?: InputState;
    /** Extra classes on the wrapper (escape hatch). */
    className?: string;
}

const VARIANT_CLASSES: Record<InputVariant, string> = {
    glass: "bg-glass-bg-subtle border border-border-default",
    solid: "bg-canvas-elevated border border-border-default",
    flush: "bg-transparent border-0 border-b border-border-default rounded-none",
};

const SIZE_CLASSES: Record<InputSize, string> = {
    sm: "h-8 px-3 py-1.5 text-sm",
    md: "h-10 px-3.5 py-2 text-sm",
    lg: "h-12 px-4 py-3 text-base",
};

const STATE_BORDER_CLASSES: Record<InputState, string> = {
    default:
        "focus:border-border-focus focus:bg-canvas-elevated focus:ring-[3px] focus:ring-accent-solid/15",
    error: "border-error bg-error/5 ring-[3px] ring-error/15 focus:border-error focus:ring-error/15",
    success:
        "border-success bg-success/5 focus:border-success focus:ring-success/15",
};

const ICON_SIZE: Record<InputSize, string> = {
    sm: "h-3.5 w-3.5",
    md: "h-[18px] w-[18px]",
    lg: "h-5 w-5",
};

/**
 * Input — a standard text input with label, helper/error text, and affixes
 * (ui-system §7).
 *
 * Three surface variants: `glass` (frosted, the default for standard forms),
 * `solid` (opaque, for dense/data forms), and `flush` (bottom-border only,
 * for search and inline edit). Three sizes (`sm` 32px, `md` 40px, `lg` 48px)
 * — `md` and `lg` meet the 44px touch-target rule on mobile (§7.7).
 *
 * States follow the spec: default → hover (stronger border) → focus (accent
 * border + 3px accent ring at 15% opacity) → error (red border + ring) →
 * success (green border). The focus ring is mandatory — never
 * `outline: none` without replacement (§7.7).
 *
 * Always pass a `label` — the placeholder is not a label. Helper text sits
 * below in tertiary; error text overrides it and sets the error state. The
 * `<label>` is associated via `htmlFor` for screen readers (§10.2).
 *
 * A Client Component because it uses `useId` to wire label ↔ input association
 * and forwards refs.
 *
 * @example
 * <Input label="Full name" placeholder="Kandarp Khandwala" leadingIcon={<User />} />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    {
        variant = "glass",
        inputSize = "md",
        label,
        helperText,
        errorText,
        leadingIcon,
        trailingAffix,
        state,
        className,
        id,
        disabled,
        ...props
    },
    ref,
) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const resolvedState: InputState =
        state ?? (errorText ? "error" : "default");

    const hasError = resolvedState === "error";
    const describedBy = hasError ? errorId : helperText ? helperId : undefined;

    return (
        <div className={cn("flex flex-col", className)}>
            {label ? (
                <label
                    htmlFor={inputId}
                    className="mb-2 font-sans text-sm font-medium text-text-primary"
                >
                    {label}
                </label>
            ) : null}
            <div className="relative flex items-center">
                {leadingIcon ? (
                    <span
                        className="pointer-events-none absolute left-3.5 flex shrink-0 text-text-tertiary"
                        aria-hidden="true"
                    >
                        {cloneIcon(leadingIcon, ICON_SIZE[inputSize])}
                    </span>
                ) : null}
                <input
                    ref={ref}
                    id={inputId}
                    disabled={disabled}
                    aria-invalid={hasError || undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        "w-full rounded-md font-sans text-text-primary",
                        "placeholder:text-text-quaternary",
                        "transition-[border-color,box-shadow,background-color] duration-fast ease-standard",
                        "hover:border-border-strong",
                        "focus:outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        VARIANT_CLASSES[variant],
                        SIZE_CLASSES[inputSize],
                        STATE_BORDER_CLASSES[resolvedState],
                        leadingIcon && "pl-10",
                        trailingAffix && "pr-12",
                        disabled && "bg-canvas-sunken",
                    )}
                    {...props}
                />
                {trailingAffix ? (
                    <span
                        className="pointer-events-none absolute right-3.5 flex shrink-0 font-sans text-xs text-text-tertiary"
                        aria-hidden="true"
                    >
                        {trailingAffix}
                    </span>
                ) : null}
            </div>
            {hasError && errorText ? (
                <p id={errorId} className="mt-1.5 font-sans text-xs text-error">
                    {errorText}
                </p>
            ) : helperText ? (
                <p
                    id={helperId}
                    className="mt-1.5 font-sans text-xs text-text-tertiary"
                >
                    {helperText}
                </p>
            ) : null}
        </div>
    );
});

Input.displayName = "Input";

/** Applies a sizing class to a passed icon element. */
function cloneIcon(icon: ReactNode, iconClass: string): ReactNode {
    if (!isValidElement(icon)) return icon;
    const element = icon as ReactElement<{ className?: string }>;
    return cloneElement(element, {
        className: cn(iconClass, element.props.className),
    });
}
