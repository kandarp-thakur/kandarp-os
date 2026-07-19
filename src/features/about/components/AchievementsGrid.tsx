"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
    BadgeCheck,
    GraduationCap,
    Medal,
    Megaphone,
    Shield,
    Trophy,
    type LucideIcon,
} from "lucide-react";

import { useReducedMotion as use3dReducedMotion } from "@3d/hooks/useReducedMotion";
import { cn } from "@utils/cn";
import type {
    Achievement,
    AchievementTier,
} from "@packages/types/achievements";

/** Lucide icon lookup — maps the string icon name in data to a component. */
const ICONS: Record<string, LucideIcon> = {
    GraduationCap,
    Trophy,
    Medal,
    Shield,
    Megaphone,
    BadgeCheck,
};

/** Per-tier accent styling — color + glow intensity. */
const TIER_STYLES: Record<
    AchievementTier,
    { ring: string; glow: string; icon: string; label: string; text: string }
> = {
    legendary: {
        ring: "border-amber-400/60",
        glow: "shadow-[0_0_24px_-4px_rgba(251,191,36,0.45)]",
        icon: "text-amber-500",
        label: "bg-amber-400/15 text-amber-600 dark:text-amber-400",
        text: "Legendary",
    },
    epic: {
        ring: "border-blue-400/60",
        glow: "shadow-[0_0_24px_-4px_rgba(50,108,229,0.42)]",
        icon: "text-blue-500",
        label: "bg-blue-400/15 text-blue-600 dark:text-blue-400",
        text: "Epic",
    },
    rare: {
        ring: "border-sky-400/60",
        glow: "shadow-[0_0_24px_-4px_rgba(56,189,248,0.4)]",
        icon: "text-sky-500",
        label: "bg-sky-400/15 text-sky-600 dark:text-sky-400",
        text: "Rare",
    },
    common: {
        ring: "border-border-default",
        glow: "",
        icon: "text-text-tertiary",
        label: "bg-overlay-hover text-text-secondary",
        text: "Common",
    },
};

interface AchievementsGridProps {
    /** The unlocked badges to render. */
    achievements: Achievement[];
    /** Extra classes (escape hatch). */
    className?: string;
}

/**
 * AchievementsGrid — the "unlocked system badges" section.
 *
 * Renders each achievement as a glass badge card with a tier-colored ring +
 * glow, a Lucide icon medallion, the badge title, a tier label pill, the
 * unlock date, and a short description. Cards stagger in on scroll via Framer
 * Motion; reduced motion renders them instantly.
 *
 * The aesthetic is "achievement unlocked" toast meets premium glass UI —
 * subtle, not gamified-overload. Tier rarity drives the accent color.
 */
export function AchievementsGrid({
    achievements,
    className,
}: AchievementsGridProps) {
    const reduced = useReducedMotion() === true;
    const reduced3d = use3dReducedMotion();
    const prefersReduced = reduced || reduced3d;

    return (
        <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={prefersReduced ? undefined : container}
            className={cn(
                "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
                className,
            )}
        >
            {achievements.map((achievement) => {
                const tier = TIER_STYLES[achievement.tier];
                const Icon = ICONS[achievement.icon] ?? Trophy;
                return (
                    <motion.li
                        key={achievement.id}
                        variants={prefersReduced ? undefined : item}
                    >
                        <article
                            className={cn(
                                "glass-surface group relative flex h-full flex-col gap-4 rounded-2xl border p-5",
                                "transition-all duration-slow ease-smooth",
                                "hover:-translate-y-1 hover:shadow-glass-hover",
                                tier.ring,
                                tier.glow,
                            )}
                        >
                            {/* Header — icon medallion + tier pill */}
                            <div className="flex items-start justify-between gap-3">
                                <div
                                    className={cn(
                                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                                        "bg-canvas-sunken/60 ring-1 ring-inset ring-border-subtle",
                                        tier.icon,
                                    )}
                                >
                                    <Icon
                                        className="h-6 w-6"
                                        strokeWidth={1.75}
                                        aria-hidden="true"
                                    />
                                </div>
                                <span
                                    className={cn(
                                        "rounded-full px-2.5 py-1 font-mono text-2xs uppercase tracking-wider",
                                        tier.label,
                                    )}
                                >
                                    {tier.text}
                                </span>
                            </div>

                            {/* Title + date */}
                            <div>
                                <h3 className="font-sans text-base font-semibold tracking-tight text-text-primary">
                                    {achievement.title}
                                </h3>
                                <p className="mt-1 font-mono text-2xs text-text-tertiary">
                                    Unlocked{" "}
                                    {new Date(
                                        achievement.date,
                                    ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                    {achievement.category
                                        ? ` · ${achievement.category}`
                                        : ""}
                                </p>
                            </div>

                            {/* Description */}
                            <p className="font-sans text-sm leading-relaxed text-text-secondary">
                                {achievement.description}
                            </p>

                            {/* "Achievement Unlocked" footer flourish */}
                            <div className="mt-auto flex items-center gap-1.5 pt-2 font-mono text-2xs text-text-tertiary">
                                <span className="text-success">▸</span>
                                Achievement Unlocked
                            </div>
                        </article>
                    </motion.li>
                );
            })}
        </motion.ul>
    );
}

/* -------------------------------------------------------------------------- */
/* Motion variants                                                           */
/* -------------------------------------------------------------------------- */

const container: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.08 },
    },
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
    },
};

AchievementsGrid.displayName = "AchievementsGrid";
