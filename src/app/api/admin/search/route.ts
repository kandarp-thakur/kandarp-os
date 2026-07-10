/**
 * GET /api/admin/search?q=<term>&limit=<n>
 *
 * Global search across all content collections. Returns grouped results
 * (projects, blog, experience, …) so the command palette and the search
 * page can render a unified list. Searches title/name/role/description
 * fields — a lightweight substring match, not a full-text engine.
 */

import { json, requirePermission } from "@/lib/admin/api";
import { list } from "@/lib/admin/repo";
import type { CollectionName } from "@/lib/admin/types";

interface SearchHit {
    id: string;
    title: string;
    subtitle?: string;
    type: string;
    href: string;
}

/** Test whether any of a row's string fields contains the needle. */
function matches(row: Record<string, unknown>, needle: string): boolean {
    const n = needle.toLowerCase();
    return Object.values(row).some((v) => {
        if (typeof v === "string") return v.toLowerCase().includes(n);
        if (Array.isArray(v))
            return v.some(
                (x) => typeof x === "string" && x.toLowerCase().includes(n),
            );
        return false;
    });
}

/** Map a row to a search hit with a display title + deep link. */
function toHit(
    row: Record<string, unknown>,
    type: string,
    titleField: string,
    subtitleField?: string,
): SearchHit | null {
    const title = row[titleField];
    if (typeof title !== "string") return null;
    const slug =
        typeof row.slug === "string"
            ? row.slug
            : (row.id as string | undefined);
    return {
        id: typeof row.id === "string" ? row.id : "",
        title,
        subtitle: subtitleField
            ? typeof row[subtitleField] === "string"
                ? (row[subtitleField] as string)
                : undefined
            : undefined,
        type,
        href: `/admin/${type}/${slug ?? ""}`,
    };
}

/** Scan a collection and collect matching hits. */
function scan(
    collection: CollectionName,
    type: string,
    titleField: string,
    subtitleField: string | undefined,
    needle: string,
): SearchHit[] {
    const rows = list<
        Record<string, unknown> & {
            id: string;
            createdAt: string;
            updatedAt: string;
        }
    >(collection);
    const out: SearchHit[] = [];
    for (const row of rows) {
        if (matches(row, needle)) {
            const hit = toHit(row, type, titleField, subtitleField);
            if (hit) out.push(hit);
        }
    }
    return out;
}

export async function GET(req: Request) {
    const session = await requirePermission("content:read");
    if (session instanceof Response) return session;

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limit = Math.min(
        parseInt(url.searchParams.get("limit") ?? "20", 10) || 20,
        50,
    );

    if (!q) return json({ results: [] as SearchHit[], total: 0 });

    const hits: SearchHit[] = [
        ...scan("projects", "projects", "title", "category", q),
        ...scan("blogPosts", "blog", "title", "category", q),
        ...scan("experience", "experience", "role", "company", q),
        ...scan("skills", "skills", "name", "domain", q),
        ...scan("infraNodes", "infrastructure", "name", "role", q),
        ...scan("awards", "awards", "title", "tier", q),
        ...scan("education", "education", "institution", "degree", q),
        ...scan("certificates", "certificates", "title", "issuer", q),
        ...scan("services", "services", "title", undefined, q),
    ];

    return json({
        results: hits.slice(0, limit),
        total: hits.length,
    });
}
