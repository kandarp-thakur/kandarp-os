import type { ReactNode } from "react";

import { cn } from "@utils/cn";

interface FooterSlotProps {
    /** Footer content (e.g. [`Footer`](../footer/Footer.tsx)). */
    children: ReactNode;
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * FooterSlot — the footer region of the application shell.
 *
 * Renders the semantic `<footer>` landmark and pins it to the bottom of the
 * shell (the flex parent gives it `mt-auto`). Accepts any footer content as
 * children, so a route group can swap in a custom footer without rebuilding
 * the positioning or landmark (component-rules §7.3: slots over booleans).
 *
 * A Server Component — it is a structural wrapper with no interactivity.
 */
export function FooterSlot({ children, className }: FooterSlotProps) {
    return (
        <footer
            className={cn(
                "mt-auto border-t border-border-subtle bg-canvas-base",
                className,
            )}
        >
            {children}
        </footer>
    );
}

FooterSlot.displayName = "FooterSlot";
