import { NextResponse } from "next/server";

import { audit, parseBody, requirePermission } from "@backend/middlewares/api";
import { replaceEnvironmentVariablesSchema } from "@backend/schemas/managed-secrets";
import {
    listEnvironmentVariables,
    replaceEnvironmentVariables,
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

    return NextResponse.json(await listEnvironmentVariables(), {
        headers: NO_STORE_HEADERS,
    });
}

export async function PUT(req: Request) {
    const session = await requirePermission("integrations:write");
    if (session instanceof Response) return session;

    const body = await parseBody(
        req,
        replaceEnvironmentVariablesSchema.strict(),
    );
    if (body instanceof Response) return body;

    const environmentVariables = await replaceEnvironmentVariables(
        body.environmentVariables,
    );
    audit(
        session,
        "managed-environment.replace",
        "settings",
        undefined,
        `Updated ${environmentVariables.length} managed environment records`,
    );
    return NextResponse.json(environmentVariables, {
        headers: NO_STORE_HEADERS,
    });
}
