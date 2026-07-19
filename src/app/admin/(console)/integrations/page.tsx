"use client";

/**
 * Integrations page — manage third-party integrations.
 *
 * The integrations live on the Settings singleton
 * (`settings.integrations`): an array of { id, name, enabled, config }.
 * This page lets the admin toggle integrations on/off and edit their
 * config (a free-form key/value map), then PATCHes the array back via
 * /api/admin/settings.
 */

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plug, Save, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";
import type { Integration, Settings } from "@backend/schemas/types";

function uid(): string {
    return `int_${Math.random().toString(36).slice(2, 10)}`;
}

export default function AdminIntegrationsPage() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((s: Settings) => setIntegrations(s.integrations ?? []))
            .catch(() => setError("Failed to load integrations."))
            .finally(() => setLoading(false));
    }, []);

    const update = (id: string, patch: Partial<Integration>) =>
        setIntegrations((prev) =>
            prev.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        );

    const remove = (id: string) =>
        setIntegrations((prev) => prev.filter((i) => i.id !== id));

    const add = () =>
        setIntegrations((prev) => [
            ...prev,
            {
                id: uid(),
                name: "New Integration",
                enabled: false,
                config: {},
            },
        ]);

    const setConfigKey = (id: string, key: string, value: string) =>
        setIntegrations((prev) =>
            prev.map((i) =>
                i.id === id
                    ? { ...i, config: { ...i.config, [key]: value } }
                    : i,
            ),
        );

    const addConfigKey = (id: string) =>
        setIntegrations((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, config: { ...i.config, "": "" } } : i,
            ),
        );

    const removeConfigKey = (id: string, key: string) =>
        setIntegrations((prev) =>
            prev.map((i) => {
                if (i.id !== id) return i;
                const next = { ...i.config };
                delete next[key];
                return { ...i, config: next };
            }),
        );

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ integrations }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Failed to save integrations.");
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
                title="Integrations"
                description="Connect third-party services and manage their configuration."
                actions={
                    <button
                        onClick={add}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                    >
                        <Plug className="h-4 w-4" />
                        Add Integration
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
                    Integrations saved successfully.
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {integrations.length === 0 && (
                        <div className="admin-glass rounded-xl p-8 text-center text-sm text-[var(--text-tertiary)]">
                            No integrations configured. Click “Add Integration”
                            to connect a service.
                        </div>
                    )}
                    {integrations.map((int) => (
                        <div
                            key={int.id}
                            className="admin-glass rounded-xl p-5"
                        >
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-solid)]">
                                    <Plug className="h-4 w-4" />
                                </div>
                                <input
                                    value={int.name}
                                    onChange={(e) =>
                                        update(int.id, { name: e.target.value })
                                    }
                                    placeholder="Integration name"
                                    className={`${inputClass} max-w-[240px] font-medium`}
                                />
                                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <input
                                        type="checkbox"
                                        checked={int.enabled}
                                        onChange={(e) =>
                                            update(int.id, {
                                                enabled: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 rounded border-[var(--border-default)]"
                                    />
                                    Enabled
                                </label>
                                <span
                                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                                        int.enabled
                                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                                            : "bg-[var(--canvas-sunken)] text-[var(--text-tertiary)]"
                                    }`}
                                >
                                    {int.enabled ? "Active" : "Disabled"}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => remove(int.id)}
                                    className="ml-auto rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-quaternary)]">
                                    Configuration
                                </p>
                                <div className="space-y-2">
                                    {Object.entries(int.config).map(
                                        ([key, value], idx) => (
                                            <div
                                                key={`${int.id}-${idx}-${key}`}
                                                className="flex items-center gap-2"
                                            >
                                                <input
                                                    value={key}
                                                    onChange={(e) => {
                                                        const oldVal =
                                                            int.config[key];
                                                        removeConfigKey(
                                                            int.id,
                                                            key,
                                                        );
                                                        setConfigKey(
                                                            int.id,
                                                            e.target.value,
                                                            String(oldVal),
                                                        );
                                                    }}
                                                    placeholder="key"
                                                    className={`${inputClass} max-w-[180px] font-mono text-xs`}
                                                />
                                                <span className="text-[var(--text-quaternary)]">
                                                    :
                                                </span>
                                                <input
                                                    value={String(value ?? "")}
                                                    onChange={(e) =>
                                                        setConfigKey(
                                                            int.id,
                                                            key,
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="value"
                                                    className={`${inputClass} flex-1 font-mono text-xs`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeConfigKey(
                                                            int.id,
                                                            key,
                                                        )
                                                    }
                                                    className="rounded-md p-1 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ),
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => addConfigKey(int.id)}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border-default)] py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                                    >
                                        + Add Config Field
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end">
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
                            Save Integrations
                        </button>
                    </div>
                </form>
            )}
        </>
    );
}
