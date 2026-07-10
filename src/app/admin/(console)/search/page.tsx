"use client";

/**
 * Global search page — a full-page search experience complementing the ⌘K
 * command palette. Debounced query input, grouped results by entity type,
 * and deep links into each entity's editor.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
    Search,
    Loader2,
    FileText,
    FolderGit2,
    Briefcase,
    Cpu,
    Award,
    GraduationCap,
    ShieldCheck,
    Wrench,
    ArrowRight,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface SearchHit {
    id: string;
    title: string;
    subtitle?: string;
    type: string;
    href: string;
}

/** Icon + label per entity type for grouping. */
const TYPE_META: Record<string, { icon: typeof FileText; label: string }> = {
    projects: { icon: FolderGit2, label: "Projects" },
    blog: { icon: FileText, label: "Blog" },
    experience: { icon: Briefcase, label: "Experience" },
    skills: { icon: Cpu, label: "Skills" },
    infrastructure: { icon: Cpu, label: "Infrastructure" },
    awards: { icon: Award, label: "Awards" },
    education: { icon: GraduationCap, label: "Education" },
    certificates: { icon: ShieldCheck, label: "Certificates" },
    services: { icon: Wrench, label: "Services" },
};

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                </div>
            }
        >
            <SearchContent />
        </Suspense>
    );
}

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") ?? "";

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchHit[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Debounced search effect.
    useEffect(() => {
        const q = query.trim();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();

        if (!q) {
            setResults([]);
            setTotal(0);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            const controller = new AbortController();
            abortRef.current = controller;
            try {
                const res = await fetch(
                    `/api/admin/search?q=${encodeURIComponent(q)}&limit=50`,
                    { signal: controller.signal },
                );
                if (!res.ok) throw new Error("Search failed");
                const data = await res.json();
                setResults(data.results ?? []);
                setTotal(data.total ?? 0);
            } catch {
                // Ignore abort errors; show empty on real failures.
                if (controller.signal.reason !== "aborted") {
                    setResults([]);
                    setTotal(0);
                }
            } finally {
                setLoading(false);
                setHasSearched(true);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    // Group results by type for display.
    const grouped = useMemo(() => {
        const map = new Map<string, SearchHit[]>();
        for (const hit of results) {
            const arr = map.get(hit.type) ?? [];
            arr.push(hit);
            map.set(hit.type, arr);
        }
        return map;
    }, [results]);

    return (
        <div>
            <AdminPageHeader
                title="Search"
                description="Find any content across the console — projects, blog posts, experience, skills, and more."
            />

            {/* Search input */}
            <div className="relative mb-6">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    placeholder="Search all content…"
                    className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--canvas-elevated)] py-3.5 pl-12 pr-12 text-base text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-quaternary)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                />
                {loading && (
                    <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-[var(--text-tertiary)]" />
                )}
            </div>

            {/* Results */}
            {!query.trim() && !hasSearched && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Search className="mb-4 h-10 w-10 text-[var(--text-quaternary)]" />
                    <p className="text-sm text-[var(--text-tertiary)]">
                        Start typing to search across all content.
                    </p>
                </div>
            )}

            {hasSearched && !loading && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Search className="mb-4 h-10 w-10 text-[var(--text-quaternary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                        No results for &ldquo;{query}&rdquo;
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                        Try a different keyword or check your spelling.
                    </p>
                </div>
            )}

            {results.length > 0 && (
                <>
                    <p className="mb-4 text-sm text-[var(--text-tertiary)]">
                        {total} result{total !== 1 ? "s" : ""} for &ldquo;
                        {query}&rdquo;
                    </p>
                    <div className="space-y-6">
                        {Array.from(grouped.entries()).map(([type, hits]) => {
                            const meta = TYPE_META[type] ?? {
                                icon: FileText,
                                label: type,
                            };
                            const Icon = meta.icon;
                            return (
                                <div key={type}>
                                    <div className="mb-2 flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-[var(--text-tertiary)]" />
                                        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                                            {meta.label}
                                        </h2>
                                        <span className="text-xs text-[var(--text-quaternary)]">
                                            ({hits.length})
                                        </span>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--canvas-elevated)]">
                                        {hits.map((hit, i) => (
                                            <button
                                                key={hit.id}
                                                onClick={() =>
                                                    router.push(hit.href)
                                                }
                                                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--canvas-hover)] ${
                                                    i > 0
                                                        ? "border-t border-[var(--border-subtle)]"
                                                        : ""
                                                }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                                                        {hit.title}
                                                    </p>
                                                    {hit.subtitle && (
                                                        <p className="truncate text-xs text-[var(--text-tertiary)]">
                                                            {hit.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-quaternary)]" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
