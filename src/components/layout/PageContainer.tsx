import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Max-width presets mapped to Tailwind max-width utilities. */
type MaxWidth = "sm" | "md" | "lg" | "xl" | "full";

interface PageContainerProps {
    /** The content to constrain. */
    children: ReactNode;
    /** Max-width preset. Defaults to `"lg"` (`max-w-5xl`). */
    maxWidth?: MaxWidth;
    /** Extra classes (escape hatch). */
    className?: string;
}

const MAX_WIDTHS: Record<MaxWidth, string> = {
    sm: "max-w-3xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
    full: "max-w-full",
};

/**
 * PageContainer — a reusable max-width + horizontal-padding wrapper
 * (folder-structure §4.2 `layout/`, component-rules §7).
 *
 * Centers its children and applies responsive horizontal padding so every page
 * shares one consistent content measure. It owns no semantics — drop any
 * content inside. Pages compose sections within it.
 *
 * @example
 * <PageContainer maxWidth="lg">...</PageContainer>
 */
export function PageContainer({
    children,
    maxWidth = "lg",
    className,
}: PageContainerProps) {
    return (
        <div
            className={cn(
                "mx-auto w-full px-4 sm:px-6 lg:px-8",
                MAX_WIDTHS[maxWidth],
                className,
            )}
        >
            {children}
        </div>
    );
}

PageContainer.displayName = "PageContainer";
