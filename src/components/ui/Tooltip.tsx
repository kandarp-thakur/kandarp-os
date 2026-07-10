"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/utils/cn";

/** Preferred placement of the tooltip relative to its trigger. */
type TooltipSide = "top" | "right" | "bottom" | "left";

interface TooltipProps {
    /** The text content of the tooltip. */
    content: ReactNode;
    /** Preferred placement. Defaults to `"top"`. */
    side?: TooltipSide;
    /** The element that triggers the tooltip on hover/focus. */
    children: ReactNode;
    /** Extra classes on the tooltip bubble (escape hatch). */
    className?: string;
}

const SIDE_CLASSES: Record<TooltipSide, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
};

/**
 * Tooltip — a hover/focus contextual label (component-inventory UI #9,
 * component-rules §10.2).
 *
 * Shows a small glass-strong bubble on hover and keyboard focus, and hides on
 * blur/leave. The trigger is wrapped in a span that owns the `aria-describedby`
 * association; the bubble carries `role="tooltip"` so screen readers announce
 * it. Dismissed instantly on reduced motion.
 *
 * Positioned with absolute CSS relative to the inline trigger wrapper — no
 * floating-ui dependency. Use `side` to pick a preferred placement; the bubble
 * is centered on the trigger's edge. For complex anchoring needs, prefer
 * [`Popover`](./Popover.tsx).
 *
 * A Client Component — it tracks hover/focus state.
 *
 * @example
 * <Tooltip content="Copy to clipboard" side="top"><CopyButton /></Tooltip>
 */
export function Tooltip({
    content,
    side = "top",
    children,
    className,
}: TooltipProps) {
    const [open, setOpen] = useState(false);
    const id = useId();
    const reduced = useReducedMotion() === true;

    return (
        <span
            className="relative inline-flex"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            <span
                aria-describedby={open ? id : undefined}
                className="inline-flex"
            >
                {children}
            </span>
            <AnimatePresence>
                {open && (
                    <motion.span
                        role="tooltip"
                        id={id}
                        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
                        transition={
                            reduced
                                ? { duration: 0 }
                                : { duration: 0.12, ease: [0.4, 0, 0.2, 1] }
                        }
                        className={cn(
                            "glass-surface-strong pointer-events-none absolute z-tooltip whitespace-nowrap rounded-md px-2.5 py-1.5",
                            "font-sans text-xs font-medium text-text-primary shadow-glass",
                            SIDE_CLASSES[side],
                            className,
                        )}
                    >
                        {content}
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
}

Tooltip.displayName = "Tooltip";
