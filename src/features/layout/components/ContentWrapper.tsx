import type { ReactNode } from "react";

import { cn } from "@utils/cn";

interface ContentWrapperProps {
    /** The page content. */
    children: ReactNode;
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * ContentWrapper — the primary content region of the application shell.
 *
 * Renders the flex child that grows to fill available vertical space
 * (`flex-1`), pushing the footer to the bottom of the viewport on short
 * pages. Carries `id="main-content"` as the skip-link target (a11y) and is
 * programmatically focusable (`tabIndex={-1}`) so focus moves cleanly on
 * skip.
 *
 * It deliberately imposes NO max-width or vertical padding — pages own their
 * own content measure (folder-structure §4.1: pages are thin and compose
 * sections). Use [`PageContainer`](./PageContainer.tsx) inside pages for a
 * centered measure.
 */
export function ContentWrapper({ children, className }: ContentWrapperProps) {
    return (
        <div
            id="main-content"
            tabIndex={-1}
            className={cn("flex flex-1 flex-col outline-none", className)}
        >
            {children}
        </div>
    );
}

ContentWrapper.displayName = "ContentWrapper";
