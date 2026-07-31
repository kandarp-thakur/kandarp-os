"use client";

import { Search } from "lucide-react";

import { cn } from "@utils/cn";

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
            aria-label="Run command"
            aria-keyshortcuts="Meta+K Ctrl+K"
            className={cn(
                "group terminal-command-trigger inline-flex h-9 items-center gap-2 rounded-full bg-white/[0.05] px-2.5",
                "text-[#94A3B8] transition-all duration-[150ms] ease-out",
                "hover:bg-[rgba(34,211,238,0.10)] hover:text-[#22D3EE] hover:scale-[1.02]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                className,
            )}
        >
            <Search
                className="h-[18px] w-[18px] shrink-0 transition-transform duration-150 ease-out group-hover:scale-[1.08]"
                aria-hidden="true"
            />
            <kbd
                className="hidden h-7 shrink-0 items-center rounded-full bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] tracking-wide text-[#94A3B8] shadow-[0_0_12px_rgba(34,211,238,0.06)] md:inline-flex"
                aria-hidden="true"
            >
                Ctrl + K
            </kbd>
        </button>
    );
}

CommandButton.displayName = "CommandButton";
