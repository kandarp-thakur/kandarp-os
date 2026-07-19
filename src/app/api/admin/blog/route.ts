/**
 * Blog API — /api/admin/blog
 * Collection root: list + create.
 */

import {
    createCollectionHandlers,
    createCrudConfig,
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

export const { GET, POST } = createCollectionHandlers<
    BlogPost,
    typeof blogPostSchema
>(config);
