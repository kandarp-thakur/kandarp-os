"use client";

import { useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { useReducedMotion } from "@/3d/hooks/useReducedMotion";
import { formatDeploymentRange } from "@/lib/experienceSummary";
import { cn } from "@/utils/cn";
import type { Deployment } from "@/types/experience";

interface DeploymentCardProps {
    /** The deployment (role) to render. */
    deployment: Deployment;
    /** Whether this card is the expanded one (accordion-controlled). */
    isExpanded: boolean;
    /** Toggle handler — called when the header is activated. */
    onToggle: (id: string) => void;
    /** Index in the list — drives the entrance stagger delay. */
    index: number;
    className?: string;
}

/** Status dot color + label per deployment status (§4.4, §5.4). */
const STATUS_STYLES: Record<
    Deployment["status"],
    { dot: string; text: string; label: string }
> = {
    active: {
        dot: "bg-success",
        text: "text-success",
        label: "active",
    },
    completed: {
        dot: "bg-info",
        text: "text-info",
        label: "completed",
    },
};

/**
 * A single role rendered as a Kubernetes-style deployment card
 * (experience-page-design §4–§5).
 *
 * Collapsed: status dot, version, role, company + dates, deployment metadata
 * (image / replicas / uptime), and a one-line summary. Expanded: a CI/CD-style
 * changelog, a tech-stack badge row, and external links — revealed like build
 * logs in a deployment dashboard.
 *
 * Accordion-controlled: the parent owns which card is open (one at a time).
 * The header is a native `<button>` (keyboard + a11y native); the expanded
 * region is a labelled `region`. Reduced motion collapses the height
 * animation to instant.
 */
export function DeploymentCard({
    deployment,
    isExpanded,
    onToggle,
    index,
    className,
}: DeploymentCardProps) {
    const prefersReducedMotion = useReducedMotion();
    const status = STATUS_STYLES[deployment.status];
    const panelId = `deployment-panel-${deployment.id}`;
    const headerId = `deployment-header-${deployment.id}`;

    const handleToggle = useCallback(() => {
        onToggle(deployment.id);
    }, [deployment.id, onToggle]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            // Escape collapses an expanded card (§9.3).
            if (event.key === "Escape" && isExpanded) {
                event.preventDefault();
                onToggle(deployment.id);
            }
        },
        [deployment.id, isExpanded, onToggle],
    );

    // Entrance: fade up + slide from the timeline side. Disabled (instant)
    // under reduced motion (animation-design §5.2).
    const entranceDelay = prefersReducedMotion ? 0 : 0.1 + index * 0.06;

    return (
        <motion.article
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={
                prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
            }
            viewport={{ once: true, margin: "-80px" }}
            transition={
                prefersReducedMotion
                    ? { duration: 0 }
                    : {
                          duration: 0.48,
                          ease: [0, 0, 0.2, 1],
                          delay: entranceDelay,
                      }
            }
            className={cn(
                "glass-surface group relative overflow-hidden rounded-xl",
                "transition-[box-shadow,transform,border-color] duration-fast ease-standard",
                "hover:-translate-y-0.5 hover:shadow-glass-hover hover:border-accent",
                "focus-within:border-accent focus-within:shadow-glass-hover",
                className,
            )}
        >
            {/* Header button — toggles expand/collapse (native, keyboard-accessible). */}
            <button
                id={headerId}
                type="button"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                className="flex w-full items-start gap-3 px-5 py-4 text-left sm:px-5 sm:py-5"
            >
                {/* Status dot — pulses when active (§8.4). */}
                <span
                    className={cn(
                        "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                        status.dot,
                        deployment.status === "active" &&
                            "animate-status-pulse",
                    )}
                    role="img"
                    aria-label={`Status: ${status.label}`}
                />

                <div className="min-w-0 flex-1">
                    {/* Header row: version — role + chevron. */}
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-accent-solid">
                            {deployment.version}
                        </span>
                        <span className="text-text-tertiary" aria-hidden="true">
                            —
                        </span>
                        <h3 className="truncate text-base font-semibold text-text-primary">
                            {deployment.role}
                        </h3>
                        <ChevronDown
                            className={cn(
                                "ml-auto h-4 w-4 shrink-0 text-text-tertiary",
                                "transition-transform duration-normal ease-standard",
                                isExpanded && "rotate-180",
                            )}
                            aria-hidden="true"
                        />
                    </div>

                    {/* Status text + company + dates. */}
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-text-secondary">
                        <span className={cn("font-mono text-xs", status.text)}>
                            ● {status.label}
                        </span>
                        <span className="text-text-tertiary" aria-hidden="true">
                            ·
                        </span>
                        <span>{deployment.company}</span>
                        <span className="text-text-tertiary" aria-hidden="true">
                            ·
                        </span>
                        <span className="font-mono text-xs text-text-tertiary">
                            {formatDeploymentRange(
                                deployment.startDate,
                                deployment.endDate,
                            )}
                        </span>
                    </p>

                    {/* Deployment metadata row (§4.5). */}
                    <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-text-tertiary">
                        <MetaItem label="Image" value={deployment.image} />
                        <MetaItem
                            label="Replicas"
                            value={deployment.replicas}
                        />
                        <MetaItem label="Uptime" value={deployment.uptime} />
                    </dl>

                    {/* One-line summary (§4.6). */}
                    <p className="mt-3 line-clamp-1 text-sm text-text-secondary">
                        <span className="text-accent-solid" aria-hidden="true">
                            ▸{" "}
                        </span>
                        {deployment.summary}
                    </p>
                </div>
            </button>

            {/* Expandable detail — CI/CD pipeline-style (§5). */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="panel"
                        id={panelId}
                        role="region"
                        aria-labelledby={headerId}
                        initial={
                            prefersReducedMotion
                                ? { height: 0, opacity: 0 }
                                : { height: 0, opacity: 0 }
                        }
                        animate={
                            prefersReducedMotion
                                ? { height: "auto", opacity: 1 }
                                : { height: "auto", opacity: 1 }
                        }
                        exit={
                            prefersReducedMotion
                                ? { height: 0, opacity: 0 }
                                : { height: 0, opacity: 0 }
                        }
                        transition={
                            prefersReducedMotion
                                ? { duration: 0 }
                                : {
                                      height: {
                                          duration: 0.32,
                                          ease: [0.45, 0, 0.15, 1],
                                      },
                                      opacity: {
                                          duration: 0.2,
                                          ease: [0.4, 0, 1, 1],
                                      },
                                  }
                        }
                        className="overflow-hidden"
                    >
                        <div className="border-t border-border-subtle px-5 py-4 sm:px-5">
                            <Changelog items={deployment.changelog} />
                            <Stack items={deployment.stack} />
                            <DeploymentLinks deployment={deployment} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
}

interface MetaItemProps {
    label: string;
    value: string;
}

/** A single deployment metadata field: `Label: value`. */
function MetaItem({ label, value }: MetaItemProps) {
    return (
        <div className="flex items-baseline gap-1">
            <dt className="text-text-quaternary">{label}:</dt>
            <dd className="text-text-secondary">{value}</dd>
        </div>
    );
}

interface ChangelogProps {
    items: string[];
}

/** Achievement-focused changelog — each item prefixed with ✓ in success green. */
function Changelog({ items }: ChangelogProps) {
    return (
        <section>
            <h4 className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                📋 Changelog
            </h4>
            <ul className="mt-2 space-y-1.5">
                {items.map((item, i) => (
                    <motion.li
                        key={item}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.2,
                            ease: [0, 0, 0.2, 1],
                            delay: i * 0.05,
                        }}
                        className="flex gap-2 text-sm text-text-secondary"
                    >
                        <span className="text-success" aria-hidden="true">
                            ✓
                        </span>
                        <span>{item}</span>
                    </motion.li>
                ))}
            </ul>
        </section>
    );
}

interface StackProps {
    items: string[];
}

/** Tech badges — glass pills, display-only (non-clickable). */
function Stack({ items }: StackProps) {
    return (
        <section className="mt-4">
            <h4 className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                🛠 Stack
            </h4>
            <ul className="mt-2 flex flex-wrap gap-1.5">
                {items.map((tech) => (
                    <li
                        key={tech}
                        className="rounded-md bg-accent-subtle px-2 py-0.5 font-mono text-xs text-accent-solid"
                    >
                        {tech}
                    </li>
                ))}
            </ul>
        </section>
    );
}

interface DeploymentLinksProps {
    deployment: Deployment;
}

/** External links — ghost buttons opening in a new tab (§5.4). */
function DeploymentLinks({ deployment }: DeploymentLinksProps) {
    if (deployment.links.length === 0) return null;

    return (
        <section className="mt-4">
            <h4 className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                🌐 Links
            </h4>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {deployment.links.map((link) => (
                    <li key={link.url}>
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-accent-solid transition-colors duration-fast ease-standard hover:text-accent-hover"
                        >
                            {link.label}
                            <span aria-hidden="true">↗</span>
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}

DeploymentCard.displayName = "DeploymentCard";
