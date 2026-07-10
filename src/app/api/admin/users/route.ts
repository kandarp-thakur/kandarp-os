/**
 * GET /api/admin/users — list users (secrets stripped).
 * POST /api/admin/users — create a user (users:write).
 *
 * User passwords are hashed with scrypt before storage. The list/get
 * endpoints never return `passwordHash` or `totpSecret`.
 */

import { z } from "zod";

import {
    audit,
    error,
    getQuery,
    json,
    parseBody,
    requirePermission,
} from "@/lib/admin/api";
import { create, query } from "@/lib/admin/repo";
import { hashPassword, type AdminRole } from "@/lib/admin/auth";
import type { SafeUser, User } from "@/lib/admin/types";

/** Strip secrets from a user row before sending it to the client. */
function toSafe(user: User): SafeUser {
    const { passwordHash: _p, totpSecret: _t, ...safe } = user;
    return safe;
}

const createUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["owner", "admin", "editor", "viewer"]).default("viewer"),
    avatar: z.string().optional(),
    status: z.enum(["active", "suspended", "invited"]).default("active"),
});

export async function GET(req: Request) {
    const session = await requirePermission("users:read");
    if (session instanceof Response) return session;
    const result = query<User>("users", getQuery(req));
    return json({
        ...result,
        rows: result.rows.map(toSafe),
    });
}

export async function POST(req: Request) {
    const session = await requirePermission("users:write");
    if (session instanceof Response) return session;

    const body = await parseBody(req, createUserSchema);
    if (body instanceof Response) return body;

    // Only the owner can create another owner.
    const role = body.role ?? "viewer";
    if (role === "owner" && session.role !== "owner") {
        return error("Only the owner can assign the owner role", 403, 403);
    }

    const user = await create<User>(
        "users",
        {
            name: body.name,
            email: body.email.toLowerCase(),
            passwordHash: hashPassword(body.password),
            role: role as AdminRole,
            avatar: body.avatar,
            bio: "",
            status: body.status ?? "active",
            totpSecret: null,
            totpEnabled: false,
            lastLoginAt: null,
            sessions: [],
        },
        session.sub,
    );

    audit(session, "user.create", "users", user.id, `role=${user.role}`);
    return json(toSafe(user), 201);
}
