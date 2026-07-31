-- Keep blog slugs valid even when data is written outside the application.
ALTER TABLE "blog_posts"
ADD CONSTRAINT "blog_posts_slug_format_check"
CHECK (
    char_length("slug") BETWEEN 1 AND 120
    AND "slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
);
