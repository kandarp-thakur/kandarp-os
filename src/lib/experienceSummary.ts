import { SITE } from "@/utils/constants";

/**
 * Experience summary helpers (experience-page-design §2).
 *
 * Pure formatting utilities kept in the lib layer so the page + components
 * stay thin. Mirrors the aboutSummary.ts pattern: a heading helper for the
 * sr-only semantic section + a date formatter for the deployment cards.
 */

/** The page heading — used by the visual header + the sr-only section. */
export function experienceHeading(): string {
    return "Deployment History";
}

/**
 * Format a `YYYY-MM` date string as a short, human-readable label.
 *
 * `2024-06` → `Jun 2024`. Returns `"Present"` for `null` (active role).
 * Falls back to the raw value if parsing fails — never throws.
 */
export function formatDeploymentDate(value: string | null): string {
    if (value === null) return "Present";

    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return value;

    const [, yearStr, monthStr] = match;
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        month < 1 ||
        month > 12
    ) {
        return value;
    }

    // Use UTC to avoid timezone shifting the month; the input is a bare
    // year-month, not an instant.
    const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
        "en-US",
        { month: "short", year: "numeric", timeZone: "UTC" },
    );
    return label;
}

/**
 * Build the date range label for a deployment, e.g. `Jun 2024–Present`.
 * Uses an en-dash to match the design doc's typography.
 */
export function formatDeploymentRange(
    startDate: string,
    endDate: string | null,
): string {
    return `${formatDeploymentDate(startDate)}–${formatDeploymentDate(endDate)}`;
}

/** The sr-only intro line for the experience semantic section. */
export function experienceIntro(): string {
    return `${SITE.owner}'s career rendered as a deployment history — versioned, statused, and expandable.`;
}
