import { NextResponse } from "next/server";

import { audit, parseBody, requirePermission } from "@backend/middlewares/api";
import { replaceIntegrationsSchema } from "@backend/schemas/managed-secrets";
import {
    listIntegrations,
    replaceIntegrations,
} from "@backend/services/managed-secrets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE_HEADERS = {
    "cache-control": "no-store, max-age=0",
    pragma: "no-cache",
};

export async function GET() {
    const session = await requirePermission("integrations:read");
    if (session instanceof Response) return session;

    return NextResponse.json(await listIntegrations(), {
        headers: NO_STORE_HEADERS,
    });
}

export async function PUT(req: Request) {
    const session = await requirePermission("integrations:write");
    if (session instanceof Response) return session;

    const body = await parseBody(req, replaceIntegrationsSchema.strict());
    if (body instanceof Response) return body;

    const integrations = await replaceIntegrations(body.integrations);
    audit(
        session,
        "integrations.replace",
        "settings",
        undefined,
        `Updated ${integrations.length} integration records`,
    );
    return NextResponse.json(integrations, { headers: NO_STORE_HEADERS });
}
