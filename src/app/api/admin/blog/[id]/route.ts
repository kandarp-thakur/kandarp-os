/**
 * Blog API — /api/admin/blog/[id]
 * Per-entity: get + update + delete.
 */

import {
    createCrudConfig,
    createEntityHandlers,
} from "@backend/controllers/crud";
import { blogPostSchema, type BlogPost } from "@backend/schemas/types";

const config = createCrudConfig({
    collection: "blogPosts",
    schema: blogPostSchema,
    read: "content:read",
    write: "content:write",
    del: "content:delete",
    label: "blog_post",
});

export const { GET, PATCH, DELETE } = createEntityHandlers<
    BlogPost,
    typeof blogPostSchema
>(config);
