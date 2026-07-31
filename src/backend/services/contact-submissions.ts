import { createHmac } from "node:crypto";

import { env } from "@backend/config/env-schema";
import { prisma } from "@backend/database/db";
import type {
    ContactStatus,
    ContactSubmission,
    ContactSubmissionInput,
} from "@backend/schemas/types";

const STATUS_TO_DB = {
    new: "NEW",
    read: "READ",
    replied: "REPLIED",
    archived: "ARCHIVED",
    spam: "SPAM",
} as const;

const STATUS_FROM_DB: Record<string, ContactStatus> = {
    NEW: "new",
    READ: "read",
    REPLIED: "replied",
    ARCHIVED: "archived",
    SPAM: "spam",
};

interface ContactRow {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    source: string;
    spamScore: number;
    readAt: Date | null;
    repliedAt: Date | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ContactInboxQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: ContactStatus;
}

export interface ContactInboxPage {
    rows: ContactSubmission[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    unread: number;
}

function toSubmission(row: ContactRow): ContactSubmission {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        subject: row.subject,
        message: row.message,
        status: STATUS_FROM_DB[row.status] ?? "new",
        source: row.source,
        spamScore: row.spamScore,
        readAt: row.readAt?.toISOString() ?? null,
        repliedAt: row.repliedAt?.toISOString() ?? null,
        archivedAt: row.archivedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export function hashContactAddress(address: string): string {
    if (!address || address === "unknown") return "";
    const key =
        env.CONTACT_HASH_SECRET ??
        env.ADMIN_JWT_SECRET ??
        "development-contact-hash-key";
    return createHmac("sha256", key).update(address).digest("hex");
}

export async function createContactSubmission(
    input: ContactSubmissionInput,
    context: { ipAddress: string; userAgent: string },
): Promise<ContactSubmission> {
    const row = await prisma.contactSubmission.create({
        data: {
            name: input.name,
            email: input.email,
            subject: input.subject,
            message: input.message,
            source: "contact-page",
            ipHash: hashContactAddress(context.ipAddress),
            userAgent: context.userAgent.slice(0, 512),
        },
    });

    // Analytics is an aggregate signal only. Inbox persistence above remains the
    // source of truth even if telemetry insertion fails.
    try {
        await prisma.analyticsEvent.create({
            data: {
                type: "CONTACT_SUBMIT",
                path: "/contact",
                meta: { submissionId: row.id },
            },
        });
    } catch {
        // Contact delivery must not fail because optional analytics is unavailable.
    }

    return toSubmission(row);
}

export async function listContactSubmissions(
    query: ContactInboxQuery,
): Promise<ContactInboxPage> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const search = query.search?.trim();
    const where = {
        ...(query.status ? { status: STATUS_TO_DB[query.status] } : {}),
        ...(search
            ? {
                  OR: [
                      {
                          name: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                      {
                          email: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                      {
                          subject: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                      {
                          message: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                  ],
              }
            : {}),
    };

    const [rows, total, unread] = await prisma.$transaction([
        prisma.contactSubmission.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.contactSubmission.count({ where }),
        prisma.contactSubmission.count({ where: { status: "NEW" } }),
    ]);

    return {
        rows: rows.map(toSubmission),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        unread,
    };
}

export async function getContactSubmission(
    id: string,
): Promise<ContactSubmission | null> {
    const row = await prisma.contactSubmission.findUnique({ where: { id } });
    return row ? toSubmission(row) : null;
}

export async function updateContactSubmissionStatus(
    id: string,
    status: ContactStatus,
): Promise<ContactSubmission | null> {
    const existing = await prisma.contactSubmission.findUnique({
        where: { id },
        select: { id: true },
    });
    if (!existing) return null;

    const now = new Date();
    const row = await prisma.contactSubmission.update({
        where: { id },
        data: {
            status: STATUS_TO_DB[status],
            readAt: status === "new" ? null : now,
            repliedAt: status === "replied" ? now : undefined,
            archivedAt: status === "archived" ? now : null,
        },
    });
    return toSubmission(row);
}

export async function deleteContactSubmission(id: string): Promise<boolean> {
    const deleted = await prisma.contactSubmission.deleteMany({
        where: { id },
    });
    return deleted.count > 0;
}
