"use client";

import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Surface treatment (ui-system §7.2). */
type TextareaVariant = "glass" | "solid" | "flush";

/** Validation state. */
type TextareaState = "default" | "error" | "success";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Surface treatment. Defaults to `"glass"`. */
    variant?: TextareaVariant;
    /** Accessible label text. Required — placeholder is not a label (§7.7). */
    label?: ReactNode;
    /** Helper text below the textarea (§7.5). */
    helperText?: ReactNode;
    /** Error text — sets the error state and overrides helper text (§7.5). */
    errorText?: ReactNode;
    /** Trailing affix node (e.g. a character counter, §7.5). */
    trailingAffix?: ReactNode;
    /** Explicit validation state. Inferred from `errorText` when omitted. */
    state?: TextareaState;
    /** Extra classes on the wrapper (escape hatch). */
    className?: string;
}

const VARIANT_CLASSES: Record<TextareaVariant, string> = {
    glass: "bg-glass-bg-subtle border border-border-default",
    solid: "bg-canvas-elevated border border-border-default",
    flush: "bg-transparent border-0 border-b border-border-default rounded-none",
};

const STATE_BORDER_CLASSES: Record<TextareaState, string> = {
    default:
        "focus:border-border-focus focus:bg-canvas-elevated focus:ring-[3px] focus:ring-accent-solid/15",
    error: "border-error bg-error/5 ring-[3px] ring-error/15 focus:border-error focus:ring-error/15",
    success:
        "border-success bg-success/5 focus:border-success focus:ring-success/15",
};

/**
 * Textarea — a multiline text input (ui-system §7.6).
 *
 * Min-height 96px, vertical resize only (`resize-y`), and the same surface
 * variants and states as [`Input`](./Input.tsx). The label is associated via
 * `htmlFor` and helper/error text via `aria-describedby` (§10.2).
 *
 * Pass a `trailingAffix` for a character counter (e.g. `"0/280"`); it floats
 * at the bottom-right of the textarea. Always pass a `label` — the
 * placeholder is not a label (§7.7).
 *
 * A Client Component because it uses `useId` to wire label ↔ textarea
 * association and forwards refs.
 *
 * @example
 * <Textarea label="Message" placeholder="How can I help?" rows={5} />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    function Textarea(
        {
            variant = "glass",
            label,
            helperText,
            errorText,
            trailingAffix,
            state,
            className,
            id,
            disabled,
            rows = 4,
            ...props
        },
        ref,
    ) {
        const generatedId = useId();
        const textareaId = id ?? generatedId;
        const helperId = `${textareaId}-helper`;
        const errorId = `${textareaId}-error`;
        const resolvedState: TextareaState =
            state ?? (errorText ? "error" : "default");

        const hasError = resolvedState === "error";
        const describedBy = hasError
            ? errorId
            : helperText
              ? helperId
              : undefined;

        return (
            <div className={cn("flex flex-col", className)}>
                {label ? (
                    <label
                        htmlFor={textareaId}
                        className="mb-2 font-sans text-sm font-medium text-text-primary"
                    >
                        {label}
                    </label>
                ) : null}
                <div className="relative">
                    <textarea
                        ref={ref}
                        id={textareaId}
                        rows={rows}
                        disabled={disabled}
                        aria-invalid={hasError || undefined}
                        aria-describedby={describedBy}
                        className={cn(
                            "w-full min-h-24 resize-y rounded-md p-3.5",
                            "font-sans text-sm text-text-primary leading-normal",
                            "placeholder:text-text-quaternary",
                            "transition-[border-color,box-shadow,background-color] duration-fast ease-standard",
                            "hover:border-border-strong",
                            "focus:outline-none",
                            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-canvas-sunken",
                            VARIANT_CLASSES[variant],
                            STATE_BORDER_CLASSES[resolvedState],
                            trailingAffix && "pb-8",
                        )}
                        {...props}
                    />
                    {trailingAffix ? (
                        <span
                            className="pointer-events-none absolute bottom-2.5 right-3.5 font-mono text-xs text-text-tertiary"
                            aria-hidden="true"
                        >
                            {trailingAffix}
                        </span>
                    ) : null}
                </div>
                {hasError && errorText ? (
                    <p
                        id={errorId}
                        className="mt-1.5 font-sans text-xs text-error"
                    >
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
    },
);

Textarea.displayName = "Textarea";
