"use client";

/**
 * Backup page — export and restore the entire data store.
 *
 * Export downloads a JSON blob of all collections. Restore accepts a
 * JSON file upload and replaces all data. This is the danger zone —
 * restore is destructive and irreversible.
 */

import { useState } from "react";
import { Download, Loader2, Upload, AlertTriangle } from "lucide-react";

import { AdminPageHeader } from "@features/admin/components/AdminPageHeader";

export default function AdminBackupPage() {
    const [exporting, setExporting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleExport = async () => {
        setExporting(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/backup");
            if (!res.ok) {
                setError("Export failed.");
                return;
            }
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `kandarp-os-backup-${new Date().toISOString().split("T")[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setSuccess("Backup exported successfully.");
            setTimeout(() => setSuccess(null), 3000);
        } catch {
            setError("Network error.");
        } finally {
            setExporting(false);
        }
    };

    const handleRestore = async (file: File) => {
        if (
            !confirm(
                "Restore will REPLACE ALL DATA. This cannot be undone. Continue?",
            )
        )
            return;
        setRestoring(true);
        setError(null);
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const res = await fetch("/api/admin/backup", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                setError("Restore failed.");
                return;
            }
            setSuccess("Data restored successfully.");
            setTimeout(() => setSuccess(null), 3000);
        } catch {
            setError("Invalid backup file.");
        } finally {
            setRestoring(false);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="Backup & Restore"
                description="Export or restore your entire data store."
            />

            {error && (
                <div className="mb-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-lg border border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-sm text-[var(--success)]">
                    {success}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Export */}
                <div className="admin-glass rounded-xl p-6">
                    <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                        Export Backup
                    </h2>
                    <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                        Download a JSON file containing all collections
                        (projects, blog, users, settings, etc.).
                    </p>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 rounded-lg bg-[var(--accent-gradient)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        {exporting ? "Exporting…" : "Download Backup"}
                    </button>
                </div>

                {/* Restore */}
                <div className="admin-glass rounded-xl p-6">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
                        Restore (Danger Zone)
                    </h2>
                    <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                        Upload a backup file to replace ALL data. This is
                        destructive and irreversible.
                    </p>
                    <label
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--error)]/20 px-4 py-2.5 text-sm font-medium text-[var(--error)] transition-colors hover:bg-[var(--error)]/5 ${restoring ? "opacity-60" : ""}`}
                    >
                        {restoring ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        {restoring ? "Restoring…" : "Upload & Restore"}
                        <input
                            type="file"
                            accept="application/json"
                            className="hidden"
                            disabled={restoring}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleRestore(file);
                            }}
                        />
                    </label>
                </div>
            </div>
        </>
    );
}
