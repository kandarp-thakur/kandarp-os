"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { HERO_ROLES, HERO_SCRIPT, HERO_TYPING } from "@/data/hero";
import { useTimerQueue } from "@hooks/useTimerQueue";
import type { HeroLine } from "@/data/hero";

export interface UseHeroTerminal {
    /** Committed terminal lines (commands + outputs + the role line). */
    lines: HeroLine[];
    /** Text of the command currently being typed ("" when idle). */
    typing: string;
    /** Index into HERO_ROLES for the active role line. */
    roleIndex: number;
    /** Pause the auto-typing loop (e.g. on hover). */
    pause: () => void;
    /** Resume the auto-typing loop. */
    resume: () => void;
}

/** Mount delay before the first command types (hero-design §7.1: 1100ms). */
const TYPE_START_DELAY = 1100;

/**
 * Drives the hero terminal: a looping, character-by-character typing sequence
 * with a cycling `whoami` role (Concept A). Commands type slow (60ms/char);
 * outputs appear with a fade. The loop clears and restarts seamlessly, and the
 * role index persists across loops so all identities surface over time.
 *
 * Reduced motion renders the full script at once with the first role and a
 * static cursor — no typing, no cycling.
 */
export function useHeroTerminal(): UseHeroTerminal {
    const reduced = useReducedMotion() === true;
    const [lines, setLines] = useState<HeroLine[]>([]);
    const [typing, setTyping] = useState("");
    const [roleIndex, setRoleIndex] = useState(0);

    const { push, clearAll, reset, cancelledRef } = useTimerQueue();
    const paused = useRef(false);
    const seq = useRef(0);
    const roleCount = useRef(0);

    const nextId = (): string => `h${seq.current++}`;

    // Reduced motion: render the full script at once, first role, no cycling.
    useEffect(() => {
        if (!reduced) return;
        setLines(
            HERO_SCRIPT.map((step): HeroLine => {
                if (step.kind === "command")
                    return { id: nextId(), kind: "command", text: step.text };
                if (step.kind === "output")
                    return { id: nextId(), kind: "output", text: step.text };
                return { id: nextId(), kind: "role" };
            }),
        );
        setTyping("");
        setRoleIndex(0);
    }, [reduced]);

    useEffect(() => {
        // Re-arm the queue: StrictMode (dev) double-invokes effects, and the
        // first cleanup flips `cancelledRef` to true. Without resetting, every
        // callback scheduled by this second run would bail on the stale flag.
        reset();
        if (reduced) return;
        // Schedule `fn` after `delay` ms; while paused, re-check until unpaused
        // so the loop freezes in place without losing its position.
        const guard = (fn: () => void, delay: number) =>
            push(
                setTimeout(
                    () => (paused.current ? guard(fn, 100) : fn()),
                    delay,
                ),
            );

        const typeCommand = (text: string, done: () => void) => {
            let i = 0;
            setTyping("");
            const tick = () => {
                if (cancelledRef.current) return;
                i += 1;
                setTyping(text.slice(0, i));
                if (i < text.length) {
                    guard(tick, HERO_TYPING.char);
                } else {
                    setLines((prev) => [
                        ...prev,
                        { id: nextId(), kind: "command", text },
                    ]);
                    setTyping("");
                    guard(done, HERO_TYPING.pause);
                }
            };
            guard(tick, HERO_TYPING.char);
        };

        const showOutput = (text: string, done: () => void) => {
            setLines((prev) => [
                ...prev,
                { id: nextId(), kind: "output", text },
            ]);
            guard(done, HERO_TYPING.read);
        };

        const showRole = (done: () => void) => {
            setLines((prev) => [...prev, { id: nextId(), kind: "role" }]);
            let cycle = 0;
            const next = () => {
                if (cancelledRef.current) return;
                setRoleIndex(roleCount.current % HERO_ROLES.length);
                roleCount.current += 1;
                cycle += 1;
                if (cycle < HERO_TYPING.roleCycles) {
                    guard(next, HERO_TYPING.roleDwell);
                } else {
                    guard(done, HERO_TYPING.read);
                }
            };
            next();
        };

        const runScript = () => {
            let idx = 0;
            const step = () => {
                if (cancelledRef.current) return;
                if (idx >= HERO_SCRIPT.length) {
                    guard(() => {
                        setLines([]);
                        idx = 0;
                        step();
                    }, HERO_TYPING.loop);
                    return;
                }
                const current = HERO_SCRIPT[idx];
                idx += 1;
                if (!current) return; // unreachable; satisfies noUncheckedIndexedAccess
                if (current.kind === "command") typeCommand(current.text, step);
                else if (current.kind === "output")
                    showOutput(current.text, step);
                else showRole(step);
            };
            step();
        };

        guard(runScript, TYPE_START_DELAY);
        return () => {
            cancelledRef.current = true;
            clearAll();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduced]);

    return {
        lines,
        typing,
        roleIndex,
        pause: () => {
            paused.current = true;
        },
        resume: () => {
            paused.current = false;
        },
    };
}
