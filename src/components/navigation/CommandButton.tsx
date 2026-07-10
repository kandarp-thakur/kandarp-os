"use client";

import { Search } from "lucide-react";

import { cn } from "@/utils/cn";

interface CommandButtonProps {
    /** Called when the trigger is clicked (opens the command palette). */
    onClick: () => void;
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * CommandButton — the ⌘K search trigger in the navbar (navigation-design §1.3,
 * component-rules §10.2).
 *
 * A pill-shaped button that opens the command palette. On desktop it shows a
 * search icon + the `⌘K` keyboard hint; on mobile it collapses to an icon-only
 * 44px touch target. The hint is hidden below `md` to save space.
 *
 * A Client Component — it forwards a click handler.
 */
export function CommandButton({ onClick, className }: CommandButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Search"
            aria-keyshortcuts="Meta+K Ctrl+K"
            className={cn(
                "group inline-flex h-11 items-center gap-2 rounded-md pl-3 pr-2.5",
                "text-text-secondary transition-colors duration-fast ease-standard",
                "hover:bg-overlay-hover hover:text-text-primary active:bg-overlay-active",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                className,
            )}
        >
            <Search className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <kbd
                className="hidden shrink-0 items-center rounded-xs border border-border-subtle bg-canvas-sunken px-1.5 py-0.5 font-mono text-2xs text-text-tertiary md:inline-flex"
                aria-hidden="true"
            >
                <span className="hidden lg:inline">⌘</span>
                <span className="lg:hidden">⌘</span>K
            </kbd>
        </button>
    );
}

CommandButton.displayName = "CommandButton";
