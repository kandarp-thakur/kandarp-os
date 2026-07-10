"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";

import { useReducedMotion } from "@/3d/hooks/useReducedMotion";
import { cn } from "@/utils/cn";
import type { Container, ContainerStatus } from "@/types/projects";

interface ContainerRowProps {
    /** The container (project) to render. */
    container: Container;
    /** Whether this row is the inspected one (highlighted). */
    isActive: boolean;
    /** Open the inspect panel for this container. */
    onInspect: (id: string) => void;
    /** Index in the list — drives the entrance stagger delay. */
    index: number;
    className?: string;
}

/** Max stack badges visible before collapsing to a `+N` overflow chip. */
const MAX_STACK_VISIBLE = 3;

/** Status dot color + text per container status (§4.6). */
const STATUS_STYLES: Record<
    ContainerStatus,
    { dot: string; text: string; label: string }
> = {
    running: {
        dot: "bg-success",
        text: "text-success",
        label: "running",
    },
    exited: {
        dot: "bg-text-tertiary",
        text: "text-text-tertiary",
        label: "exited",
    },
    created: {
        dot: "bg-warning",
        text: "text-warning",
        label: "created",
    },
};

/**
 * A single project rendered as a `docker ps`-style container row
 * (projects-page-design §4).
 *
 * Each row is a hover-lifting glass card (not a flat `<tr>`) laid out as a
 * 5-column grid on desktop (container / status / stack / ports / description)
 * and a stacked card on mobile. Clicking anywhere on the row opens the
 * inspect panel; clicking a port link opens that endpoint directly without
 * triggering inspect (§5.1).
 *
 * The row is keyboard-accessible: it is focusable (`tabindex="0"`) and
 * Enter/Space opens inspect (§5.3). Port links are individually focusable.
 */
export function ContainerRow({
    container,
    isActive,
    onInspect,
    index,
    className,
}: ContainerRowProps) {
    const prefersReducedMotion = useReducedMotion();
    const status = STATUS_STYLES[container.status];

    const handleActivate = useCallback(() => {
        onInspect(container.id);
    }, [container.id, onInspect]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onInspect(container.id);
            }
        },
        [container.id, onInspect],
    );

    // Entrance: fade up + stagger. Instant under reduced motion (§9.7).
    const entranceDelay = prefersReducedMotion ? 0 : index * 0.06;

    const visibleStack = container.stack.slice(0, MAX_STACK_VISIBLE);
    const overflowCount = container.stack.length - visibleStack.length;

    return (
        <motion.article
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={
                prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
            }
            viewport={{ once: true, margin: "-60px" }}
            transition={
                prefersReducedMotion
                    ? { duration: 0 }
                    : {
                          duration: 0.32,
                          ease: [0, 0, 0.2, 1],
                          delay: entranceDelay,
                      }
            }
            role="row"
            tabIndex={0}
            onClick={handleActivate}
            onKeyDown={handleKeyDown}
            aria-label={`Inspect container ${container.id}`}
            aria-selected={isActive}
            className={cn(
                "glass-surface group relative cursor-pointer overflow-hidden rounded-xl",
                "px-4 py-4 sm:px-5",
                "transition-[box-shadow,transform,border-color] duration-normal ease-standard",
                "hover:-translate-y-0.5 hover:shadow-glass-hover hover:border-accent",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                isActive && "border-accent shadow-glass-hover",
                className,
            )}
        >
            {/* Desktop: 5-column grid (§4.2). */}
            <div className="hidden items-center gap-4 md:grid md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_140px_minmax(0,1.2fr)] md:gap-6">
                {/* Container — status dot + name. */}
                <div className="flex min-w-0 items-center gap-2.5">
                    <span
                        className={cn(
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            status.dot,
                            container.status === "running" &&
                                "animate-status-pulse",
                        )}
                        role="img"
                        aria-label={`Status: ${status.label}`}
                    />
                    <span className="truncate font-mono text-sm font-semibold text-text-primary">
                        {container.id}
                    </span>
                </div>

                {/* Status. */}
                <span className={cn("font-mono text-xs", status.text)}>
                    {container.statusDetail}
                </span>

                {/* Stack — image-layer badges. */}
                <StackBadges
                    visible={visibleStack}
                    overflow={overflowCount}
                    remaining={container.stack.slice(MAX_STACK_VISIBLE)}
                />

                {/* Ports — exposed endpoints. */}
                <Ports ports={container.ports} />

                {/* Description. */}
                <p className="line-clamp-2 text-sm text-text-secondary">
                    {container.description}
                </p>
            </div>

            {/* Mobile: stacked card (§10.1). */}
            <div className="space-y-2.5 md:hidden">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span
                            className={cn(
                                "h-2.5 w-2.5 shrink-0 rounded-full",
                                status.dot,
                                container.status === "running" &&
                                    "animate-status-pulse",
                            )}
                            role="img"
                            aria-label={`Status: ${status.label}`}
                        />
                        <span className="truncate font-mono text-sm font-semibold text-text-primary">
                            {container.id}
                        </span>
                    </div>
                    <span
                        className={cn(
                            "shrink-0 font-mono text-xs",
                            status.text,
                        )}
                    >
                        {container.statusDetail}
                    </span>
                </div>

                <StackBadges
                    visible={visibleStack.slice(0, 2)}
                    overflow={Math.max(0, container.stack.length - 2)}
                    remaining={container.stack.slice(2)}
                />

                <Ports ports={container.ports} />

                <p className="text-sm text-text-secondary">
                    {container.description}
                </p>
            </div>
        </motion.article>
    );
}

interface StackBadgesProps {
    visible: string[];
    overflow: number;
    remaining: string[];
}

/** Image-layer badges — glass pills, max visible then `+N` overflow (§4.7). */
function StackBadges({ visible, overflow, remaining }: StackBadgesProps) {
    return (
        <ul className="flex min-w-0 flex-wrap items-center gap-1.5">
            {visible.map((tech) => (
                <li
                    key={tech}
                    className="rounded-full bg-accent-subtle px-2.5 py-0.5 font-mono text-2xs text-accent-solid"
                >
                    {tech}
                </li>
            ))}
            {overflow > 0 && (
                <li
                    className="rounded-full bg-canvas-tint px-2 py-0.5 font-mono text-2xs text-text-tertiary"
                    title={remaining.join(", ")}
                >
                    +{overflow}
                </li>
            )}
        </ul>
    );
}

interface PortsProps {
    ports: Container["ports"];
}

/** Exposed endpoints — `:PORT ↗` mono links (§4.8). */
function Ports({ ports }: PortsProps) {
    if (ports.length === 0) {
        return (
            <span className="font-mono text-xs text-text-quaternary">—</span>
        );
    }

    return (
        <ul className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            {ports.map((port) => (
                <li key={port.url}>
                    <a
                        href={port.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-0.5 font-mono text-xs text-accent-solid transition-colors duration-fast ease-standard hover:text-accent-hover hover:underline"
                    >
                        {port.port}
                        <span aria-hidden="true">↗</span>
                        <span className="sr-only">{port.label}</span>
                    </a>
                </li>
            ))}
        </ul>
    );
}

ContainerRow.displayName = "ContainerRow";
