/**
 * Achievement badge data — the "unlocked system badges" section.
 *
 * Each entry is a real accomplishment rendered as a gamified OS badge with a
 * rarity tier. The tier drives the accent color + glow: legendary (gold),
 * epic (purple), rare (blue), common (neutral). Data lives here so the
 * section component stays a thin presentational layer.
 */

import type { Achievement } from "@/types/achievements";

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: "student-of-the-year",
        title: "Student of the Year 2023",
        description:
            "Awarded Student of the Year at TIPS Dwarka for exceptional contributions in events, hackathons, and sports across the 2020–2023 batch.",
        tier: "legendary",
        date: "2023-06-15",
        icon: "GraduationCap",
        category: "Academic",
    },
    {
        id: "code-a-zone-winner",
        title: "Code-A-Zone — 1st Rank",
        description:
            "Secured 1st rank at the Code-A-Zone coding contest organized by GeeksForGeeks at HMR Institute of Technology.",
        tier: "epic",
        date: "2023-09-22",
        icon: "Trophy",
        category: "Hackathon",
    },
    {
        id: "national-mma-champion",
        title: "National MMA Champion",
        description:
            "National champion of Mixed Martial Arts (MMA) — discipline, endurance, and strategy beyond the keyboard.",
        tier: "legendary",
        date: "2022-11-05",
        icon: "Medal",
        category: "Sports",
    },
    {
        id: "ncc-cadet",
        title: "NCC Cadet",
        description:
            "Cadet of the National Cadet Corps (NCC) — leadership, teamwork, and discipline under pressure.",
        tier: "rare",
        date: "2021-08-10",
        icon: "Shield",
        category: "Leadership",
    },
    {
        id: "campus-ambassador",
        title: "Campus Ambassador",
        description:
            "Campus Ambassador at TIPS Dwarka (2022–2023) — promoted university events and increased student engagement.",
        tier: "rare",
        date: "2022-03-18",
        icon: "Megaphone",
        category: "Leadership",
    },
    {
        id: "president-networking-club",
        title: "President — Networking & Security Club",
        description:
            "President of the Networking and Security Club (2022–2023) — led and organized networking and cybersecurity initiatives.",
        tier: "epic",
        date: "2022-04-01",
        icon: "Network",
        category: "Leadership",
    },
    {
        id: "secretary-coding-club",
        title: "Secretary — Coding Club",
        description:
            "Secretary of the Coding Club (2021–2023) — managed club operations and coordinated coding activities.",
        tier: "rare",
        date: "2021-09-01",
        icon: "Code2",
        category: "Leadership",
    },
    {
        id: "ideation-wins",
        title: "Ideation Champion",
        description:
            "Won numerous ideation contests, organized many events, and received prize money, certificates, and vouchers for achievements.",
        tier: "epic",
        date: "2023-05-10",
        icon: "Lightbulb",
        category: "Hackathon",
    },
];

/** Summary stats for the achievements header. */
export const ACHIEVEMENT_STATS = [
    { key: "total", label: "Badges", value: String(ACHIEVEMENTS.length) },
    {
        key: "legendary",
        label: "Legendary",
        value: String(
            ACHIEVEMENTS.filter((a) => a.tier === "legendary").length,
        ),
    },
    {
        key: "epic",
        label: "Epic",
        value: String(ACHIEVEMENTS.filter((a) => a.tier === "epic").length),
    },
    {
        key: "rare",
        label: "Rare",
        value: String(ACHIEVEMENTS.filter((a) => a.tier === "rare").length),
    },
] as const;
