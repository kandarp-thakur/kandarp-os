"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import { CopyButton } from "@/components/shared/CopyButton";
import { DEVOPS_ICON_MAP } from "@/components/background/devopsIcons";
import { useReducedMotion } from "@/3d/hooks/useReducedMotion";
import { buildNodeManifestJson } from "@/lib/infrastructureSummary";
import { cn } from "@/utils/cn";
import type { InfraNode, NodeStatus } from "@/types/infrastructure";

interface NodeInspectProps {
    /** The topology node whose manifest to render. */
    node: InfraNode;
    className?: string;
}

/** Status dot color + label per node status. */
const STATUS_STYLES: Record<
    NodeStatus,
    { dot: string; text: string; label: string }
> = {
    active: {
        dot: "bg-success",
        text: "text-success",
        label: "active",
    },
    standby: {
        dot: "bg-info",
        text: "text-info",
        label: "standby",
    },
    maintenance: {
        dot: "bg-warning",
        text: "text-warning",
        label: "maintenance",
    },
};

/**
 * The `node inspect` detail panel content.
 *
 * Renders the full node manifest: a `node inspect`-style JSON identity card
 * (with a CopyButton), a description, image layers (stack), a specs table,
 * mounted volumes (metrics), operational notes, and an action footer of
 * primary/secondary CTAs.
 *
 * This component renders *only the panel body* — the surrounding dialog (scrim,
 * focus trap, slide animation, close button) is provided by the `Modal`. The
 * sections stagger in on open; under reduced motion they appear instantly.
 */
export function NodeInspect({ node, className }: NodeInspectProps) {
    const prefersReducedMotion = useReducedMotion();
    const manifest = buildNodeManifestJson(node);
    const icon = DEVOPS_ICON_MAP[node.icon];
    const status = STATUS_STYLES[node.status];

    // Section stagger — each block fades up +60ms after the previous.
    const sectionDelay = prefersReducedMotion ? 0 : 0.1;
    const sectionStep = prefersReducedMotion ? 0 : 0.06;

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header — icon + name + role + status (the node's identity). */}
            <motion.section
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : {
                              duration: 0.2,
                              ease: [0, 0, 0.2, 1],
                              delay: sectionDelay,
                          }
                }
                className="flex items-center gap-4"
            >
                <span
                    className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                        "bg-accent-subtle text-accent-solid",
                    )}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        aria-hidden="true"
                        focusable="false"
                    >
                        {icon.fill ? (
                            <path d={icon.path} fill="currentColor" />
                        ) : (
                            <path
                                d={icon.path}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}
                    </svg>
                </span>
                <div className="min-w-0">
                    <h2 className="text-h3 font-bold tracking-tight text-text-primary">
                        {node.name}
                    </h2>
                    <p className="font-mono text-sm text-text-secondary">
                        {node.role}
                    </p>
                </div>
                <span
                    className={cn(
                        "ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1",
                        "font-mono text-2xs uppercase tracking-[0.1em]",
                        status.text,
                    )}
                >
                    <span
                        className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            status.dot,
                            node.status === "active" && "animate-status-pulse",
                        )}
                        aria-hidden="true"
                    />
                    {status.label}
                </span>
            </motion.section>

            {/* Manifest block — `node inspect` JSON identity card. */}
            <motion.section
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                    prefersReducedMotion
                        ? { duration: 0 }
                        : {
                              duration: 0.2,
                              ease: [0, 0, 0.2, 1],
                              delay: sectionDelay + sectionStep,
                          }
                }
            >
                <div className="relative rounded-lg bg-glass-bg-subtle p-4">
                    <div className="absolute right-2 top-2">
                        <CopyButton value={manifest} label="Copy manifest" />
                    </div>
                    <pre
                        aria-hidden="true"
                        className="overflow-x-auto font-mono text-xs leading-relaxed"
                    >
                        <ManifestJson json={manifest} />
                    </pre>
                </div>
            </motion.section>

            {/* Description. */}
            <InspectSection
                title="📋 Description"
                delay={sectionDelay + sectionStep * 2}
            >
                <p className="text-sm leading-relaxed text-text-secondary">
                    {node.description}
                </p>
            </InspectSection>

            {/* Image layers / stack. */}
            <InspectSection
                title="🛠 Image Layers (Stack)"
                delay={sectionDelay + sectionStep * 3}
            >
                <ul className="flex flex-wrap gap-1.5">
                    {node.stack.map((tech) => (
                        <li
                            key={tech}
                            className="rounded-full bg-accent-subtle px-2.5 py-0.5 font-mono text-xs text-accent-solid"
                        >
                            {tech}
                        </li>
                    ))}
                </ul>
            </InspectSection>

            {/* Specs — key/value table. */}
            {node.specs.length > 0 && (
                <InspectSection
                    title="⚙️ Specs"
                    delay={sectionDelay + sectionStep * 4}
                >
                    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border-default sm:grid-cols-2">
                        {node.specs.map((spec) => (
                            <div
                                key={spec.label}
                                className="flex items-baseline justify-between gap-3 bg-glass-bg-subtle px-3 py-2"
                            >
                                <dt className="font-mono text-2xs uppercase tracking-[0.1em] text-text-tertiary">
                                    {spec.label}
                                </dt>
                                <dd className="font-mono text-sm text-text-primary">
                                    {spec.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </InspectSection>
            )}

            {/* Volumes / metrics. */}
            {node.metrics.length > 0 && (
                <InspectSection
                    title="📊 Volumes (Metrics)"
                    delay={sectionDelay + sectionStep * 5}
                >
                    <dl className="grid grid-cols-2 gap-3">
                        {node.metrics.map((metric) => (
                            <div
                                key={metric.label}
                                className="rounded-lg bg-glass-bg-subtle px-3 py-2"
                            >
                                <dd className="font-mono text-lg font-semibold text-text-primary">
                                    {metric.value}
                                </dd>
                                <dt className="font-mono text-2xs uppercase tracking-[0.1em] text-text-tertiary">
                                    {metric.label}
                                </dt>
                            </div>
                        ))}
                    </dl>
                </InspectSection>
            )}

            {/* Operational notes. */}
            {node.notes.length > 0 && (
                <InspectSection
                    title="📝 Notes"
                    delay={sectionDelay + sectionStep * 6}
                >
                    <ul className="space-y-1.5">
                        {node.notes.map((note, i) => (
                            <motion.li
                                key={note}
                                initial={
                                    prefersReducedMotion
                                        ? false
                                        : { opacity: 0, y: 4 }
                                }
                                animate={{ opacity: 1, y: 0 }}
                                transition={
                                    prefersReducedMotion
                                        ? { duration: 0 }
                                        : {
                                              duration: 0.2,
                                              ease: [0, 0, 0.2, 1],
                                              delay: i * 0.05,
                                          }
                                }
                                className="flex gap-2 text-sm text-text-secondary"
                            >
                                <span
                                    className="text-success"
                                    aria-hidden="true"
                                >
                                    ✓
                                </span>
                                <span>{note}</span>
                            </motion.li>
                        ))}
                    </ul>
                </InspectSection>
            )}

            {/* Action footer. */}
            {node.links.length > 0 && (
                <motion.section
                    initial={
                        prefersReducedMotion ? false : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                        prefersReducedMotion
                            ? { duration: 0 }
                            : {
                                  duration: 0.2,
                                  ease: [0, 0, 0.2, 1],
                                  delay: sectionDelay + sectionStep * 7,
                              }
                    }
                    className="flex flex-wrap gap-3 pt-2"
                >
                    {node.links.map((link) =>
                        link.variant === "primary" ? (
                            <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2",
                                    "font-sans text-sm font-medium leading-none",
                                    "bg-accent-gradient text-text-inverse shadow-glow-sm",
                                    "transition-[transform,filter,box-shadow] duration-fast ease-standard",
                                    "hover:brightness-108 hover:shadow-glow-md active:scale-[0.98]",
                                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                )}
                            >
                                {link.label}
                                <ExternalLink
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                            </a>
                        ) : (
                            <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "glass-surface inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2",
                                    "font-sans text-sm font-medium leading-none text-text-primary",
                                    "transition-[box-shadow,background-color] duration-fast ease-standard",
                                    "hover:shadow-glass-hover active:scale-[0.98]",
                                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                )}
                            >
                                {link.label}
                                <ExternalLink
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                />
                            </a>
                        ),
                    )}
                </motion.section>
            )}
        </div>
    );
}

interface InspectSectionProps {
    title: string;
    delay: number;
    children: React.ReactNode;
}

/** A labelled inspect section that fades up on open. */
function InspectSection({ title, delay, children }: InspectSectionProps) {
    const prefersReducedMotion = useReducedMotion();
    return (
        <motion.section
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
                prefersReducedMotion
                    ? { duration: 0 }
                    : {
                          duration: 0.24,
                          ease: [0, 0, 0.2, 1],
                          delay,
                      }
            }
        >
            <h3 className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                {title}
            </h3>
            <div className="mt-2">{children}</div>
        </motion.section>
    );
}

interface ManifestJsonProps {
    json: string;
}

/**
 * Renders the manifest JSON with syntax-highlighted keys/values/braces.
 * The raw JSON is decorative (`aria-hidden` on the parent `<pre>`); a semantic
 * duplicate is provided by the page's sr-only section.
 */
function ManifestJson({ json }: ManifestJsonProps) {
    // Tokenize: keys, string values, braces/punctuation, numbers.
    const lines = json.split("\n");
    return (
        <code>
            {lines.map((line) => {
                const match = /^(\s*)"([^"]+)":\s(.*)$/.exec(line);
                if (!match) {
                    return (
                        <span key={line} className="text-text-quaternary">
                            {line}
                            {"\n"}
                        </span>
                    );
                }
                const [, indent = "", key = "", rest = ""] = match;
                const isString = rest.startsWith('"');
                return (
                    <span key={`${key}-${line}`}>
                        <span className="text-text-quaternary">{indent}</span>
                        <span className="text-text-tertiary">
                            &ldquo;{key}&rdquo;
                        </span>
                        <span className="text-text-quaternary">: </span>
                        <span
                            className={
                                isString
                                    ? "text-accent-solid"
                                    : "text-text-primary"
                            }
                        >
                            {rest}
                        </span>
                        {"\n"}
                    </span>
                );
            })}
        </code>
    );
}

NodeInspect.displayName = "NodeInspect";
