/**
 * Type definitions for the Achievements section — "unlocked system badges".
 *
 * Each achievement is modeled as a badge that the OS has unlocked, mirroring
 * the spec's gamification-meets-engineering aesthetic: an icon, a title, a
 * rarity tier, a date unlocked, and a short description.
 */

/** Rarity tier — controls the badge's accent color + glow. */
export type AchievementTier = "legendary" | "epic" | "rare" | "common";

/** A single unlocked achievement badge. */
export interface Achievement {
    /** Stable unique id (slug-style). */
    id: string;
    /** The badge title, e.g. "Student of the Year". */
    title: string;
    /** One-line description shown under the title. */
    description: string;
    /** Rarity tier — drives the accent color + glow intensity. */
    tier: AchievementTier;
    /** ISO date string (YYYY-MM-DD) when the badge was unlocked. */
    date: string;
    /** Lucide icon name (resolved by the component). */
    icon: string;
    /** Optional category label, e.g. "Academic", "Sports". */
    category?: string;
}
