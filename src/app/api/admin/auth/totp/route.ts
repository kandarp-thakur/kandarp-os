import { error, json, requireAuth } from "@backend/middlewares/api";
import { findById, update } from "@backend/repositories/repo";
import type { User } from "@backend/schemas/types";
import {
    createTotpSecret,
    createTotpUri,
    verifyTotp,
} from "@backend/security/totp";
import { z } from "zod";

const codeSchema = z.object({ code: z.string().regex(/^\s*\d{6}\s*$/) });

export async function POST(_req: Request) {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    const user = await findById<User>("users", session.sub);
    if (!user) return error("User not found.", 404);
    if (user.totpEnabled || user.totpSecret) {
        return error("Two-factor authentication is already enrolled.", 409);
    }

    const secret = createTotpSecret();
    await update<User>("users", user.id, {
        totpSecret: secret,
        totpEnabled: false,
    });
    return json({ secret, uri: createTotpUri(secret, user.email) });
}

export async function PUT(req: Request) {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    const body = codeSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success)
        return error("A six-digit authenticator code is required.", 400);
    const user = await findById<User>("users", session.sub);
    if (!user?.totpSecret)
        return error("Start two-factor enrollment first.", 400);
    if (!verifyTotp(user.totpSecret, body.data.code))
        return error("Invalid authenticator code.", 400);
    await update<User>("users", user.id, { totpEnabled: true });
    return json({ ok: true });
}

export async function DELETE() {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    const user = await findById<User>("users", session.sub);
    if (!user) return error("User not found.", 404);
    await update<User>("users", user.id, {
        totpSecret: null,
        totpEnabled: false,
    });
    return json({ ok: true });
}
