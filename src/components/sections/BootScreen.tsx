"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { SITE } from "@/utils/constants";
import { cn } from "@/utils/cn";

/** A single line in the boot log. */
interface BootLine {
    id: number;
    text: string;
    /** "ok" renders a green [ OK ], "info" renders dimmed, "done" renders accent. */
    status: "ok" | "info" | "done";
}

/** The scripted boot sequence — a systemd-style journal. */
const BOOT_SEQUENCE: BootLine[] = [
    { id: 0, text: `[    0.000000] Kandarp OS booting...`, status: "info" },
    { id: 1, text: `[    0.012340] Mounting /dev/identity...`, status: "ok" },
    { id: 2, text: `[    0.031200] Starting DevOps Engine...`, status: "ok" },
    {
        id: 3,
        text: `[    0.058900] Loading cloud modules [aws, docker, k8s]...`,
        status: "ok",
    },
    {
        id: 4,
        text: `[    0.091500] Initializing network stack...`,
        status: "ok",
    },
    {
        id: 5,
        text: `[    0.124000] Establishing CI/CD pipelines...`,
        status: "ok",
    },
    {
        id: 6,
        text: `[    0.158300] Spinning up container runtime...`,
        status: "ok",
    },
    {
        id: 7,
        text: `[    0.201700] Calibrating automation core...`,
        status: "ok",
    },
    {
        id: 8,
        text: `[    0.245100] Security subsystem online...`,
        status: "ok",
    },
    {
        id: 9,
        text: `[    0.289400] Reached target Graphical Interface...`,
        status: "done",
    },
];

/** Per-line reveal delay in ms. */
const LINE_DELAY = 180;
/** Pause after the last line before fading the boot screen out. */
const FADE_DELAY = 600;

interface BootScreenProps {
    /** Called once the boot sequence completes and the screen fades out. */
    onComplete?: () => void;
}

/**
 * BootScreen — the OS boot sequence that plays once on first load.
 *
 * Renders a full-viewport black overlay with a monospace systemd-style boot
 * log that types itself out line-by-line. Each line stamps a green `[ OK ]`
 * (or accent `[ DONE ]` for the final line). Once the sequence completes the
 * overlay fades out and is unmounted, revealing the hero beneath.
 *
 * The boot screen is skipped entirely when:
 *   - reduced motion is preferred (instantly completes), or
 *   - the session has already booted this tab (sessionStorage guard).
 *
 * This is a Client Component — it depends on timers, the DOM, and
 * `prefers-reduced-motion`.
 */
export function BootScreen({ onComplete }: BootScreenProps) {
    const reduced = useReducedMotion() === true;
    const [visibleLines, setVisibleLines] = useState<number>(
        reduced ? BOOT_SEQUENCE.length : 0,
    );
    const [fading, setFading] = useState(false);
    const [done, setDone] = useState(false);

    // Skip the boot animation if reduced motion or already booted this session.
    const skip =
        reduced ||
        (typeof sessionStorage !== "undefined" &&
            sessionStorage.getItem("kandarp-os-booted") === "1");

    useEffect(() => {
        if (skip) {
            setDone(true);
            onComplete?.();
            return;
        }

        let i = 0;
        const interval = setInterval(() => {
            i += 1;
            setVisibleLines(i);
            if (i >= BOOT_SEQUENCE.length) {
                clearInterval(interval);
                setTimeout(() => setFading(true), FADE_DELAY);
            }
        }, LINE_DELAY);

        return () => clearInterval(interval);
    }, [skip, onComplete]);

    // Unmount + mark booted once the fade-out completes.
    useEffect(() => {
        if (!fading) return;
        const t = setTimeout(() => {
            try {
                sessionStorage.setItem("kandarp-os-booted", "1");
            } catch {
                /* sessionStorage may be unavailable — non-fatal. */
            }
            setDone(true);
            onComplete?.();
        }, 500);
        return () => clearTimeout(t);
    }, [fading, onComplete]);

    if (done) return null;

    return (
        <AnimatePresence>
            <motion.div
                aria-hidden="true"
                initial={{ opacity: 1 }}
                animate={{ opacity: fading ? 0 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
                className="fixed inset-0 z-[100] flex flex-col justify-center bg-[#0a0a0f] px-6 font-mono text-xs text-[#e4e4e7] sm:px-12 sm:text-sm"
            >
                {/* Boot logo */}
                <div className="mx-auto mb-8 w-full max-w-2xl">
                    <p className="text-[#71717a]">{SITE.userAtHost}</p>
                    <p className="mt-1 text-lg font-bold text-white sm:text-2xl">
                        Kandarp OS
                    </p>
                </div>

                {/* Boot log */}
                <div className="mx-auto w-full max-w-2xl space-y-1">
                    {BOOT_SEQUENCE.slice(0, visibleLines).map((line) => (
                        <motion.p
                            key={line.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                "whitespace-pre-wrap break-words",
                                line.status === "info" && "text-[#a1a1aa]",
                            )}
                        >
                            {line.text}
                            {line.status === "ok" && (
                                <span className="ml-2 font-bold text-[#22c55e]">
                                    [ OK ]
                                </span>
                            )}
                            {line.status === "done" && (
                                <span className="ml-2 font-bold text-[#2496ED]">
                                    [ DONE ]
                                </span>
                            )}
                        </motion.p>
                    ))}

                    {/* Blinking cursor on the active line. */}
                    {visibleLines < BOOT_SEQUENCE.length && (
                        <span className="inline-block h-[1.1em] w-[0.55ch] translate-y-[0.15em] bg-[#2496ED] animate-cursor-blink" />
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

BootScreen.displayName = "BootScreen";
