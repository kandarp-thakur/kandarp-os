"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { useReducedMotion } from "@/3d/hooks/useReducedMotion";
import { resolveConnections } from "@/lib/skillsSummary";
import { cn } from "@/utils/cn";
import type {
    SkillDomain,
    SkillEdge,
    SkillNode,
    SkillStatus,
} from "@/types/skills";

interface SkillsMeshProps {
    /** Mesh nodes, positioned on a 0–100 grid. */
    nodes: SkillNode[];
    /** Edges connecting nodes — `from`/`to` reference node ids. */
    edges: SkillEdge[];
    className?: string;
}

/** Node size + ring style per status (skills-page-design §4.3, §4.5). */
const STATUS_RING: Record<
    SkillStatus,
    { size: string; ring: string; dot: string; label: string }
> = {
    active: {
        size: "h-10 w-10 sm:h-12 sm:w-12",
        ring: "border-success",
        dot: "bg-success",
        label: "active",
    },
    idle: {
        size: "h-9 w-9 sm:h-10 sm:w-10",
        ring: "border-text-tertiary",
        dot: "bg-text-tertiary",
        label: "idle",
    },
    learning: {
        size: "h-8 w-8",
        ring: "border-warning border-dashed",
        dot: "bg-warning",
        label: "learning",
    },
};

/** Domain tint for the legend dots (skills-page-design §9). */
const DOMAIN_TINT: Record<SkillDomain, string> = {
    frontend: "bg-info",
    backend: "bg-success",
    devops: "bg-accent-solid",
    data: "bg-warning",
    design: "bg-[#EC4899]",
};

const DOMAIN_LABEL: Record<SkillDomain, string> = {
    frontend: "frontend",
    backend: "backend",
    devops: "devops",
    data: "data",
    design: "design",
};

/**
 * The interactive skills service-mesh topology (skills-page-design §3–§6).
 *
 * Renders the skill set as a clickable graph: nodes are glass medallions
 * positioned on a 0–100 grid, edges are SVG lines drawn between them. Hovering
 * or focusing a node **illuminates its connected subgraph** — the hovered node
 * and its neighbors brighten, the rest of the mesh dims, and a detail panel
 * appears below the graph in flow (not a modal).
 *
 * Proficiency is a status, not a percentage: `active` nodes pulse, `idle`
 * nodes are solid gray, `learning` nodes carry a dashed rotating ring. The
 * graph is resolution-independent — node positions are percentages, edges are
 * computed from the same coordinates, so the layout is identical server- and
 * client-side (no hydration mismatch). Only one node is inspected at a time.
 *
 * Keyboard = hover: each node is focusable, and focus triggers the same
 * illumination + detail panel. Reduced motion disables the pulse, the dashed
 * rotation, and the entrance/illumination transitions (the subgraph still
 * highlights, just instantly).
 */
export function SkillsMesh({ nodes, edges, className }: SkillsMeshProps) {
    const prefersReducedMotion = useReducedMotion();
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const nodeById = useMemo(() => {
        const map = new Map<string, SkillNode>();
        for (const node of nodes) map.set(node.id, node);
        return map;
    }, [nodes]);

    // The set of node ids connected to the hovered/focused node — used to
    // illuminate edges + neighbors and dim the rest of the mesh.
    const connectedIds = useMemo(() => {
        const active = hoveredId;
        if (!active) return null;
        const set = new Set<string>([active]);
        for (const edge of edges) {
            if (edge.from === active) set.add(edge.to);
            if (edge.to === active) set.add(edge.from);
        }
        return set;
    }, [hoveredId, edges]);

    const hoveredNode = useMemo(
        () => (hoveredId ? (nodeById.get(hoveredId) ?? null) : null),
        [hoveredId, nodeById],
    );

    const hoveredConnections = useMemo(
        () => (hoveredNode ? resolveConnections(hoveredNode, nodeById) : []),
        [hoveredNode, nodeById],
    );

    const handleClear = useCallback(() => setHoveredId(null), []);

    const isEdgeActive = useCallback(
        (edge: SkillEdge) => {
            if (!hoveredId) return false;
            return edge.from === hoveredId || edge.to === hoveredId;
        },
        [hoveredId],
    );

    return (
        <section
            aria-label="Skills service mesh topology graph"
            className={cn("w-full", className)}
        >
            {/* The graph canvas — a responsive glass surface. */}
            <div
                className={cn(
                    "glass-surface relative w-full overflow-hidden rounded-2xl",
                    "h-[420px] sm:h-[560px]",
                )}
            >
                {/* Subtle grid backdrop — reads like a network diagram. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.35]"
                    style={{
                        backgroundImage:
                            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />

                {/* SVG edge layer — drawn behind the nodes. */}
                <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    {/* Accent gradient for illuminated edges (§3.4). */}
                    <defs>
                        <linearGradient
                            id="skill-edge-gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor="var(--accent-from)" />
                            <stop offset="50%" stopColor="var(--accent-via)" />
                            <stop offset="100%" stopColor="var(--accent-to)" />
                        </linearGradient>
                    </defs>
                    {edges.map((edge) => {
                        const from = nodeById.get(edge.from);
                        const to = nodeById.get(edge.to);
                        if (!from || !to) return null;
                        const active = isEdgeActive(edge);
                        return (
                            <line
                                key={`${edge.from}-${edge.to}`}
                                x1={from.x}
                                y1={from.y}
                                x2={to.x}
                                y2={to.y}
                                stroke={
                                    active
                                        ? "url(#skill-edge-gradient)"
                                        : "var(--border-strong)"
                                }
                                strokeWidth={active ? 0.5 : 0.3}
                                vectorEffect="non-scaling-stroke"
                                className={cn(
                                    "transition-[stroke,stroke-width,opacity] duration-normal ease-standard",
                                )}
                                style={{
                                    opacity: active
                                        ? 1
                                        : connectedIds
                                          ? 0.15
                                          : 0.5,
                                }}
                            />
                        );
                    })}
                </svg>

                {/* Domain legend — top-right, inside the canvas (§9.1). */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-3 z-20 hidden flex-col gap-1.5 rounded-md bg-glass-bg-subtle p-2 backdrop-blur-glass-subtle sm:flex"
                >
                    {(Object.keys(DOMAIN_TINT) as SkillDomain[]).map((d) => (
                        <span
                            key={d}
                            className="flex items-center gap-1.5 font-mono text-2xs text-text-tertiary"
                        >
                            <span
                                className={cn(
                                    "h-2 w-2 rounded-full",
                                    DOMAIN_TINT[d],
                                )}
                            />
                            {DOMAIN_LABEL[d]}
                        </span>
                    ))}
                </div>

                {/* Node layer — focusable glass medallions. */}
                <ol
                    className="absolute inset-0 list-none"
                    onMouseLeave={handleClear}
                >
                    {nodes.map((node, index) => {
                        const ring = STATUS_RING[node.status];
                        const isHovered = hoveredId === node.id;
                        const isNeighbor =
                            connectedIds !== null &&
                            connectedIds.has(node.id) &&
                            !isHovered;
                        const isDimmed =
                            connectedIds !== null && !connectedIds.has(node.id);
                        const entranceDelay = prefersReducedMotion
                            ? 0
                            : 0.2 + index * 0.03;

                        return (
                            <motion.li
                                key={node.id}
                                initial={
                                    prefersReducedMotion
                                        ? false
                                        : { opacity: 0, scale: 0.8 }
                                }
                                whileInView={
                                    prefersReducedMotion
                                        ? undefined
                                        : { opacity: 1, scale: 1 }
                                }
                                viewport={{ once: true, margin: "-40px" }}
                                transition={
                                    prefersReducedMotion
                                        ? { duration: 0 }
                                        : {
                                              duration: 0.32,
                                              ease: [0.34, 1.56, 0.64, 1],
                                              delay: entranceDelay,
                                          }
                                }
                                className="absolute"
                                style={{
                                    left: `${node.x}%`,
                                    top: `${node.y}%`,
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                <button
                                    type="button"
                                    onMouseEnter={() => setHoveredId(node.id)}
                                    onFocus={() => setHoveredId(node.id)}
                                    onBlur={() => setHoveredId(null)}
                                    aria-label={`${node.name}, ${ring.label}, connected to ${node.connections
                                        .map(
                                            (id) =>
                                                nodeById.get(id)?.name ?? id,
                                        )
                                        .join(", ")}`}
                                    className={cn(
                                        "group flex flex-col items-center gap-1.5 rounded-xl p-1.5",
                                        "transition-[transform,opacity] duration-normal ease-standard",
                                        "hover:z-10 focus-visible:z-10",
                                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                        isDimmed && "opacity-35",
                                    )}
                                >
                                    {/* The status-ringed medallion. */}
                                    <span
                                        className={cn(
                                            "relative flex items-center justify-center rounded-full",
                                            "border-2 bg-canvas-elevated",
                                            "transition-[box-shadow,border-color,transform] duration-normal ease-standard",
                                            ring.size,
                                            ring.ring,
                                            "shadow-glass",
                                            // Hovered → accent gradient ring + glow + scale.
                                            isHovered &&
                                                "border-transparent shadow-glow-sm [transform:scale(1.08)]",
                                            // Neighbor → subtle brighten + scale.
                                            isNeighbor &&
                                                "[transform:scale(1.04)]",
                                        )}
                                        style={
                                            isHovered
                                                ? {
                                                      backgroundImage:
                                                          "var(--accent-gradient)",
                                                      // Clip the gradient to the border ring.
                                                      WebkitMask:
                                                          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                                      WebkitMaskComposite:
                                                          "xor",
                                                      maskComposite: "exclude",
                                                      padding: "2px",
                                                  }
                                                : undefined
                                        }
                                    >
                                        {/* Active-node pulse ring (§4.6). */}
                                        {node.status === "active" &&
                                            !prefersReducedMotion && (
                                                <span
                                                    aria-hidden="true"
                                                    className={cn(
                                                        "pointer-events-none absolute inset-0 rounded-full border-2",
                                                        ring.ring,
                                                        "animate-mesh-pulse",
                                                    )}
                                                />
                                            )}

                                        {/* Abbreviation inside the node. */}
                                        <span
                                            className={cn(
                                                "font-mono font-semibold",
                                                "text-2xs sm:text-xs",
                                                isHovered || isNeighbor
                                                    ? "text-text-primary"
                                                    : "text-text-secondary",
                                            )}
                                        >
                                            {node.abbr}
                                        </span>
                                    </span>

                                    {/* Node label — full name below. */}
                                    <span
                                        className={cn(
                                            "font-mono leading-tight",
                                            "text-2xs sm:text-xs",
                                            isHovered || isNeighbor
                                                ? "text-text-primary"
                                                : isDimmed
                                                  ? "text-text-quaternary"
                                                  : "text-text-secondary",
                                        )}
                                    >
                                        {node.name}
                                    </span>
                                </button>
                            </motion.li>
                        );
                    })}
                </ol>
            </div>

            {/* Node detail panel — in flow, not a modal (§5.4). */}
            <div
                aria-live="polite"
                className="glass-surface mt-6 min-h-[120px] rounded-xl p-5"
            >
                {hoveredNode ? (
                    <motion.div
                        key={hoveredNode.id}
                        initial={
                            prefersReducedMotion ? false : { opacity: 0, y: 8 }
                        }
                        animate={
                            prefersReducedMotion
                                ? undefined
                                : { opacity: 1, y: 0 }
                        }
                        transition={
                            prefersReducedMotion
                                ? { duration: 0 }
                                : {
                                      duration: 0.2,
                                      ease: [0, 0, 0.2, 1],
                                  }
                        }
                    >
                        {/* Status dot + name. */}
                        <div className="flex items-center gap-2.5">
                            <span
                                className={cn(
                                    "h-2.5 w-2.5 shrink-0 rounded-full",
                                    STATUS_RING[hoveredNode.status].dot,
                                    hoveredNode.status === "active" &&
                                        !prefersReducedMotion &&
                                        "animate-mesh-pulse",
                                )}
                                aria-hidden="true"
                            />
                            <h2 className="font-mono text-base font-semibold text-text-primary">
                                {hoveredNode.name}
                            </h2>
                        </div>

                        {/* Tagline. */}
                        <p className="mt-1.5 text-sm text-text-secondary">
                            {hoveredNode.tagline}
                        </p>

                        {/* Fields — key: value rows. */}
                        <dl className="mt-4 flex flex-col gap-1.5 font-mono text-xs">
                            <div className="flex gap-2">
                                <dt className="text-text-tertiary">domain:</dt>
                                <dd className="text-text-primary">
                                    {DOMAIN_LABEL[hoveredNode.domain]}
                                </dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className="text-text-tertiary">status:</dt>
                                <dd className="text-text-primary">
                                    {STATUS_RING[hoveredNode.status].label}
                                </dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className="text-text-tertiary">
                                    connected:
                                </dt>
                                <dd className="text-accent-solid">
                                    {hoveredConnections.length > 0
                                        ? hoveredConnections
                                              .map((n) => n.name)
                                              .join(" · ")
                                        : "—"}
                                </dd>
                            </div>
                        </dl>
                    </motion.div>
                ) : (
                    <p className="font-mono text-xs text-text-quaternary">
                        hover a node to inspect
                    </p>
                )}
            </div>
        </section>
    );
}

SkillsMesh.displayName = "SkillsMesh";
