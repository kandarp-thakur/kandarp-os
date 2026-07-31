import { NextResponse } from "next/server";

import {
    audit,
    json,
    parseBody,
    requirePermission,
} from "@backend/middlewares/api";
import { createApiKeySchema } from "@backend/schemas/api-keys";
import { createApiKey, listApiKeys } from "@backend/services/api-keys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const session = await requirePermission("api-keys:read");
    if (session instanceof Response) return session;

    return json(await listApiKeys());
}

export async function POST(req: Request) {
    const session = await requirePermission("api-keys:write");
    if (session instanceof Response) return session;

    const body = await parseBody(req, createApiKeySchema);
    if (body instanceof Response) return body;

    const result = await createApiKey(body, session.sub);
    audit(
        session,
        "api-key.create",
        "api-key",
        result.apiKey.id,
        `Created ${result.apiKey.name} with scopes: ${result.apiKey.scopes.join(", ")}`,
    );

    return NextResponse.json(result, {
        status: 201,
        headers: {
            "cache-control": "no-store, max-age=0",
            pragma: "no-cache",
        },
    });
}
