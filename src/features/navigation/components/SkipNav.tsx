import { cn } from "@utils/cn";

/**
 * SkipNav — accessibility skip-link (component-inventory §Navigation #20).
 *
 * The first focusable element in the document. Visually hidden until focused
 * (keyboard), then slides into view as a glass pill. Jumps focus to
 * `#main-content` (the [`ContentWrapper`](../layout/ContentWrapper.tsx)) so
 * keyboard users bypass the navbar on every page.
 *
 * A Server Component — it is a plain anchor with no interactivity.
 */
export function SkipNav() {
    return (
        <a
            href="#main-content"
            className={cn(
                "absolute left-4 top-4 z-[100] -translate-y-24 rounded-md",
                "glass-surface-strong px-4 py-2 font-sans text-sm font-medium text-text-primary shadow-glass",
                "transition-transform duration-fast ease-standard",
                "focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-border-focus",
            )}
        >
            Skip to content
        </a>
    );
}

SkipNav.displayName = "SkipNav";
