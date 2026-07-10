/**
 * POST /api/admin/auth/login — authenticate a user, set the session cookie.
 *
 * Validates email + password against the user store, issues a JWT, and sets
 * the HttpOnly session cookie. Rate-limited per-IP (5 attempts / 15 min) to
 * slow brute-force attacks. Logs the login to the audit trail.
 *
 * 2FA-ready: if the user has `totpEnabled`, the response asks for a second
 * step (`requiresTotp: true`) instead of issuing a session — the client then
 * POSTs `/api/admin/auth/verify-totp` with the code. Until a user enrolls
 * 2FA, login is single-step.
 */

import { verifyPassword } from "@/lib/admin/auth";
import { error, json } from "@/lib/admin/api";
import { setSessionCookie, logActivity } from "@/lib/admin/session";
import { findByField, update } from "@/lib/admin/repo";
import { ensureSeeded } from "@/lib/admin/seed";
import type { User } from "@/lib/admin/types";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    remember: z.boolean().optional(),
});

/** In-memory rate limiter — { ip: [timestamps] }. Resets on server restart. */
const attempts = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function rateLimited(ip: string): boolean {
    const now = Date.now();
    const hits = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    hits.push(now);
    attempts.set(ip, hits);
    return hits.length > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
    // Seed the store on first boot so the owner account exists.
    await ensureSeeded();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (rateLimited(ip)) {
        return error("Too many login attempts. Try again later.", 429, 429);
    }

    const body = await loginSchema.safeParse(
        await req.json().catch(() => ({})),
    );
    if (!body.success) {
        return error("Invalid email or password.", 400);
    }

    const { email, password } = body.data;
    const user = findByField<User>("users", "email", email.toLowerCase());
    if (!user || user.status !== "active") {
        return error("Invalid email or password.", 401, 401);
    }

    if (!verifyPassword(password, user.passwordHash)) {
        return error("Invalid email or password.", 401, 401);
    }

    // 2FA gate — if enrolled, require a second step.
    if (user.totpEnabled && user.totpSecret) {
        return json({ requiresTotp: true, userId: user.id });
    }

    await setSessionCookie({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });

    await update<User>("users", user.id, {
        lastLoginAt: new Date().toISOString(),
    });
    await logActivity({
        userId: user.id,
        userName: user.name,
        action: "user.login",
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
