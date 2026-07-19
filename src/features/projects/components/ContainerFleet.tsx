"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";

import { ContainerRow } from "@features/projects/components/ContainerRow";
import { ContainerInspect } from "@features/projects/components/ContainerInspect";
import { Modal } from "@packages/ui/Modal";
import { useReducedMotion } from "@3d/hooks/useReducedMotion";
import { cn } from "@utils/cn";
import type { Container, ContainerStatus } from "@packages/types/projects";

interface ContainerFleetProps {
    /** Containers, ordered by recency (running first). */
    containers: Container[];
    className?: string;
}

/** Status filter options — `all` resets; others narrow by status (§3). */
type StatusFilter = "all" | ContainerStatus;

const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "running", label: "Running" },
    { key: "exited", label: "Exited" },
    { key: "created", label: "Created" },
];

/** Search debounce (ms) — §5.4. */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * The container fleet dashboard (projects-page-design §3–§6).
 *
 * Orchestrates the `docker ps`-style table: a filter bar (status segmented
 * filters + a `grep` search), the table header, the container rows, an empty
 * state, and the inspect panel (a `Modal` rendering `ContainerInspect`).
 *
 * Status filter AND search apply together (§3.4). Search is debounced. Only one
 * container is inspected at a time (§5.1). The Modal provides the scrim, focus
 * trap, and Escape handling; this component owns which container is open.
 */
export function ContainerFleet({ containers, className }: ContainerFleetProps) {
    const prefersReducedMotion = useReducedMotion();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [inspectedId, setInspectedId] = useState<string | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce the search term (§5.4). The raw input updates immediately for
    // responsiveness; the filter applies after the debounce window.
    const handleSearchChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setSearchInput(value);
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => {
                setSearchTerm(value);
            }, SEARCH_DEBOUNCE_MS);
        },
        [],
    );

    // Combined filter: status AND grep across name, stack, description (§3.4).
    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return containers.filter((container) => {
            if (statusFilter !== "all" && container.status !== statusFilter) {
                return false;
            }
            if (!term) return true;
            return (
                container.id.toLowerCase().includes(term) ||
                container.name.toLowerCase().includes(term) ||
                container.description.toLowerCase().includes(term) ||
                container.stack.some((tech) =>
                    tech.toLowerCase().includes(term),
                )
            );
        });
    }, [containers, statusFilter, searchTerm]);

    const inspectedContainer = useMemo(
        () => containers.find((c) => c.id === inspectedId) ?? null,
        [containers, inspectedId],
    );

    const handleInspect = useCallback((id: string) => {
        setInspectedId(id);
    }, []);

    const handleClose = useCallback(() => {
        setInspectedId(null);
    }, []);

    return (
        <section
            aria-label="Container fleet"
            className={cn("w-full", className)}
        >
            {/* Filter bar — status segmented filters + grep search (§3). */}
            <div className="glass-surface mb-6 flex flex-col gap-3 rounded-xl p-2.5 sm:flex-row sm:items-center">
                {/* Status segmented filters. */}
                <div
                    role="group"
                    aria-label="Filter containers by status"
                    className="flex flex-wrap gap-1"
                >
                    {FILTERS.map((filter) => {
                        const isActive = statusFilter === filter.key;
                        return (
                            <button
                                key={filter.key}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => setStatusFilter(filter.key)}
                                className={cn(
                                    "rounded-md px-3 py-1.5 font-mono text-2xs uppercase tracking-[0.1em]",
                                    "transition-colors duration-fast ease-standard",
                                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                                    isActive
                                        ? "bg-accent-subtle font-medium text-accent-solid"
                                        : "text-text-secondary hover:bg-overlay-hover",
                                )}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                </div>

                {/* Grep search. */}
                <div className="relative flex-1">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={searchInput}
                        onChange={handleSearchChange}
                        placeholder="grep ..."
                        aria-label="Search containers"
                        className={cn(
                            "h-9 w-full rounded-md border border-border-subtle bg-transparent pl-9 pr-3",
                            "font-mono text-sm text-text-primary placeholder:text-text-quaternary",
                            "transition-colors duration-fast ease-standard",
                            "focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                        )}
                    />
                </div>
            </div>

            {/* Table header — `docker ps` columns (§4.2). Desktop only. */}
            <div
                aria-hidden="true"
                className="mb-3 hidden items-center gap-6 px-5 md:grid md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)_140px_minmax(0,1.2fr)]"
            >
                {["Container", "Status", "Stack", "Ports", "Description"].map(
                    (heading) => (
                        <span
                            key={heading}
                            className="font-mono text-2xs uppercase tracking-[0.1em] text-text-tertiary"
                        >
                            {heading}
                        </span>
                    ),
                )}
            </div>

            {/* Container rows — the fleet. */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filtered.map((container, index) => (
                        <motion.div
                            key={container.id}
                            layout={!prefersReducedMotion}
                            initial={
                                prefersReducedMotion ? false : { opacity: 0 }
                            }
                            animate={{ opacity: 1 }}
                            exit={
                                prefersReducedMotion
                                    ? undefined
                                    : { opacity: 0 }
                            }
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : { duration: 0.2, ease: [0.4, 0, 1, 1] }
                            }
                        >
                            <ContainerRow
                                container={container}
                                isActive={inspectedId === container.id}
                                onInspect={handleInspect}
                                index={index}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Empty state — no containers match (§3.4). */}
                {filtered.length === 0 && (
                    <div className="glass-surface rounded-xl px-5 py-10 text-center">
                        <p className="font-mono text-sm text-text-tertiary">
                            <span className="text-text-secondary">$</span>{" "}
                            docker ps
                        </p>
                        <p className="mt-2 text-sm text-text-secondary">
                            No containers match.
                        </p>
                    </div>
                )}
            </div>

            {/* Inspect panel — `docker inspect` (§6). */}
            <Modal
                isOpen={inspectedContainer !== null}
                onClose={handleClose}
                title={
                    inspectedContainer ? (
                        <span className="flex items-center gap-2.5">
                            <span
                                className={cn(
                                    "h-3 w-3 shrink-0 rounded-full",
                                    STATUS_DOT[inspectedContainer.status],
                                    inspectedContainer.status === "running" &&
                                        "animate-status-pulse",
                                )}
                                role="img"
                                aria-label={`Status: ${inspectedContainer.status}`}
                            />
                            <span className="font-mono">
                                {inspectedContainer.id}
                            </span>
                        </span>
                    ) : undefined
                }
                description={
                    inspectedContainer
                        ? `$ docker inspect ${inspectedContainer.id}`
                        : undefined
                }
                size="lg"
                className="font-mono"
            >
                {inspectedContainer && (
                    <ContainerInspect container={inspectedContainer} />
                )}
            </Modal>
        </section>
    );
}

/** Status dot color per container status (§4.6). */
const STATUS_DOT: Record<ContainerStatus, string> = {
    running: "bg-success",
    exited: "bg-text-tertiary",
    created: "bg-warning",
};

ContainerFleet.displayName = "ContainerFleet";
