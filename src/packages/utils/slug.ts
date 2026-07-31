/** Slug helpers shared by the admin UI and server validation. */

export const SLUG_MIN_LENGTH = 1;
export const SLUG_MAX_LENGTH = 120;

/** Convert human text into a URL-safe lowercase slug. */
export function sanitizeSlug(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-+/g, "-")
        .slice(0, SLUG_MAX_LENGTH)
        .replace(/-+$/g, "");
}

export function isValidSlug(value: string): boolean {
    return (
        value.length >= SLUG_MIN_LENGTH &&
        value.length <= SLUG_MAX_LENGTH &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    );
}

export const SLUG_ERROR_MESSAGE =
    "Slug can only contain lowercase letters, numbers, and hyphens.";
