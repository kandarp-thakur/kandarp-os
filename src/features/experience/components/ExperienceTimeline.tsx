"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

import { DeploymentCard } from "@features/experience/components/DeploymentCard";
import { useReducedMotion } from "@3d/hooks/useReducedMotion";
import { cn } from "@utils/cn";
import type { Deployment } from "@packages/types/experience";

interface ExperienceTimelineProps {
    /** Deployments, newest-first. */
    deployments: Deployment[];
    className?: string;
}

/**
 * The animated deployment-history timeline (experience-page-design §3, §10).
 *
 * A vertical line runs down the center on desktop (cards alternate left/right)
 * and down the left edge on mobile (cards stack to the right). The line fills
 * with the accent gradient as the user scrolls (scrubbed via `useScroll` +
 * `useSpring`); under reduced motion it renders fully filled.
 *
 * Cards are accordion-controlled: only one is expanded at a time (§9.1).
 */
export function ExperienceTimeline({
    deployments,
    className,
}: ExperienceTimelineProps) {
    const prefersReducedMotion = useReducedMotion();
    const containerRef = useRef<HTMLElement>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Scroll progress of the timeline container — drives the gradient fill.
    // `offset` keeps the fill tied to the container's own scroll-through.
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end center"],
    });
    const fillScaleY = useSpring(scrollYProgress, {
        stiffness: 300,
        damping: 26,
        mass: 1,
        restDelta: 0.001,
    });

    const handleToggle = useCallback((id: string) => {
        setExpandedId((current) => (current === id ? null : id));
    }, []);

    return (
        <section
            ref={containerRef}
            aria-label="Deployment history timeline"
            className={cn("relative", className)}
        >
            {/* Timeline track + gradient fill (decorative — §11). */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-6 hidden md:left-1/2 md:block md:-translate-x-1/2"
            >
                {/* Base track. */}
                <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-border-default" />
                {/* Gradient progress fill. */}
                <motion.div
                    className="absolute left-1/2 top-0 w-0.5 -translate-x-1/2 origin-top bg-accent-gradient shadow-glow-sm"
                    style={
                        prefersReducedMotion
                            ? { scaleY: 1 }
                            : { scaleY: fillScaleY }
                    }
                />
            </div>

            {/* Deployment entries. */}
            <ol className="relative space-y-8">
                {deployments.map((deployment, index) => {
                    const isLeft = index % 2 === 0;
                    return (
                        <li
                            key={deployment.id}
                            className="relative md:grid md:grid-cols-2 md:gap-x-12"
                        >
                            {/* Timeline node (decorative). */}
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "absolute left-6 top-5 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-accent-solid bg-canvas-elevated shadow-glow-sm",
                                    "md:left-1/2",
                                    deployment.status === "active" &&
                                        "animate-status-pulse",
                                )}
                            />

                            {/* Card — alternating sides on desktop, right of line on mobile. */}
                            <div
                                className={cn(
                                    "pl-14 md:pl-0",
                                    isLeft
                                        ? "md:col-start-1 md:pr-12"
                                        : "md:col-start-2 md:pl-12",
                                )}
                            >
                                <DeploymentCard
                                    deployment={deployment}
                                    isExpanded={expandedId === deployment.id}
                                    onToggle={handleToggle}
                                    index={index}
                                />
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

ExperienceTimeline.displayName = "ExperienceTimeline";
