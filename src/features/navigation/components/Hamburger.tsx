"use client";

import { cn } from "@utils/cn";

interface HamburgerProps {
    /** Whether the mobile menu is open. */
    open: boolean;
    /** Toggle handler. */
    onClick: () => void;
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * Hamburger button that morphs into an X when open (navigation-design §7.3).
 *
 * Three spans animate: the top + bottom rotate into the X, the middle fades.
 * The whole control is a 44px touch target with a visible focus ring.
 */
export function Hamburger({ open, onClick, className }: HamburgerProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn(
                "relative inline-flex h-11 w-11 items-center justify-center rounded-md",
                "text-text-primary transition-colors duration-fast ease-standard",
                "hover:bg-overlay-hover",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                className,
            )}
        >
            <span className="relative block h-4 w-5" aria-hidden="true">
                <span
                    className={cn(
                        "absolute left-0 block h-0.5 w-5 rounded-full bg-current",
                        "top-0 transition-all duration-slow ease-smooth",
                        open ? "top-1.5 rotate-45" : "top-0",
                    )}
                />
                <span
                    className={cn(
                        "absolute left-0 top-1.5 block h-0.5 w-5 rounded-full bg-current",
                        "transition-opacity duration-fast ease-standard",
                        open ? "opacity-0" : "opacity-100",
                    )}
                />
                <span
                    className={cn(
                        "absolute left-0 block h-0.5 w-5 rounded-full bg-current",
                        "bottom-0 transition-all duration-slow ease-smooth",
                        open ? "bottom-1.5 -rotate-45" : "bottom-0",
                    )}
                />
            </span>
        </button>
    );
}

Hamburger.displayName = "Hamburger";
