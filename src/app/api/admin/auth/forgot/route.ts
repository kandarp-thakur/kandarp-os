/**
 * POST /api/admin/auth/forgot — request a password reset.
 *
 * In a full deployment this would email a reset link. For the self-hosted
 * console it records the request in the audit log and returns a generic
 * "if the email exists, a reset link was sent" message (so it can't be used
 * to enumerate accounts). The owner resets passwords from the Users screen.
 */

import { error, json } from "@backend/middlewares/api";
import { logActivity } from "@backend/auth/session";
import { findByField } from "@backend/repositories/repo";
import type { User } from "@backend/schemas/types";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return error("Invalid email.", 400);

    const user = await findByField<User>(
        "users",
        "email",
        parsed.data.email.toLowerCase(),
    );
    if (user) {
        await logActivity({
            userId: user.id,
            userName: user.name,
            action: "user.password_reset_requested",
            level: "warning",
        });
    }
    // Always return the same message — never reveal whether the email exists.
    return json({
        ok: true,
        message:
            "If an account exists for that email, a reset link has been sent.",
    });
}
