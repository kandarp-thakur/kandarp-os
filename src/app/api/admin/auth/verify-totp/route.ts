import { verifyTotpChallenge } from "@backend/auth/auth";
import { error, json } from "@backend/middlewares/api";
import { setSessionCookie, logActivity } from "@backend/auth/session";
import { createSession } from "@backend/auth/session-service";
import { findById, update } from "@backend/repositories/repo";
import type { User } from "@backend/schemas/types";
import { verifyTotp } from "@backend/security/totp";
import { z } from "zod";

const schema = z.object({
    challenge: z.string().min(1),
    code: z.string().regex(/^\s*\d{6}\s*$/),
});

export async function POST(req: Request) {
    const body = schema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) return error("Invalid verification request.", 400);

    const challenge = verifyTotpChallenge(body.data.challenge);
    if (!challenge) return error("Verification challenge expired.", 401, 401);

    const user = await findById<User>("users", challenge.sub);
    if (
        !user ||
        user.status !== "active" ||
        !user.totpEnabled ||
        !user.totpSecret
    ) {
        return error("Invalid verification request.", 401, 401);
    }
    if (!verifyTotp(user.totpSecret, body.data.code)) {
        return error("Invalid authenticator code.", 401, 401);
    }

    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const sid = await createSession(
        user.id,
        ip,
        req.headers.get("user-agent") ?? "",
        challenge.remember,
    );
    await setSessionCookie(
        {
            sub: user.id,
            sid,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        challenge.remember,
    );
    await update<User>("users", user.id, {
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString(),
    });
    await logActivity({
        userId: user.id,
        userName: user.name,
        action: "user.login.2fa",
        level: "success",
        ip,
    });
    return json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
}
