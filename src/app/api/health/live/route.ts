import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Process liveness probe.
 *
 * This intentionally does not touch external dependencies. A successful response
 * means the Next.js process can accept requests; dependency readiness is exposed
 * separately by `/api/health/ready`.
 */
export function GET(): NextResponse {
    return NextResponse.json(
        {
            status: "ok",
            service: "kandarp-os",
            timestamp: new Date().toISOString(),
        },
        {
            headers: {
                "cache-control": "no-store, max-age=0",
            },
        },
    );
}
