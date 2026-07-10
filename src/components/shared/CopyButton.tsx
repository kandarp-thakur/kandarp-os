"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/utils/cn";

interface CopyButtonProps {
    /** Plain-text content to copy to the clipboard. */
    value: string;
    /** Accessible label for the button. */
    label?: string;
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * Copies arbitrary text to the clipboard with a transient "copied" state.
 * Used by the terminal header to share the full session as plain text.
 */
export function CopyButton({
    value,
    label = "Copy",
    className,
}: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            const timer = setTimeout(() => setCopied(false), 1500);
            return () => clearTimeout(timer);
        } catch {
            // Clipboard API can be unavailable (insecure context). Fail silently —
            // the button is a convenience, not a critical path.
            setCopied(false);
        }
    }, [value]);

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={label}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
                "font-mono text-2xs text-text-tertiary",
                "transition-colors duration-fast ease-standard",
                "hover:bg-overlay-hover hover:text-text-primary",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                className,
            )}
        >
            {copied ? (
                <Check
                    className="h-3.5 w-3.5 text-success"
                    aria-hidden="true"
                />
            ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{copied ? "Copied" : label}</span>
        </button>
    );
}

CopyButton.displayName = "CopyButton";
