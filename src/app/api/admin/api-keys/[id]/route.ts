import {
    audit,
    error,
    json,
    parseBody,
    requirePermission,
} from "@backend/middlewares/api";
import { updateApiKeySchema } from "@backend/schemas/api-keys";
import { revokeApiKey, updateApiKey } from "@backend/services/api-keys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
    const session = await requirePermission("api-keys:write");
    if (session instanceof Response) return session;

    const body = await parseBody(req, updateApiKeySchema);
    if (body instanceof Response) return body;

    const { id } = await context.params;
    const apiKey = await updateApiKey(id, body);
    if (!apiKey) return error("API key not found or revoked", 404);

    const changedFields = Object.keys(body).sort().join(", ");
    audit(
        session,
        "api-key.update",
        "api-key",
        id,
        `Updated fields: ${changedFields}`,
    );
    return json(apiKey);
}

export async function DELETE(_req: Request, context: RouteContext) {
    const session = await requirePermission("api-keys:write");
    if (session instanceof Response) return session;

    const { id } = await context.params;
    const apiKey = await revokeApiKey(id);
    if (!apiKey) return error("API key not found or already revoked", 404);

    audit(session, "api-key.revoke", "api-key", id, `Revoked ${apiKey.name}`);
    return json(apiKey);
}
