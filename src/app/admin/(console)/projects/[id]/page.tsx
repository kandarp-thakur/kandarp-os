/**
 * Edit project page — renders the ProjectEditor with the project id
 * from the dynamic route segment.
 */

import { ProjectEditor } from "@features/admin/components/ProjectEditor";

export default async function EditProjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <ProjectEditor projectId={id} />;
}
