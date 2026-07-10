"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/utils/cn";

/** Modal size preset (maps to max-width). */
type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalProps {
    /** Whether the modal is open. */
    isOpen: boolean;
    /** Called when the modal requests to close (Escape, scrim click, close button). */
    onClose: () => void;
    /** Accessible title — required for the dialog (component-rules §10.2). */
    title?: ReactNode;
    /** Optional description rendered below the title. */
    description?: ReactNode;
    /** Modal body content. */
    children?: ReactNode;
    /** Optional footer region (e.g. action buttons). */
    footer?: ReactNode;
    /** Size preset. Defaults to `"md"`. */
    size?: ModalSize;
    /** Disable closing on scrim click. Defaults to false. */
    disableScrimClose?: boolean;
    /** Extra classes on the dialog panel (escape hatch). */
    className?: string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal — a centered dialog with a scrim backdrop (ui-system §6.2, §9,
 * component-rules §10.2).
 *
 * Renders a `role="dialog"` with `aria-modal="true"`, a labelled title, a
 * focus trap (focus cycles within the dialog while open), and Escape-to-close.
 * The scrim is a blurred dark overlay (`--scrim` + 8px blur); the panel is a
 * `glass-surface-strong` card with the modal shadow (`shadow-glass-modal`) and
 * `radius-3xl` (24px).
 *
 * Entrance/exit follows the spec: scale-in (0.96→1) + fade with `ease-spring`
 * for the panel, fade for the scrim (ui-system §10.4). Reduced motion renders
 * instantly. Exit is faster than enter (§10.8).
 *
 * On open, focus moves to the first focusable element inside the panel; on
 * close, focus is restored to the previously-focused element. Body scroll is
 * locked while open.
 *
 * A Client Component — it manages focus, scroll-lock, and key handling.
 *
 * @example
 * <Modal isOpen={open} onClose={close} title="Confirm" footer={<Button>OK</Button>}>...</Modal>
 */
export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = "md",
    disableScrimClose = false,
    className,
}: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const titleId = useId();
    const descId = useId();
    const reduced = useReducedMotion() === true;

    // Lock body scroll while open.
    useEffect(() => {
        if (!isOpen) return;
        const { overflow } = document.body.style;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = overflow;
        };
    }, [isOpen]);

    // Move focus into the dialog on open; restore on close.
    useEffect(() => {
        if (!isOpen) return;
        previouslyFocused.current =
            document.activeElement as HTMLElement | null;
        const panel = panelRef.current;
        if (panel) {
            const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
            (first ?? panel).focus();
        }
        return () => {
            previouslyFocused.current?.focus();
        };
    }, [isOpen]);

    // Focus trap + Escape handling.
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key === "Tab") {
                const panel = panelRef.current;
                if (!panel) return;
                const focusables = Array.from(
                    panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
                );
                if (focusables.length === 0) {
                    event.preventDefault();
                    panel.focus();
                    return;
                }
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (!first || !last) {
                    event.preventDefault();
                    panel.focus();
                    return;
                }
                const active = document.activeElement as HTMLElement | null;
                if (event.shiftKey && active === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && active === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        },
        [onClose],
    );

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleKeyDown]);

    const handleScrimClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (disableScrimClose) return;
            if (event.target === event.currentTarget) onClose();
        },
        [disableScrimClose, onClose],
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-overlay flex items-center justify-center p-4"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    transition={
                        reduced
                            ? { duration: 0 }
                            : { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
                    }
                >
                    {/* Scrim — blurred dark overlay. */}
                    <div
                        aria-hidden="true"
                        onClick={handleScrimClick}
                        className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-glass-subtle"
                    />

                    {/* Dialog panel — glass-strong + modal shadow. */}
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? titleId : undefined}
                        aria-describedby={description ? descId : undefined}
                        tabIndex={-1}
                        onClick={handleScrimClick}
                        initial={
                            reduced ? false : { opacity: 0, scale: 0.96, y: 8 }
                        }
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={
                            reduced
                                ? undefined
                                : { opacity: 0, scale: 0.98, y: 4 }
                        }
                        transition={
                            reduced
                                ? { duration: 0 }
                                : {
                                      duration: 0.2,
                                      ease: [0.34, 1.56, 0.64, 1],
                                  }
                        }
                        className={cn(
                            "glass-surface-strong relative w-full overflow-hidden rounded-3xl shadow-glass-modal",
                            "max-h-[calc(100svh-2rem)] flex flex-col",
                            SIZE_CLASSES[size],
                            className,
                        )}
                    >
                        {(title || description) && (
                            <header className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
                                <div className="min-w-0">
                                    {title ? (
                                        <h2
                                            id={titleId}
                                            className="font-sans text-h3 font-semibold text-text-primary"
                                        >
                                            {title}
                                        </h2>
                                    ) : null}
                                    {description ? (
                                        <p
                                            id={descId}
                                            className="mt-1 font-sans text-sm text-text-secondary"
                                        >
                                            {description}
                                        </p>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close dialog"
                                    className={cn(
                                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                                        "text-text-tertiary transition-colors duration-fast ease-standard",
                                        "hover:bg-overlay-hover hover:text-text-primary",
                                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                    )}
                                >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </header>
                        )}

                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {children}
                        </div>

                        {footer ? (
                            <footer className="border-t border-border-subtle px-6 py-4">
                                {footer}
                            </footer>
                        ) : null}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

Modal.displayName = "Modal";
