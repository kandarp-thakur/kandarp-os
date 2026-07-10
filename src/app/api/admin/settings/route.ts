/**
 * GET /api/admin/settings — read the singleton settings object.
 * PATCH /api/admin/settings — update the settings (settings:write).
 *
 * Settings is a singleton: the collection always holds exactly one row.
 * On first boot the seeder creates it; these routes read/update that row.
 */

import {
    audit,
    error,
    json,
    parseBody,
    requirePermission,
} from "@/lib/admin/api";
import { findById, list, update } from "@/lib/admin/repo";
import { revalidateCollection } from "@/lib/admin/revalidate";
import { settingsSchema, type Settings } from "@/lib/admin/types";

/** Resolve the singleton settings row (the first row in the collection). */
function getSettings(): Settings | null {
    const rows = list<Settings>("settings");
    if (rows.length > 0) return rows[0] ?? null;
    // Fallback: look up by the well-known id "singleton".
    return findById<Settings>("settings", "singleton");
}

export async function GET() {
    const session = await requirePermission("settings:read");
    if (session instanceof Response) return session;
    const settings = getSettings();
    if (!settings) return error("Settings not initialized", 404, 404);
    return json(settings);
}

export async function PATCH(req: Request) {
    const session = await requirePermission("settings:write");
    if (session instanceof Response) return session;
    const settings = getSettings();
    if (!settings) return error("Settings not initialized", 404, 404);

    const body = await parseBody(req, settingsSchema.partial());
    if (body instanceof Response) return body;

    const updated = await update<Settings>(
        "settings",
        settings.id,
        body as Partial<Settings>,
        session.sub,
    );
    audit(session, "settings.update", "settings", settings.id);
    revalidateCollection("settings");
    return json(updated);
}
