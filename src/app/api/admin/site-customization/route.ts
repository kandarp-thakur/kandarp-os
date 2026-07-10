/**
 * Site Customization API — /api/admin/site-customization
 *
 * GET    — read the singleton site-customization (Website Builder) config.
 * PATCH  — update sections (visibility, order, styling, content, etc.).
 *
 * Like settings, this is a singleton: the collection holds exactly one row.
 */

import {
    audit,
    error,
    json,
    parseBody,
    requirePermission,
} from "@/lib/admin/api";
import { findById, list, replaceAll, update } from "@/lib/admin/repo";
import { revalidateCollection } from "@/lib/admin/revalidate";
import {
    siteCustomizationSchema,
    type SiteCustomization,
} from "@/lib/admin/types";
import { ensureSeeded } from "@/lib/admin/seed";

/** Resolve the singleton site-customization row. */
function getCustomization(): SiteCustomization | null {
    const rows = list<SiteCustomization>("siteCustomization");
    if (rows.length > 0) return rows[0] ?? null;
    return findById<SiteCustomization>("siteCustomization", "singleton");
}

export async function GET() {
    await ensureSeeded();
    const session = await requirePermission("settings:read");
    if (session instanceof Response) return session;
    const customization = getCustomization();
    if (!customization)
        return error("Site customization not initialized", 404, 404);
    return json(customization);
}

export async function PATCH(req: Request) {
    await ensureSeeded();
    const session = await requirePermission("settings:write");
    if (session instanceof Response) return session;
    const customization = getCustomization();
    if (!customization)
        return error("Site customization not initialized", 404, 404);

    const body = await parseBody(req, siteCustomizationSchema.partial());
    if (body instanceof Response) return body;

    const updated = await update<SiteCustomization>(
        "siteCustomization",
        customization.id,
        body as Partial<SiteCustomization>,
        session.sub,
    );
    audit(
        session,
        "site_customization.update",
        "siteCustomization",
        customization.id,
    );
    revalidateCollection("siteCustomization");
    return json(updated);
}

/** Reorder sections via drag & drop: POST with `{ ids: [] }`. */
export async function POST(req: Request) {
    await ensureSeeded();
    const session = await requirePermission("settings:write");
    if (session instanceof Response) return session;
    const customization = getCustomization();
    if (!customization)
        return error("Site customization not initialized", 404, 404);

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.sections)) {
        return error("Expected { sections: [...] }", 400);
    }

    const updated: SiteCustomization = {
        ...customization,
        sections: body.sections,
        updatedAt: new Date().toISOString(),
    };
    await replaceAll("siteCustomization", [updated]);
    audit(
        session,
        "site_customization.reorder",
        "siteCustomization",
        customization.id,
    );
    revalidateCollection("siteCustomization");
    return json(updated);
}
