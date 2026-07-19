/**
 * Hero section content + motion configuration.
 *
 * Single source of truth for the hero terminal script, the cycling roles, and
 * the JS motion values consumed by Framer Motion. Mirrors the approved
 * hero-design.md (§3.6 script, §4 roles, §7 timing) and the tailwind timing
 * tokens. Kept in the data layer so section components stay thin.
 */

import { ROLES } from "@utils/constants";

/** Professional identities cycled by the `whoami` output — the OS boot reveal. */
export const HERO_ROLES = ROLES;

/** The boot banner shown above the name in the hero. */
export const HERO_BOOT_BANNER = "Welcome to Kandarp OS";
export const HERO_BOOT_STATUS = "Boot completed successfully.";

/** A single step in the hero terminal's looping script (hero-design §3.6). */
export type HeroStep =
    | { kind: "command"; text: string }
    | { kind: "output"; text: string }
    | { kind: "role" };

/** A rendered terminal line (committed to the visible buffer). */
export type HeroLine =
    | { id: string; kind: "command"; text: string }
    | { id: string; kind: "output"; text: string }
    | { id: string; kind: "role" };

/** The scripted terminal sequence. */
export const HERO_SCRIPT: HeroStep[] = [
    { kind: "command", text: "whoami" },
    { kind: "role" },
    { kind: "command", text: "cat skills.json" },
    {
        kind: "output",
        text: '{ "cloud": ["AWS", "Docker"], "net": ["VLAN", "Pentest"], "code": ["Python", "Bash"] }',
    },
    { kind: "command", text: "./connect.sh" },
    { kind: "output", text: "Connection ready. Let's build something." },
];

/** Cubic-bezier easing tuple (Framer Motion expects a mutable 4-tuple). */
type Bezier = [number, number, number, number];

/** JS motion values mirroring the tailwind timing tokens. */
export const HERO_MOTION = {
    duration: { slow: 0.32, slower: 0.48, cinematic: 0.64 },
    ease: {
        enter: [0, 0, 0.2, 1] as Bezier,
        spring: [0.34, 1.56, 0.64, 1] as Bezier,
        smooth: [0.45, 0, 0.15, 1] as Bezier,
    },
    /** Entrance delays in seconds (hero-design §7.1 mount sequence). */
    delay: {
        eyebrow: 0.2,
        name: 0.3,
        terminal: 0.6,
        portrait: 0.7,
        buttons: 0.9,
        buttonStagger: 0.08,
        indicator: 1.4,
    },
};

/** Typing cadence in ms (hero-design §3.6 + animation-design §2.1). */
export const HERO_TYPING = {
    /** Per-character command typing speed. */
    char: 60,
    /** Pause after a command executes before its output appears. */
    pause: 300,
    /** Read pause after an output line before the next command. */
    read: 1500,
    /** Dwell per role in the cycling `whoami` output. */
    roleDwell: 2500,
    /** Number of roles shown per `whoami` before the script advances. */
    roleCycles: 2,
    /** Pause before the loop clears and restarts. */
    loop: 3000,
} as const;
