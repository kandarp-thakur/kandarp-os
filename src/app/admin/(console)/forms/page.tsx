"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Archive,
    ChevronLeft,
    ChevronRight,
    Inbox,
    Loader2,
    Mail,
    MailOpen,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
    X,
} from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import type { ContactStatus, ContactSubmission } from "@backend/schemas/types";

interface InboxResponse {
    rows: ContactSubmission[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    unread: number;
}

const STATUS_OPTIONS: Array<{ value: "all" | ContactStatus; label: string }> = [
    { value: "all", label: "All" },
    { value: "new", label: "New" },
    { value: "read", label: "Read" },
    { value: "replied", label: "Replied" },
    { value: "archived", label: "Archived" },
    { value: "spam", label: "Spam" },
];

const STATUS_STYLES: Record<ContactStatus, string> = {
    new: "border-[var(--accent-solid)]/30 bg-[var(--accent-solid)]/10 text-[var(--accent-solid)]",
    read: "border-[var(--border-default)] bg-[var(--overlay-hover)] text-[var(--text-tertiary)]",
    replied:
        "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
    archived:
        "border-[var(--border-default)] bg-[var(--canvas-sunken)] text-[var(--text-tertiary)]",
    spam: "border-[var(--error)]/30 bg-[var(--error)]/10 text-[var(--error)]",
};

export default function AdminFormsPage() {
    const [data, setData] = useState<InboxResponse>({
        rows: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        unread: 0,
    });
    const [loading, setLoading] = useState(true);
    const [mutating, setMutating] = useState(false);
    const [error, setError] = useState<string>();
    const [search, setSearch] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [status, setStatus] = useState<"all" | ContactStatus>("all");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<ContactSubmission>();

    const load = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        const params = new URLSearchParams({
            page: String(page),
            pageSize: "20",
        });
        if (status !== "all") params.set("status", status);
        if (appliedSearch) params.set("search", appliedSearch);

        try {
            const response = await fetch(
                `/api/admin/contact-submissions?${params.toString()}`,
            );
            const payload = (await response.json()) as InboxResponse & {
                error?: string;
            };
            if (!response.ok) {
                throw new Error(payload.error || "Failed to load inbox.");
            }
            setData(payload);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load inbox.",
            );
        } finally {
            setLoading(false);
        }
    }, [appliedSearch, page, status]);

    useEffect(() => {
        void load();
    }, [load]);

    async function updateStatus(id: string, nextStatus: ContactStatus) {
        setMutating(true);
        setError(undefined);
        try {
            const response = await fetch(
                `/api/admin/contact-submissions/${id}`,
                {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ status: nextStatus }),
                },
            );
            const payload = (await response.json()) as ContactSubmission & {
                error?: string;
            };
            if (!response.ok) {
                throw new Error(
                    payload.error || "Unable to update submission.",
                );
            }
            setSelected(payload);
            await load();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update submission.",
            );
        } finally {
            setMutating(false);
        }
    }

    async function openSubmission(submission: ContactSubmission) {
        setSelected(submission);
        if (submission.status === "new") {
            await updateStatus(submission.id, "read");
        }
    }

    async function removeSubmission(id: string) {
        if (!window.confirm("Permanently delete this message?")) return;
        setMutating(true);
        try {
            const response = await fetch(
                `/api/admin/contact-submissions/${id}`,
                {
                    method: "DELETE",
                },
            );
            if (!response.ok) {
                const payload = (await response.json()) as { error?: string };
                throw new Error(
                    payload.error || "Unable to delete submission.",
                );
            }
            setSelected(undefined);
            await load();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete submission.",
            );
        } finally {
            setMutating(false);
        }
    }

    function applySearch() {
        setPage(1);
        setAppliedSearch(search.trim());
    }

    return (
        <>
            <AdminPageHeader
                title="Contact Inbox"
                description="Review and manage messages submitted from the public contact page."
            />

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric
                    label="All messages"
                    value={data.total}
                    icon={<Inbox />}
                />
                <Metric label="Unread" value={data.unread} icon={<Mail />} />
                <Metric
                    label="Current page"
                    value={`${data.page}/${data.totalPages}`}
                    icon={<MailOpen />}
                    className="col-span-2 sm:col-span-1"
                />
            </div>

            <div className="mb-5 flex flex-col gap-3 border-y border-[var(--border-subtle)] py-4 lg:flex-row lg:items-center">
                <form
                    className="flex min-w-0 flex-1 gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        applySearch();
                    }}
                >
                    <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-quaternary)]" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search sender, email, subject, or message"
                            aria-label="Search inbox"
                            className="h-10 w-full rounded-md border border-[var(--border-default)] bg-[var(--canvas-elevated)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-solid)]"
                        />
                    </div>
                    <button
                        type="submit"
                        className="h-10 rounded-md border border-[var(--border-default)] px-4 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                    >
                        Search
                    </button>
                </form>
                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                    {STATUS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                setStatus(option.value);
                                setPage(1);
                            }}
                            className={`h-9 shrink-0 rounded-md px-3 text-sm font-medium transition-colors ${
                                status === option.value
                                    ? "bg-[var(--accent-solid)] text-white"
                                    : "border border-[var(--border-default)] text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => void load()}
                        title="Refresh inbox"
                        aria-label="Refresh inbox"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border-default)] text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {error ? (
                <div className="mb-4 rounded-md border border-[var(--error)]/30 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : data.rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center border-y border-[var(--border-subtle)] py-20 text-center">
                    <Inbox className="mb-3 h-10 w-10 text-[var(--text-quaternary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                        No matching messages
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                        New public contact submissions will appear here.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
                    {data.rows.map((submission) => (
                        <button
                            key={submission.id}
                            type="button"
                            onClick={() => void openSubmission(submission)}
                            className={`grid w-full gap-2 px-3 py-4 text-left transition-colors hover:bg-[var(--overlay-hover)] sm:grid-cols-[minmax(10rem,0.8fr)_minmax(12rem,1fr)_auto] sm:items-center sm:px-4 ${
                                submission.status === "new"
                                    ? "bg-[var(--accent-solid)]/[0.035]"
                                    : ""
                            }`}
                        >
                            <div className="min-w-0">
                                <p
                                    className={`truncate text-sm text-[var(--text-primary)] ${
                                        submission.status === "new"
                                            ? "font-semibold"
                                            : "font-medium"
                                    }`}
                                >
                                    {submission.name}
                                </p>
                                <p className="truncate text-xs text-[var(--text-tertiary)]">
                                    {submission.email}
                                </p>
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm text-[var(--text-secondary)]">
                                    {submission.subject || "No subject"}
                                </p>
                                <p className="truncate text-xs text-[var(--text-quaternary)]">
                                    {submission.message}
                                </p>
                            </div>
                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <StatusBadge status={submission.status} />
                                <time className="whitespace-nowrap text-xs text-[var(--text-quaternary)]">
                                    {new Date(
                                        submission.createdAt,
                                    ).toLocaleDateString()}
                                </time>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-5 flex items-center justify-between text-sm text-[var(--text-tertiary)]">
                <span>{data.total} messages</span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        title="Previous page"
                        aria-label="Previous page"
                        disabled={data.page <= 1 || loading}
                        onClick={() =>
                            setPage((current) => Math.max(1, current - 1))
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-default)] disabled:opacity-40"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-16 text-center">
                        {data.page} of {data.totalPages}
                    </span>
                    <button
                        type="button"
                        title="Next page"
                        aria-label="Next page"
                        disabled={data.page >= data.totalPages || loading}
                        onClick={() =>
                            setPage((current) =>
                                Math.min(data.totalPages, current + 1),
                            )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-default)] disabled:opacity-40"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {selected ? (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <button
                        type="button"
                        aria-label="Close message"
                        className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
                        onClick={() => setSelected(undefined)}
                    />
                    <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-[var(--border-default)] bg-[var(--canvas-elevated)] shadow-2xl">
                        <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
                            <div className="min-w-0">
                                <p className="text-xs uppercase text-[var(--text-quaternary)]">
                                    Message from
                                </p>
                                <h2 className="truncate text-base font-semibold text-[var(--text-primary)]">
                                    {selected.name}
                                </h2>
                            </div>
                            <button
                                type="button"
                                title="Close"
                                aria-label="Close"
                                onClick={() => setSelected(undefined)}
                                className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge status={selected.status} />
                                <time className="text-xs text-[var(--text-quaternary)]">
                                    {new Date(
                                        selected.createdAt,
                                    ).toLocaleString()}
                                </time>
                            </div>
                            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs uppercase text-[var(--text-quaternary)]">
                                        Email
                                    </dt>
                                    <dd className="mt-1 break-all">
                                        <a
                                            className="text-[var(--accent-solid)] hover:underline"
                                            href={`mailto:${selected.email}`}
                                        >
                                            {selected.email}
                                        </a>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-[var(--text-quaternary)]">
                                        Source
                                    </dt>
                                    <dd className="mt-1 text-[var(--text-secondary)]">
                                        {selected.source}
                                    </dd>
                                </div>
                            </dl>
                            <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
                                <p className="text-xs uppercase text-[var(--text-quaternary)]">
                                    Subject
                                </p>
                                <p className="mt-2 font-medium text-[var(--text-primary)]">
                                    {selected.subject || "No subject"}
                                </p>
                                <p className="mt-6 text-xs uppercase text-[var(--text-quaternary)]">
                                    Message
                                </p>
                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-secondary)]">
                                    {selected.message}
                                </p>
                            </div>
                        </div>

                        <footer className="border-t border-[var(--border-subtle)] p-4 sm:p-5">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <a
                                    href={`mailto:${selected.email}?subject=${encodeURIComponent(
                                        `Re: ${selected.subject || "Your message"}`,
                                    )}`}
                                    onClick={() =>
                                        void updateStatus(
                                            selected.id,
                                            "replied",
                                        )
                                    }
                                    className="flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent-solid)] px-3 text-sm font-medium text-white"
                                >
                                    <Mail className="h-4 w-4" /> Reply
                                </a>
                                <ActionButton
                                    icon={<Archive />}
                                    label="Archive"
                                    disabled={mutating}
                                    onClick={() =>
                                        void updateStatus(
                                            selected.id,
                                            "archived",
                                        )
                                    }
                                />
                                <ActionButton
                                    icon={<ShieldAlert />}
                                    label="Spam"
                                    disabled={mutating}
                                    onClick={() =>
                                        void updateStatus(selected.id, "spam")
                                    }
                                />
                                <ActionButton
                                    icon={<Trash2 />}
                                    label="Delete"
                                    danger
                                    disabled={mutating}
                                    onClick={() =>
                                        void removeSubmission(selected.id)
                                    }
                                />
                            </div>
                        </footer>
                    </aside>
                </div>
            ) : null}
        </>
    );
}

function Metric({
    label,
    value,
    icon,
    className = "",
}: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`flex min-w-0 items-center gap-3 border border-[var(--border-subtle)] bg-[var(--canvas-elevated)] px-4 py-3 ${className}`}
        >
            <span className="text-[var(--text-quaternary)] [&>svg]:h-4 [&>svg]:w-4">
                {icon}
            </span>
            <div className="min-w-0">
                <p className="truncate text-xs text-[var(--text-quaternary)]">
                    {label}
                </p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                    {value}
                </p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: ContactStatus }) {
    return (
        <span
            className={`inline-flex rounded border px-2 py-0.5 text-2xs font-medium uppercase ${STATUS_STYLES[status]}`}
        >
            {status}
        </span>
    );
}

function ActionButton({
    icon,
    label,
    onClick,
    disabled,
    danger = false,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled: boolean;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-40 [&>svg]:h-4 [&>svg]:w-4 ${
                danger
                    ? "border-[var(--error)]/30 text-[var(--error)] hover:bg-[var(--error)]/5"
                    : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
            }`}
        >
            {icon}
            {label}
        </button>
    );
}
