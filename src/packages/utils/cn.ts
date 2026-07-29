import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conditional logic.
 * Combines clsx (conditionals) + tailwind-merge (conflict resolution).
 *
 * @example
 * cn("p-4 rounded-lg", isActive && "bg-accent", className)
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
