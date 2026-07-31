"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
    Check,
    Copy,
    KeyRound,
    Loader2,
    Plus,
    ShieldAlert,
    Trash2,
    X,
} from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";

const AVAILABLE_SCOPES = ["content:read", "analytics:read"] as const;
type ApiKeyScope = (typeof AVAILABLE_SCOPES)[number];

interface ApiKeyMetadata {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    enabled: boolean;
    expiresAt: string | null;
    lastUsedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: { id: string; name: string; email: string };
}

interface CreateResponse {
    apiKey: ApiKeyMetadata;
    secret: string;
}

interface ApiError {
    error?: string;
}

async function responseError(res: Response, fallback: string): Promise<string> {
    const body = (await res.json().catch(() => ({}))) as ApiError;
    return body.error ?? fallback;
}

function formatDate(value: string | null): string {
    if (!value) return "Never";
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default function AdminApiKeysPage() {
    const [keys, setKeys] = useState<ApiKeyMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState("");
    const [scopes, setScopes] = useState<ApiKeyScope[]>(["content:read"]);
    const [expiresAt, setExpiresAt] = useState("");
    const [creating, setCreating] = useState(false);
    const [createdSecret, setCreatedSecret] = useState<string | null>(null);
    const [secretAcknowledged, setSecretAcknowledged] = useState(false);
    const [copied, setCopied] = useState(false);

    const load = useCallback(async () => {
        setError(null);
        try {
            const res = await fetch("/api/admin/api-keys", {
                cache: "no-store",
            });
            if (!res.ok) {
                throw new Error(
                    await responseError(res, "Failed to load API keys."),
                );
            }
            setKeys((await res.json()) as ApiKeyMetadata[]);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load API keys.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    function toggleScope(scope: ApiKeyScope): void {
        setScopes((current) =>
            current.includes(scope)
                ? current.filter((candidate) => candidate !== scope)
                : [...current, scope],
        );
    }

    function resetCreateForm(): void {
        setName("");
        setScopes(["content:read"]);
        setExpiresAt("");
        setShowCreate(false);
    }

    async function createKey(event: FormEvent): Promise<void> {
        event.preventDefault();
        if (scopes.length === 0) {
            setError("Select at least one scope.");
            return;
        }

        setCreating(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/api-keys", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name,
                    scopes,
                    expiresAt: expiresAt
                        ? new Date(expiresAt).toISOString()
                        : null,
                }),
            });
            if (!res.ok) {
                throw new Error(
                    await responseError(res, "Failed to create API key."),
                );
            }

            const result = (await res.json()) as CreateResponse;
            setKeys((current) => [result.apiKey, ...current]);
            setCreatedSecret(result.secret);
            setSecretAcknowledged(false);
            setCopied(false);
            resetCreateForm();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create API key.",
            );
        } finally {
            setCreating(false);
        }
    }

    async function setEnabled(
        key: ApiKeyMetadata,
        enabled: boolean,
    ): Promise<void> {
        setBusyId(key.id);
        setError(null);
        try {
            const res = await fetch(`/api/admin/api-keys/${key.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ enabled }),
            });
            if (!res.ok) {
                throw new Error(
                    await responseError(res, "Failed to update API key."),
                );
            }
            const updated = (await res.json()) as ApiKeyMetadata;
            setKeys((current) =>
                current.map((candidate) =>
                    candidate.id === updated.id ? updated : candidate,
                ),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update API key.",
            );
        } finally {
            setBusyId(null);
        }
    }

    async function revoke(key: ApiKeyMetadata): Promise<void> {
        if (
            !confirm(`Permanently revoke “${key.name}”? This cannot be undone.`)
        ) {
            return;
        }

        setBusyId(key.id);
        setError(null);
        try {
            const res = await fetch(`/api/admin/api-keys/${key.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                throw new Error(
                    await responseError(res, "Failed to revoke API key."),
                );
            }
            const updated = (await res.json()) as ApiKeyMetadata;
            setKeys((current) =>
                current.map((candidate) =>
                    candidate.id === updated.id ? updated : candidate,
                ),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to revoke API key.",
            );
        } finally {
            setBusyId(null);
        }
    }

    async function copySecret(): Promise<void> {
        if (!createdSecret) return;
        try {
            await navigator.clipboard.writeText(createdSecret);
            setCopied(true);
        } catch {
            setError(
                "Clipboard access is unavailable. Select and copy the key manually.",
            );
        }
    }

    function dismissSecret(): void {
        if (!secretAcknowledged) return;
        setCreatedSecret(null);
        setCopied(false);
    }

    const inputClass =
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";

    return (
        <>
            <AdminPageHeader
                title="API Keys"
                description="Manage scoped credentials for versioned API access. Secrets are shown once and never stored in recoverable form."
                actions={
                    <button
                        type="button"
                        onClick={() => setShowCreate((open) => !open)}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                    >
                        {showCreate ? (
                            <X className="h-4 w-4" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        {showCreate ? "Cancel" : "Create Key"}
                    </button>
                }
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}

            {showCreate && (
                <form
                    onSubmit={createKey}
                    className="admin-glass mb-5 rounded-xl p-5"
                >
                    <h2 className="font-semibold text-[var(--text-primary)]">
                        Create a credential
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                        Grant only the scopes required by the consuming
                        application.
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="text-sm text-[var(--text-secondary)]">
                            Name
                            <input
                                required
                                minLength={2}
                                maxLength={80}
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="CI pipeline"
                                className={`${inputClass} mt-1.5`}
                            />
                        </label>
                        <label className="text-sm text-[var(--text-secondary)]">
                            Expiry (optional)
                            <input
                                type="datetime-local"
                                value={expiresAt}
                                min={new Date(Date.now() + 60_000)
                                    .toISOString()
                                    .slice(0, 16)}
                                onChange={(event) =>
                                    setExpiresAt(event.target.value)
                                }
                                className={`${inputClass} mt-1.5`}
                            />
                        </label>
                    </div>
                    <fieldset className="mt-4">
                        <legend className="text-sm text-[var(--text-secondary)]">
                            Scopes
                        </legend>
                        <div className="mt-2 flex flex-wrap gap-3">
                            {AVAILABLE_SCOPES.map((scope) => (
                                <label
                                    key={scope}
                                    className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-secondary)]"
                                >
                                    <input
                                        type="checkbox"
                                        checked={scopes.includes(scope)}
                                        onChange={() => toggleScope(scope)}
                                        className="h-4 w-4 rounded border-[var(--border-default)]"
                                    />
                                    <code>{scope}</code>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <div className="mt-5 flex justify-end">
                        <button
                            type="submit"
                            disabled={creating}
                            className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        >
                            {creating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <KeyRound className="h-4 w-4" />
                            )}
                            Generate secure key
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : keys.length === 0 ? (
                <div className="admin-glass flex flex-col items-center justify-center rounded-xl p-12 text-center">
                    <KeyRound className="mb-3 h-10 w-10 text-[var(--text-quaternary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                        No API keys yet
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                        Create a scoped key to access the versioned API.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {keys.map((key) => {
                        const revoked = Boolean(key.revokedAt);
                        const expired = Boolean(
                            key.expiresAt &&
                            new Date(key.expiresAt).getTime() <= Date.now(),
                        );
                        return (
                            <article
                                key={key.id}
                                className="admin-glass rounded-xl p-4 sm:p-5"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-solid)]">
                                            <KeyRound className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="truncate font-medium text-[var(--text-primary)]">
                                                    {key.name}
                                                </h2>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs ${revoked || expired || !key.enabled ? "bg-[var(--error)]/10 text-[var(--error)]" : "bg-[var(--success)]/10 text-[var(--success)]"}`}
                                                >
                                                    {revoked
                                                        ? "Revoked"
                                                        : expired
                                                          ? "Expired"
                                                          : key.enabled
                                                            ? "Active"
                                                            : "Disabled"}
                                                </span>
                                            </div>
                                            <code className="mt-1 block text-xs text-[var(--text-tertiary)]">
                                                {key.prefix}••••••••••••••••••••
                                            </code>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {key.scopes.map((scope) => (
                                                    <span
                                                        key={scope}
                                                        className="rounded bg-[var(--canvas-sunken)] px-2 py-1 font-mono text-xs text-[var(--text-secondary)]"
                                                    >
                                                        {scope}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-[var(--text-tertiary)] sm:grid-cols-3">
                                        <div>
                                            <dt>Created</dt>
                                            <dd className="mt-0.5 text-[var(--text-secondary)]">
                                                {formatDate(key.createdAt)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Last used</dt>
                                            <dd className="mt-0.5 text-[var(--text-secondary)]">
                                                {formatDate(key.lastUsedAt)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Expires</dt>
                                            <dd className="mt-0.5 text-[var(--text-secondary)]">
                                                {formatDate(key.expiresAt)}
                                            </dd>
                                        </div>
                                    </dl>
                                    {!revoked && (
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                                <input
                                                    type="checkbox"
                                                    checked={key.enabled}
                                                    disabled={
                                                        busyId === key.id ||
                                                        expired
                                                    }
                                                    onChange={(event) =>
                                                        void setEnabled(
                                                            key,
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-[var(--border-default)]"
                                                />
                                                Enabled
                                            </label>
                                            <button
                                                type="button"
                                                disabled={busyId === key.id}
                                                onClick={() => void revoke(key)}
                                                aria-label={`Revoke ${key.name}`}
                                                className="rounded-md p-2 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)] disabled:opacity-50"
                                            >
                                                {busyId === key.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {createdSecret && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="api-key-secret-title"
                >
                    <div className="w-full max-w-2xl rounded-xl border border-[var(--border-default)] bg-[var(--canvas-elevated)] p-5 shadow-2xl sm:p-6">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]" />
                            <div>
                                <h2
                                    id="api-key-secret-title"
                                    className="font-semibold text-[var(--text-primary)]"
                                >
                                    Copy this key now
                                </h2>
                                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                                    This secret is displayed once. It cannot be
                                    retrieved after this window is closed.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--canvas-sunken)] p-3">
                            <code className="min-w-0 flex-1 select-all break-all text-sm text-[var(--text-primary)]">
                                {createdSecret}
                            </code>
                            <button
                                type="button"
                                onClick={() => void copySecret()}
                                className="shrink-0 rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                                aria-label="Copy API key"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-[var(--success)]" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <label className="mt-4 flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                            <input
                                type="checkbox"
                                checked={secretAcknowledged}
                                onChange={(event) =>
                                    setSecretAcknowledged(event.target.checked)
                                }
                                className="mt-0.5 h-4 w-4 rounded border-[var(--border-default)]"
                            />
                            I have stored this secret securely and understand it
                            cannot be shown again.
                        </label>
                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                disabled={!secretAcknowledged}
                                onClick={dismissSecret}
                                className="rounded-lg bg-[var(--accent-gradient)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Close permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
