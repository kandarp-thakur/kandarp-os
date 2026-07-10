"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/utils/cn";

/** Preferred placement of the popover relative to its trigger. */
type PopoverSide = "top" | "right" | "bottom" | "left";

interface PopoverProps {
    /** The trigger element — rendered as-is. Clicking toggles the popover. */
    trigger: ReactNode;
    /** The floating panel content. */
    children: ReactNode;
    /** Preferred placement. Defaults to `"bottom"`. */
    side?: PopoverSide;
    /** Accessible label for the popover panel. */
    "aria-label"?: string;
    /** Extra classes on the panel (escape hatch). */
    className?: string;
}

const SIDE_CLASSES: Record<PopoverSide, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
};

/**
 * Popover — a floating content panel anchored to a trigger
 * (component-inventory UI #10, component-rules §10.2).
 *
 * Click the trigger to toggle a `glass-surface-strong` panel; click outside or
 * press Escape to dismiss. The panel carries `role="dialog"` and an
 * `aria-labelledby`/`aria-label` so screen readers announce it, and the
 * trigger gets `aria-haspopup="dialog"` + `aria-expanded`.
 *
 * Entrance/exit: scale-in (0.96→1) + fade with `ease-spring`; reduced motion
 * renders instantly (ui-system §10.4). Positioned with absolute CSS relative
 * to the inline trigger wrapper.
 *
 * A Client Component — it tracks open state and outside-click/Escape.
 *
 * @example
 * <Popover trigger={<Button variant="ghost">Options</Button>} side="bottom">...</Popover>
 */
export function Popover({
    trigger,
    children,
    side = "bottom",
    "aria-label": ariaLabel,
    className,
}: PopoverProps) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const panelId = useId();
    const reduced = useReducedMotion() === true;

    // Outside-click + Escape dismiss.
    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (event: PointerEvent) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
            }
        };
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    return (
        <span ref={wrapperRef} className="relative inline-flex">
            <span
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                className="inline-flex"
            >
                {trigger}
            </span>
            <AnimatePresence>
                {open && (
                    <motion.span
                        role="dialog"
                        id={panelId}
                        aria-label={ariaLabel}
                        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
                        transition={
                            reduced
                                ? { duration: 0 }
                                : {
                                      duration: 0.16,
                                      ease: [0.34, 1.56, 0.64, 1],
                                  }
                        }
                        className={cn(
                            "glass-surface-strong absolute z-dropdown min-w-48 rounded-xl p-4 shadow-glass",
                            SIDE_CLASSES[side],
                            className,
                        )}
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
}

Popover.displayName = "Popover";
