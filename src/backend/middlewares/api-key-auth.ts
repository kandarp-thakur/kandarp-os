import type { NextResponse } from "next/server";

import { error } from "@backend/middlewares/api";
import type { ApiKeyScope } from "@backend/schemas/api-keys";
import {
    authenticateApiKey,
    type ApiKeyPrincipal,
} from "@backend/services/api-keys";

function bearerSecret(req: Request): string | null {
    const authorization = req.headers.get("authorization");
    if (!authorization) return null;

    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    return match?.[1] ?? null;
}

export async function requireApiKey(
    req: Request,
    requiredScope: ApiKeyScope,
): Promise<ApiKeyPrincipal | NextResponse> {
    const secret = bearerSecret(req);
    if (!secret) return error("Unauthorized", 401, 401);

    const principal = await authenticateApiKey(secret);
    if (!principal) return error("Unauthorized", 401, 401);
    if (!principal.scopes.includes(requiredScope)) {
        return error("Forbidden", 403, 403);
    }

    return principal;
}
