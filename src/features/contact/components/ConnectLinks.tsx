import { socials } from "@/data/socials";
import { cn } from "@utils/cn";

interface ConnectLinksProps {
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * ConnectLinks — the visible, clickable companion to [`ContactTerminal`](./ContactTerminal.tsx).
 *
 * The connect section's terminal is the primary interaction, but a visitor who
 * doesn't know to type `github` should still be able to reach the channels in a
 * single click. This grid renders the validated [`socials`](../../data/socials.ts)
 * as accessible anchor cards — one source of truth, no duplicated copy.
 *
 * Each card shows the channel label, its handle, and a one-line description,
 * styled as a terminal directory entry (`drwxr-xr-x`-style) to match the OS
 * aesthetic. External links open in a new tab with `noopener noreferrer`;
 * `mailto:` / `tel:` / internal paths stay in-tab.
 *
 * A Server Component — it renders static data with no interactivity.
 */
export function ConnectLinks({ className }: ConnectLinksProps) {
    return (
        <ul
            className={cn(
                "grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
                className,
            )}
        >
            {socials.map((social) => {
                const isExternal =
                    /^https?:\/\//.test(social.url) ||
                    (!social.url.startsWith("/") &&
                        !social.url.startsWith("mailto:") &&
                        !social.url.startsWith("tel:"));
                return (
                    <li key={social.id}>
                        <a
                            href={social.url}
                            {...(isExternal
                                ? {
                                      target: "_blank",
                                      rel: "noopener noreferrer",
                                  }
                                : {})}
                            className={cn(
                                "group flex h-full flex-col gap-1.5 rounded-lg",
                                "border border-border-subtle bg-canvas-tint/40 p-4",
                                "transition-[border-color,transform,background-color] duration-fast ease-standard",
                                "hover:-translate-y-0.5 hover:border-accent hover:bg-canvas-tint/70",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                            )}
                            aria-label={`${social.label} — ${social.handle}`}
                        >
                            {/* Header row — label + command alias */}
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-sans text-sm font-semibold text-text-primary">
                                    {social.label}
                                </span>
                                <span className="font-mono text-2xs text-text-tertiary">
                                    {social.command}
                                </span>
                            </div>

                            {/* Handle — mono, accent on hover */}
                            <span className="font-mono text-xs text-text-secondary transition-colors duration-fast ease-standard group-hover:text-accent-solid">
                                {social.handle}
                            </span>

                            {/* Description — dimmed, clamped to two lines */}
                            <span className="mt-auto font-sans text-2xs text-text-tertiary">
                                {social.description}
                            </span>
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

ConnectLinks.displayName = "ConnectLinks";
