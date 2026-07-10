/**
 * Edit blog post page — renders the BlogEditor with the post id.
 */

import { BlogEditor } from "@/components/admin/BlogEditor";

export default async function EditBlogPostPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <BlogEditor postId={id} />;
}
