import { json, requirePermission } from "@backend/middlewares/api";
import { contactStatusSchema } from "@backend/schemas/types";
import { listContactSubmissions } from "@backend/services/contact-submissions";

export async function GET(req: Request) {
    const session = await requirePermission("inbox:read");
    if (session instanceof Response) return session;

    const params = new URL(req.url).searchParams;
    const parsedStatus = contactStatusSchema.safeParse(params.get("status"));
    const page = Number.parseInt(params.get("page") ?? "1", 10);
    const pageSize = Number.parseInt(params.get("pageSize") ?? "20", 10);

    const result = await listContactSubmissions({
        page: Number.isFinite(page) ? page : 1,
        pageSize: Number.isFinite(pageSize) ? pageSize : 20,
        search: params.get("search") ?? undefined,
        status: parsedStatus.success ? parsedStatus.data : undefined,
    });

    return json(result);
}
