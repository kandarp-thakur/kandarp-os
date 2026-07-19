/**
 * AdminStatusBadge — a small colored pill for publish/status states.
 * Server component (no interactivity).
 */

interface AdminStatusBadgeProps {
    status: string;
}

const COLORS: Record<string, string> = {
    published: "bg-[var(--success)]/10 text-[var(--success)]",
    draft: "bg-[var(--warning)]/10 text-[var(--warning)]",
    scheduled: "bg-[var(--info)]/10 text-[var(--info)]",
    archived: "bg-[var(--text-quaternary)]/10 text-[var(--text-tertiary)]",
    active: "bg-[var(--success)]/10 text-[var(--success)]",
    completed: "bg-[var(--info)]/10 text-[var(--info)]",
    standby: "bg-[var(--warning)]/10 text-[var(--warning)]",
    maintenance: "bg-[var(--error)]/10 text-[var(--error)]",
    suspended: "bg-[var(--error)]/10 text-[var(--error)]",
    invited: "bg-[var(--text-quaternary)]/10 text-[var(--text-tertiary)]",
    running: "bg-[var(--success)]/10 text-[var(--success)]",
    exited: "bg-[var(--error)]/10 text-[var(--error)]",
    created: "bg-[var(--warning)]/10 text-[var(--warning)]",
};

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
    const colorClass =
        COLORS[status] ??
        "bg-[var(--text-quaternary)]/10 text-[var(--text-tertiary)]";
    return (
        <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${colorClass}`}
        >
            {status}
        </span>
    );
}
