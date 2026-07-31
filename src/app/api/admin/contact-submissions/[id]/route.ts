import {
    audit,
    error,
    json,
    parseBody,
    requirePermission,
} from "@backend/middlewares/api";
import { contactSubmissionUpdateSchema } from "@backend/schemas/types";
import {
    deleteContactSubmission,
    getContactSubmission,
    updateContactSubmissionStatus,
} from "@backend/services/contact-submissions";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
    const session = await requirePermission("inbox:read");
    if (session instanceof Response) return session;

    const { id } = await context.params;
    const submission = await getContactSubmission(id);
    if (!submission) return error("Contact submission not found", 404);
    return json(submission);
}

export async function PATCH(req: Request, context: RouteContext) {
    const session = await requirePermission("inbox:write");
    if (session instanceof Response) return session;

    const body = await parseBody(req, contactSubmissionUpdateSchema);
    if (body instanceof Response) return body;

    const { id } = await context.params;
    const submission = await updateContactSubmissionStatus(id, body.status);
    if (!submission) return error("Contact submission not found", 404);

    audit(
        session,
        "contact-submission.status",
        "contact-submission",
        id,
        `Status changed to ${body.status}`,
    );
    return json(submission);
}

export async function DELETE(_req: Request, context: RouteContext) {
    const session = await requirePermission("inbox:delete");
    if (session instanceof Response) return session;

    const { id } = await context.params;
    const deleted = await deleteContactSubmission(id);
    if (!deleted) return error("Contact submission not found", 404);

    audit(session, "contact-submission.delete", "contact-submission", id);
    return json({ ok: true });
}
