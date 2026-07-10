"use client";

/**
 * API Keys page — manage API keys for programmatic access.
 *
 * The keys live on the Settings singleton (`settings.apiKeys`): an array
 * of { id, name, key, enabled }. This page lets the admin create, toggle,
 * reveal, copy, and revoke keys, then PATCHes the array back via
 * /api/admin/settings. New keys are generated client-side with
 * crypto.randomUUID + a random secret.
 */

import { useEffect, useState, type FormEvent } from "react";
import {
    Check,
    Copy,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Plus,
    Save,
    Trash2,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Settings } from "@/lib/admin/types";

interface ApiKey {
    id: string;
    name: string;
    key: string;
    enabled: boolean;
}

function uid(): string {
    return `key_${Math.random().toString(36).slice(2, 10)}`;
}

function generateKey(): string {
    const rand =
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `kos_${rand.replace(/-/g, "")}`;
}

function maskKey(key: string): string {
    if (key.length <= 12) return "•".repeat(key.length);
    return `${key.slice(0, 8)}${"•".repeat(20)}${key.slice(-4)}`;
}

export default function AdminApiKeysPage() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [revealed, setRevealed] = useState<Set<string>>(new Set());
    const [copied, setCopied] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((s: Settings) => setKeys((s.apiKeys ?? []) as ApiKey[]))
            .catch(() => setError("Failed to load API keys."))
            .finally(() => setLoading(false));
    }, []);

    const update = (id: string, patch: Partial<ApiKey>) =>
        setKeys((prev) =>
            prev.map((k) => (k.id === id ? { ...k, ...patch } : k)),
        );

    const remove = (id: string) =>
        setKeys((prev) => prev.filter((k) => k.id !== id));

    const add = () =>
        setKeys((prev) => [
            ...prev,
            {
                id: uid(),
                name: "New API Key",
                key: generateKey(),
                enabled: true,
            },
        ]);

    const toggleReveal = (id: string) =>
        setRevealed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const copyKey = async (id: string, key: string) => {
        try {
            await navigator.clipboard.writeText(key);
            setCopied(id);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            // Clipboard may be unavailable.
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ apiKeys: keys }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to save API keys.");
            } else {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch {
            setError("Network error.");
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";

    return (
        <>
            <AdminPageHeader
                title="API Keys"
                description="Create and revoke API keys for programmatic access to the admin API."
                actions={
                    <button
                        onClick={add}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                    >
                        <Plus className="h-4 w-4" />
                        Generate Key
                    </button>
                }
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    API keys saved successfully.
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    {keys.length === 0 && (
                        <div className="admin-glass flex flex-col items-center justify-center rounded-xl p-12 text-center">
                            <KeyRound className="mb-3 h-10 w-10 text-[var(--text-quaternary)]" />
                            <p className="text-sm font-medium text-[var(--text-secondary)]">
                                No API keys yet
                            </p>
                            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                                Generate a key to enable programmatic access.
                            </p>
                        </div>
                    )}
                    {keys.map((k) => (
                        <div
                            key={k.id}
                            className="admin-glass rounded-xl p-4"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-solid)]">
                                    <KeyRound className="h-4 w-4" />
                                </div>
                                <input
                                    value={k.name}
                                    onChange={(e) =>
                                        update(k.id, { name: e.target.value })
                                    }
                                    placeholder="Key name (e.g. CI pipeline)"
                                    className={`${inputClass} max-w-[220px] font-medium`}
                                />
                                <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--canvas-sunken)] px-3 py-2">
                                    <code className="flex-1 truncate font-mono text-xs text-[var(--text-secondary)]">
                                        {revealed.has(k.id)
                                            ? k.key
                                            : maskKey(k.key)}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => toggleReveal(k.id)}
                                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                                    >
                                        {revealed.has(k.id) ? (
                                            <EyeOff className="h-3.5 w-3.5" />
                                        ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => copyKey(k.id, k.key)}
                                        className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                                    >
                                        {copied === k.id ? (
                                            <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <input
                                        type="checkbox"
                                        checked={k.enabled}
                                        onChange={(e) =>
                                            update(k.id, {
                                                enabled: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 rounded border-[var(--border-default)]"
                                    />
                                    Enabled
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (
                                            confirm(
                                                "Revoke this API key? This cannot be undone.",
                                            )
                                        )
                                            remove(k.id);
                                    }}
                                    className="rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {keys.length > 0 && (
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save API Keys
                            </button>
                        </div>
                    )}
                </form>
            )}
        </>
    );
}
