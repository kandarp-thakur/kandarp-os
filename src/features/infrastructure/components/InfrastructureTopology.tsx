"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { NodeInspect } from "@features/infrastructure/components/NodeInspect";
import { Modal } from "@packages/ui/Modal";
import { DEVOPS_ICON_MAP } from "@features/background/components/devopsIcons";
import { useReducedMotion } from "@3d/hooks/useReducedMotion";
import { cn } from "@utils/cn";
import type {
    InfraEdge,
    InfraNode,
    NodeStatus,
} from "@packages/types/infrastructure";

interface InfrastructureTopologyProps {
    /** Topology nodes, positioned on a 0–100 grid. */
    nodes: InfraNode[];
    /** Edges connecting nodes — `from`/`to` reference node ids. */
    edges: InfraEdge[];
    className?: string;
}

/** Status dot color per node status. */
const STATUS_DOT: Record<NodeStatus, string> = {
    active: "bg-success",
    standby: "bg-info",
    maintenance: "bg-warning",
};

/**
 * The interactive infrastructure topology (infrastructure-page-design §3–§6).
 *
 * Renders the DevOps stack as a clickable graph: nodes are glass medallions
 * positioned on a 0–100 grid, edges are SVG lines drawn between them. Hovering
 * or focusing a node highlights its connected edges; clicking (or activating)
 * a node opens a `node inspect` Modal with its full manifest.
 *
 * The graph is resolution-independent — node positions are percentages, edges
 * are computed from the same coordinates, so the layout is identical server-
 * and client-side (no hydration mismatch). Only one node is inspected at a
 * time; the Modal owns the scrim, focus trap, and Escape handling.
 */
export function InfrastructureTopology({
    nodes,
    edges,
    className,
}: InfrastructureTopologyProps) {
    const prefersReducedMotion = useReducedMotion();
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [inspectedId, setInspectedId] = useState<string | null>(null);

    const nodeById = useMemo(() => {
        const map = new Map<string, InfraNode>();
        for (const node of nodes) map.set(node.id, node);
        return map;
    }, [nodes]);

    // The set of node ids connected to the hovered/focused node — used to
    // highlight edges + dim unrelated nodes.
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

    const inspectedNode = useMemo(
        () => (inspectedId ? (nodeById.get(inspectedId) ?? null) : null),
        [inspectedId, nodeById],
    );

    const handleInspect = useCallback((id: string) => {
        setInspectedId(id);
    }, []);

    const handleClose = useCallback(() => {
        setInspectedId(null);
    }, []);

    const isEdgeActive = useCallback(
        (edge: InfraEdge) => {
            if (!hoveredId) return false;
            return edge.from === hoveredId || edge.to === hoveredId;
        },
        [hoveredId],
    );

    return (
        <section
            aria-label="Infrastructure topology graph"
            className={cn("w-full", className)}
        >
            {/* The graph canvas — a responsive aspect box. */}
            <div
                className={cn(
                    "glass-surface relative w-full overflow-hidden rounded-2xl",
                    "aspect-[4/3] sm:aspect-[16/10]",
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
                    {edges.map((edge) => {
                        const from = nodeById.get(edge.from);
                        const to = nodeById.get(edge.to);
                        if (!from || !to) return null;
                        const active = isEdgeActive(edge);
                        return (
                            <g key={`${edge.from}-${edge.to}`}>
                                <line
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    className={cn(
                                        "transition-[stroke,stroke-width,opacity] duration-normal ease-standard",
                                        active
                                            ? "stroke-accent-solid"
                                            : "stroke-border-strong",
                                    )}
                                    strokeWidth={active ? 0.5 : 0.3}
                                    vectorEffect="non-scaling-stroke"
                                    opacity={connectedIds && !active ? 0.25 : 1}
                                />
                                {edge.label && (
                                    <text
                                        x={(from.x + to.x) / 2}
                                        y={(from.y + to.y) / 2}
                                        className={cn(
                                            "font-mono transition-[fill,opacity] duration-normal ease-standard",
                                            active
                                                ? "fill-accent-solid"
                                                : "fill-text-tertiary",
                                        )}
                                        fontSize="1.6"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        opacity={
                                            connectedIds && !active ? 0.3 : 0.9
                                        }
                                    >
                                        {edge.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Node layer — clickable glass medallions. */}
                <ol className="absolute inset-0 list-none">
                    {nodes.map((node, index) => {
                        const icon = DEVOPS_ICON_MAP[node.icon];
                        const isHovered = hoveredId === node.id;
                        const isDimmed =
                            connectedIds !== null && !connectedIds.has(node.id);
                        const entranceDelay = prefersReducedMotion
                            ? 0
                            : 0.1 + index * 0.05;

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
                                              duration: 0.4,
                                              ease: [0, 0, 0.2, 1],
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
                                    onClick={() => handleInspect(node.id)}
                                    onMouseEnter={() => setHoveredId(node.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onFocus={() => setHoveredId(node.id)}
                                    onBlur={() => setHoveredId(null)}
                                    aria-label={`Inspect ${node.name} — ${node.role}`}
                                    className={cn(
                                        "group flex flex-col items-center gap-1.5 rounded-xl p-2",
                                        "transition-[transform,opacity] duration-normal ease-standard",
                                        "hover:z-10 hover:-translate-y-0.5 focus-visible:z-10",
                                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                        isDimmed && "opacity-40",
                                    )}
                                >
                                    {/* The glass medallion — icon + status dot. */}
                                    <span
                                        className={cn(
                                            "relative flex items-center justify-center rounded-full",
                                            "h-12 w-12 sm:h-14 sm:w-14",
                                            "glass-surface-strong text-accent-solid",
                                            "transition-[box-shadow,border-color,transform] duration-normal ease-standard",
                                            "group-hover:border-accent group-hover:shadow-glow-sm",
                                            "group-focus-visible:border-accent group-focus-visible:shadow-glow-sm",
                                            isHovered &&
                                                "border-accent shadow-glow-sm",
                                        )}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="h-6 w-6 sm:h-7 sm:w-7"
                                            aria-hidden="true"
                                            focusable="false"
                                        >
                                            {icon.fill ? (
                                                <path
                                                    d={icon.path}
                                                    fill="currentColor"
                                                />
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
                                        {/* Status dot — pulses when active. */}
                                        <span
                                            className={cn(
                                                "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-canvas-elevated",
                                                STATUS_DOT[node.status],
                                                node.status === "active" &&
                                                    "animate-status-pulse",
                                            )}
                                            aria-hidden="true"
                                        />
                                    </span>
                                    {/* Node label — name + role. */}
                                    <span className="flex flex-col items-center leading-tight">
                                        <span className="font-mono text-xs font-semibold text-text-primary">
                                            {node.name}
                                        </span>
                                        <span className="hidden font-mono text-2xs text-text-tertiary sm:block">
                                            {node.role}
                                        </span>
                                    </span>
                                </button>
                            </motion.li>
                        );
                    })}
                </ol>
            </div>

            {/* The inspect panel — a Modal hosting NodeInspect. */}
            <Modal
                isOpen={inspectedNode !== null}
                onClose={handleClose}
                title={inspectedNode?.name}
                description={inspectedNode?.role}
                size="lg"
            >
                {inspectedNode ? (
                    <div className="overflow-y-auto px-6 py-6">
                        <NodeInspect node={inspectedNode} />
                    </div>
                ) : null}
            </Modal>
        </section>
    );
}

InfrastructureTopology.displayName = "InfrastructureTopology";
