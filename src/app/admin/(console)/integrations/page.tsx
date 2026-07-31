"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, LockKeyhole, Plug, Save, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";

interface ConfigField {
    draftId: string;
    key: string;
    configured: boolean;
    value: string;
    dirty: boolean;
}

interface IntegrationDraft {
    id: string;
    name: string;
    enabled: boolean;
    config: ConfigField[];
}

interface IntegrationResponse {
    id: string;
    name: string;
    enabled: boolean;
    config: Array<{ key: string; configured: boolean }>;
}

function uid(prefix: "int" | "field"): string {
    return `${prefix}_${crypto.randomUUID()}`;
}

function toDraft(rows: IntegrationResponse[]): IntegrationDraft[] {
    return rows.map((row) => ({
        ...row,
        config: row.config.map((field) => ({
            ...field,
            draftId: uid("field"),
            value: "",
            dirty: false,
        })),
    }));
}

async function responseError(res: Response, fallback: string): Promise<string> {
    const body = (await res.json().catch(() => null)) as {
        error?: string;
    } | null;
    return body?.error ?? fallback;
}

export default function AdminIntegrationsPage() {
    const [integrations, setIntegrations] = useState<IntegrationDraft[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/integrations", {
                cache: "no-store",
            });
            if (!res.ok) {
                throw new Error(
                    await responseError(res, "Failed to load integrations."),
                );
            }
            setIntegrations(
                toDraft((await res.json()) as IntegrationResponse[]),
            );
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Failed to load integrations.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    function updateIntegration(
        id: string,
        patch: Partial<Pick<IntegrationDraft, "name" | "enabled">>,
    ): void {
        setIntegrations((current) =>
            current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        );
    }

    function addIntegration(): void {
        setIntegrations((current) => [
            ...current,
            {
                id: uid("int"),
                name: "New Integration",
                enabled: false,
                config: [],
            },
        ]);
    }

    function removeIntegration(id: string): void {
        setIntegrations((current) => current.filter((row) => row.id !== id));
    }

    function addField(id: string): void {
        setIntegrations((current) =>
            current.map((row) =>
                row.id === id
                    ? {
                          ...row,
                          config: [
                              ...row.config,
                              {
                                  draftId: uid("field"),
                                  key: "",
                                  configured: false,
                                  value: "",
                                  dirty: true,
                              },
                          ],
                      }
                    : row,
            ),
        );
    }

    function updateField(
        id: string,
        index: number,
        patch: Partial<ConfigField>,
    ): void {
        setIntegrations((current) =>
            current.map((row) =>
                row.id === id
                    ? {
                          ...row,
                          config: row.config.map((field, fieldIndex) =>
                              fieldIndex === index
                                  ? { ...field, ...patch }
                                  : field,
                          ),
                      }
                    : row,
            ),
        );
    }

    function removeField(id: string, index: number): void {
        setIntegrations((current) =>
            current.map((row) =>
                row.id === id
                    ? {
                          ...row,
                          config: row.config.filter(
                              (_, fieldIndex) => fieldIndex !== index,
                          ),
                      }
                    : row,
            ),
        );
    }

    async function handleSubmit(event: FormEvent): Promise<void> {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const payload = {
                integrations: integrations.map((row) => ({
                    id: row.id,
                    name: row.name,
                    enabled: row.enabled,
                    config: row.config.map((field) => ({
                        key: field.key,
                        ...(field.dirty ? { value: field.value } : {}),
                    })),
                })),
            };
            const res = await fetch("/api/admin/integrations", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                throw new Error(
                    await responseError(res, "Failed to save integrations."),
                );
            }
            setIntegrations(
                toDraft((await res.json()) as IntegrationResponse[]),
            );
            setSuccess(true);
            window.setTimeout(() => setSuccess(false), 3000);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Failed to save integrations.",
            );
        } finally {
            setSaving(false);
        }
    }

    const inputClass =
        "w-full rounded-lg border border-[var(--border-default)] bg-[var(--canvas-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]";

    return (
        <>
            <AdminPageHeader
                title="Integrations"
                description="Manage encrypted third-party credentials. Stored values are never returned by the server."
                actions={
                    <button
                        type="button"
                        onClick={addIntegration}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-hover)]"
                    >
                        <Plug className="h-4 w-4" />
                        Add Integration
                    </button>
                }
            />

            <div className="mb-4 flex gap-3 rounded-lg border border-[var(--accent-solid)]/20 bg-[var(--accent-subtle)]/40 px-4 py-3 text-sm text-[var(--text-secondary)]">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-solid)]" />
                <p>
                    Existing secrets show only their configured state. Leave a
                    secret input empty to keep its current value; typing
                    replaces it. Removing a field or integration deletes its
                    encrypted value permanently.
                </p>
            </div>

            {error ? (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            ) : null}
            {success ? (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    Integrations saved securely.
                </div>
            ) : null}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {integrations.length === 0 ? (
                        <div className="admin-glass rounded-xl p-8 text-center text-sm text-[var(--text-tertiary)]">
                            No integrations configured.
                        </div>
                    ) : null}

                    {integrations.map((integration) => (
                        <section
                            key={integration.id}
                            className="admin-glass rounded-xl p-5"
                        >
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-solid)]">
                                    <Plug className="h-4 w-4" />
                                </div>
                                <input
                                    required
                                    value={integration.name}
                                    onChange={(event) =>
                                        updateIntegration(integration.id, {
                                            name: event.target.value,
                                        })
                                    }
                                    placeholder="Integration name"
                                    className={`${inputClass} max-w-[240px] font-medium`}
                                />
                                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <input
                                        type="checkbox"
                                        checked={integration.enabled}
                                        onChange={(event) =>
                                            updateIntegration(integration.id, {
                                                enabled: event.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 rounded border-[var(--border-default)]"
                                    />
                                    Enabled
                                </label>
                                <button
                                    type="button"
                                    aria-label={`Remove ${integration.name}`}
                                    onClick={() =>
                                        removeIntegration(integration.id)
                                    }
                                    className="ml-auto rounded-md p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-quaternary)]">
                                Encrypted configuration
                            </p>
                            <div className="space-y-2">
                                {integration.config.map((field, index) => (
                                    <div
                                        key={field.draftId}
                                        className="grid gap-2 sm:grid-cols-[180px_1fr_auto]"
                                    >
                                        <input
                                            required
                                            value={field.key}
                                            readOnly={field.configured}
                                            onChange={(event) =>
                                                updateField(
                                                    integration.id,
                                                    index,
                                                    {
                                                        key: event.target.value,
                                                    },
                                                )
                                            }
                                            placeholder="SECRET_NAME"
                                            className={`${inputClass} font-mono text-xs read-only:opacity-70`}
                                        />
                                        <input
                                            type="password"
                                            autoComplete="new-password"
                                            value={field.value}
                                            onChange={(event) =>
                                                updateField(
                                                    integration.id,
                                                    index,
                                                    {
                                                        value: event.target
                                                            .value,
                                                        dirty: true,
                                                    },
                                                )
                                            }
                                            placeholder={
                                                field.configured
                                                    ? "Configured — enter replacement"
                                                    : "Enter secret value"
                                            }
                                            className={`${inputClass} font-mono text-xs`}
                                        />
                                        <button
                                            type="button"
                                            aria-label={`Remove ${field.key || "field"}`}
                                            onClick={() =>
                                                removeField(
                                                    integration.id,
                                                    index,
                                                )
                                            }
                                            className="rounded-md p-2 text-[var(--text-tertiary)] hover:bg-[var(--error)]/5 hover:text-[var(--error)]"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addField(integration.id)}
                                    className="flex w-full items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--overlay-hover)]"
                                >
                                    + Add Secret Field
                                </button>
                            </div>
                        </section>
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
