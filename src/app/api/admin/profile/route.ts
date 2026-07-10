/**
 * GET /api/admin/profile — read the singleton profile object.
 * PATCH /api/admin/profile — update the profile (settings:write).
 *
 * Profile is a singleton: the collection always holds exactly one row. On
 * first boot the seeder creates it; these routes read/update that row.
 *
 * The profile image is stored as a Media Library id (`profileImageId`), never
 * as a raw URL. The public site resolves the id → MediaAsset at render time.
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
import { profileSchema, type Profile } from "@/lib/admin/types";

/** Resolve the singleton profile row (the first row in the collection). */
function getProfile(): Profile | null {
    const rows = list<Profile>("profiles");
    if (rows.length > 0) return rows[0] ?? null;
    // Fallback: look up by the well-known id "singleton".
    return findById<Profile>("profiles", "singleton");
}

export async function GET() {
    const session = await requirePermission("settings:read");
    if (session instanceof Response) return session;
    const profile = getProfile();
    if (!profile) return error("Profile not initialized", 404, 404);
    return json(profile);
}

export async function PATCH(req: Request) {
    const session = await requirePermission("settings:write");
    if (session instanceof Response) return session;
    const profile = getProfile();
    if (!profile) return error("Profile not initialized", 404, 404);

    const body = await parseBody(req, profileSchema.partial());
    if (body instanceof Response) return body;

    const updated = await update<Profile>(
        "profiles",
        profile.id,
        body as Partial<Profile>,
        session.sub,
    );
    if (!updated) return error("Profile not initialized", 404, 404);
    audit(session, "profile.update", "profiles", profile.id);
    revalidateCollection("profiles");
    return json(updated);
}
