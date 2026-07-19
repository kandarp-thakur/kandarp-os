"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";

import { ABOUT_COMMANDS, ABOUT_TYPING } from "@/data/about";
import { useTimerQueue } from "@hooks/useTimerQueue";
import type { AboutCommand } from "@packages/types/about";

/** A committed command block: command typed, output maybe revealed. */
export interface AboutBlock {
    command: AboutCommand;
    outputShown: boolean;
}

export interface UseAboutTerminal {
    /** Ref to attach to the scrollable terminal body (IntersectionObserver target). */
    terminalRef: RefObject<HTMLDivElement | null>;
    /** Committed command blocks, in execution order. */
    blocks: AboutBlock[];
    /** Partial text of the command currently being typed ("" when idle). */
    typing: string;
    /** Whether the typing sequence is running (between start and completion).
     * Stays `true` during the inter-command read pauses so the idle prompt
     * cursor keeps blinking — the terminal never looks frozen mid-session
     * (animation-design §3.8: "Cursor blinks continuously"). */
    typingActive: boolean;
    /** Whether the whole sequence has finished. */
    isComplete: boolean;
}

/**
 * Drives the About terminal: a scroll-triggered, character-by-character
 * typing sequence. Commands type one at a time (60ms/char); each command's
 * output appears after a brief pause, then a read pause precedes the next
 * command. The sequence starts when the terminal scrolls into view.
 *
 * Reduced motion renders the full session at once — no typing, no cursor
 * motion — so the terminal is a static, readable document (about-page-design
 * §3.4, §3.6, §13.4).
 */
export function useAboutTerminal(): UseAboutTerminal {
    const reduced = useReducedMotion() === true;
    const [blocks, setBlocks] = useState<AboutBlock[]>([]);
    const [typing, setTyping] = useState("");
    const [typingActive, setTypingActive] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const terminalRef = useRef<HTMLDivElement>(null);
    const startedRef = useRef(false);
    const { push, clearAll, reset, cancelledRef } = useTimerQueue();

    // Reduced motion: commit every block with output shown, no typing.
    useEffect(() => {
        if (!reduced) return;
        setBlocks(
            ABOUT_COMMANDS.map((command) => ({ command, outputShown: true })),
        );
        setTyping("");
        setTypingActive(false);
        setIsComplete(true);
    }, [reduced]);

    // Scroll-triggered sequential typing (skipped under reduced motion).
    useEffect(() => {
        // Re-arm the queue: StrictMode (dev) double-invokes effects, and the
        // first cleanup flips `cancelledRef` to true. Without resetting, every
        // callback scheduled by this second run would bail on the stale flag.
        reset();
        if (reduced) return;
        const el = terminalRef.current;
        if (!el) return;

        // Organic per-keystroke delay (animation-design §3.8). A flat cadence
        // reads as mechanical; real typing breathes. We add a micro-lift after
        // spaces and path punctuation plus gentle jitter, floored by `charMin`
        // so the reveal pace is preserved while the rhythm feels human.
        const delayFor = (text: string, index: number) => {
            const prev = text[index - 1];
            let base = ABOUT_TYPING.char;
            if (prev === " ") base += ABOUT_TYPING.wordGap;
            else if (prev === "/" || prev === ".")
                base += ABOUT_TYPING.punctGap;
            const jitter = (Math.random() * 2 - 1) * ABOUT_TYPING.jitter;
            return Math.max(ABOUT_TYPING.charMin, base + jitter);
        };

        // Type a command char-by-char, then reveal its output, then advance.
        const typeCommand = (cmd: AboutCommand, done: () => void) => {
            let i = 0;
            setTyping("");
            const tick = () => {
                if (cancelledRef.current) return;
                i += 1;
                setTyping(cmd.command.slice(0, i));
                if (i < cmd.command.length) {
                    push(setTimeout(tick, delayFor(cmd.command, i)));
                    return;
                }
                // Command fully typed — commit the block (output hidden).
                setBlocks((prev) => [
                    ...prev,
                    { command: cmd, outputShown: false },
                ]);
                setTyping("");
                // `typingActive` stays true through the pause + read so the
                // idle prompt cursor keeps blinking between commands — the
                // terminal never looks frozen mid-session.
                // After a pause, reveal the output, then read, then advance.
                push(
                    setTimeout(() => {
                        if (cancelledRef.current) return;
                        setBlocks((prev) =>
                            prev.map((b, idx) =>
                                idx === prev.length - 1
                                    ? { ...b, outputShown: true }
                                    : b,
                            ),
                        );
                        push(setTimeout(done, ABOUT_TYPING.read));
                    }, ABOUT_TYPING.pause),
                );
            };
            push(setTimeout(tick, delayFor(cmd.command, 0)));
        };

        const runSequence = () => {
            setTypingActive(true);
            let idx = 0;
            const step = () => {
                if (cancelledRef.current) return;
                if (idx >= ABOUT_COMMANDS.length) {
                    setTypingActive(false);
                    setIsComplete(true);
                    return;
                }
                const cmd = ABOUT_COMMANDS[idx];
                idx += 1;
                if (!cmd) return; // unreachable; satisfies noUncheckedIndexedAccess
                typeCommand(cmd, step);
            };
            push(setTimeout(step, ABOUT_TYPING.start));
        };

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && !startedRef.current) {
                        startedRef.current = true;
                        observer.disconnect();
                        runSequence();
                    }
                }
            },
            { threshold: 0.15 },
        );
        observer.observe(el);

        return () => {
            cancelledRef.current = true;
            clearAll();
            observer.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduced]);

    return { terminalRef, blocks, typing, typingActive, isComplete };
}
