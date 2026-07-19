"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import { CopyButton } from "@features/shared/components/CopyButton";
import { useReducedMotion } from "@3d/hooks/useReducedMotion";
import { buildManifestJson } from "@/lib/projectsSummary";
import { cn } from "@utils/cn";
import type { Container } from "@packages/types/projects";

interface ContainerInspectProps {
    /** The container whose manifest to render. */
    container: Container;
    className?: string;
}

/**
 * The `docker inspect` detail panel content (projects-page-design §6).
 *
 * Renders the full container manifest: a `docker inspect`-style JSON identity
 * card (with a CopyButton), a description, image layers (stack), exposed ports,
 * volumes (metrics), and a versioned commit log (changelog). Closes with an
 * action footer of primary/secondary CTAs.
 *
 * This component renders *only the panel body* — the surrounding dialog (scrim,
 * focus trap, slide animation, close button) is provided by the `Modal`. The
 * sections stagger in on open (§9.3); under reduced motion they appear
 * instantly (§9.7).
 */
export function ContainerInspect({
    container,
    className,
}: ContainerInspectProps) {
    const prefersReducedMotion = useReducedMotion();
    const manifest = buildManifestJson(container);

    // Section stagger — each block fades up +60ms after the previous (§9.3).
    const sectionDelay = prefersReducedMotion ? 0 : 0.1;
    const sectionStep = prefersReducedMotion ? 0 : 0.06;

    return (
        <div className={cn("space-y-6", className)}>
            {/* Manifest block — `docker inspect` JSON identity card (§6.5). */}
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

            {/* Description (§6.6). */}
            <InspectSection
                title="📋 Description"
                delay={sectionDelay + sectionStep}
            >
                <p className="text-sm leading-relaxed text-text-secondary">
                    {container.longDescription}
                </p>
            </InspectSection>

            {/* Image layers / stack (§6.6). */}
            <InspectSection
                title="🛠 Image Layers (Stack)"
                delay={sectionDelay + sectionStep * 2}
            >
                <ul className="flex flex-wrap gap-1.5">
                    {container.stack.map((tech) => (
                        <li
                            key={tech}
                            className="rounded-full bg-accent-subtle px-2.5 py-0.5 font-mono text-xs text-accent-solid"
                        >
                            {tech}
                        </li>
                    ))}
                </ul>
            </InspectSection>

            {/* Exposed ports (§6.6). */}
            {container.ports.length > 0 && (
                <InspectSection
                    title="🔌 Exposed Ports"
                    delay={sectionDelay + sectionStep * 3}
                >
                    <ul className="space-y-2">
                        {container.ports.map((port) => (
                            <li
                                key={port.url}
                                className="flex items-center gap-2"
                            >
                                <span className="font-mono text-sm text-accent-solid">
                                    {port.port}
                                </span>
                                <span
                                    className="text-text-tertiary"
                                    aria-hidden="true"
                                >
                                    →
                                </span>
                                <a
                                    href={port.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-text-secondary transition-colors duration-fast ease-standard hover:text-accent-solid hover:underline"
                                >
                                    {port.label}
                                    <span aria-hidden="true"> ↗</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </InspectSection>
            )}

            {/* Volumes / metrics (§6.6). */}
            {container.metrics.length > 0 && (
                <InspectSection
                    title="📊 Volumes (Metrics)"
                    delay={sectionDelay + sectionStep * 4}
                >
                    <dl className="grid grid-cols-2 gap-3">
                        {container.metrics.map((metric) => (
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

            {/* Commit log / changelog (§6.6). */}
            {container.changelog.length > 0 && (
                <InspectSection
                    title="📜 Commit Log (Changelog)"
                    delay={sectionDelay + sectionStep * 5}
                >
                    <ul className="space-y-1.5">
                        {container.changelog.map((entry, i) => (
                            <motion.li
                                key={`${entry.version}-${entry.text}`}
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
                                <span className="font-mono text-xs font-semibold text-accent-solid">
                                    {entry.version}
                                </span>
                                <span>{entry.text}</span>
                            </motion.li>
                        ))}
                    </ul>
                </InspectSection>
            )}

            {/* Action footer (§6.6). */}
            {container.links.length > 0 && (
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
                                  delay: sectionDelay + sectionStep * 6,
                              }
                    }
                    className="flex flex-wrap gap-3 pt-2"
                >
                    {container.links.map((link) =>
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

/** A labelled inspect section that fades up on open (§6.6, §9.3). */
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
 * Renders the manifest JSON with syntax-highlighted keys/values/braces (§6.5).
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

ContainerInspect.displayName = "ContainerInspect";
