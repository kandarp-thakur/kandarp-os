"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { executeCommand } from "@/lib/terminalCommands";
import { buildBootLines, inputLine } from "@/lib/terminalLines";
import { PROMPT } from "@utils/constants";
import { scrollToSection } from "@utils/navigation";
import type { TerminalLine } from "@packages/types/contact";

export interface UseTerminal {
    /** All lines rendered in the session (boot + inputs + outputs). */
    lines: TerminalLine[];
    /** Current value of the input field. */
    input: string;
    /** Whether the boot sequence has finished and input is enabled. */
    isReady: boolean;
    /** Command history for arrow-key recall. */
    history: string[];
    /** Update the input value (controlled input). */
    setInput: (value: string) => void;
    /** Submit the current input as a command. */
    submit: () => void;
    /** Move backward/forward through command history. */
    recallHistory: (direction: "prev" | "next") => void;
    /** Clear the screen (used by the clear button + `clear` command). */
    clearScreen: () => void;
}

/**
 * Drives the contact terminal: boot sequence, command dispatch, history,
 * and side effects (opening links). UI is rendered by ContactTerminal;
 * command logic lives in `lib/terminalCommands`; line factories in
 * `lib/terminalLines`. This hook owns React state only.
 *
 * @param bootDelay ms before the boot sequence begins (allows mount animation).
 * @param overrides optional CMS-driven overrides (e.g. resume URL).
 */
export function useTerminal(
    bootDelay = 200,
    overrides?: { resumeUrl?: string },
): UseTerminal {
    const [lines, setLines] = useState<TerminalLine[]>([]);
    const [input, setInput] = useState("");
    const [isReady, setIsReady] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const historyIndex = useRef<number | null>(null);

    // Boot sequence: print lines one-by-one to simulate an SSH login.
    useEffect(() => {
        let cancelled = false;
        const boot = buildBootLines();
        const timers: ReturnType<typeof setTimeout>[] = [];

        boot.forEach((line, index) => {
            const timer = setTimeout(
                () => {
                    if (cancelled) return;
                    setLines((prev) => [...prev, line]);
                    if (index === boot.length - 1) {
                        setIsReady(true);
                    }
                },
                bootDelay + index * 180,
            );
            timers.push(timer);
        });

        return () => {
            cancelled = true;
            timers.forEach(clearTimeout);
        };
    }, [bootDelay]);

    const clearScreen = useCallback(() => {
        setLines([]);
        setHistory([]);
        historyIndex.current = null;
    }, []);

    const submit = useCallback(() => {
        const raw = input;
        const echoed = inputLine(PROMPT, raw);
        const result = executeCommand(raw, overrides);

        if (result.clear) {
            clearScreen();
            setInput("");
            return;
        }

        setLines((prev) => [...prev, echoed, ...result.lines]);

        // Record non-empty commands in history (dedupe consecutive duplicates).
        if (raw.trim() !== "") {
            setHistory((prev) => {
                const last = prev[prev.length - 1];
                return last === raw ? prev : [...prev, raw];
            });
        }
        historyIndex.current = null;

        // Open external links in a new tab (client-side side effect).
        if (result.openUrl) {
            window.open(result.openUrl, "_blank", "noopener,noreferrer");
        }

        // Smooth-scroll to a section (e.g. `cd projects`).
        if (result.scrollTo) {
            scrollToSection(result.scrollTo);
        }

        setInput("");
    }, [input, clearScreen, overrides]);

    const recallHistory = useCallback(
        (direction: "prev" | "next") => {
            if (history.length === 0) return;

            if (direction === "prev") {
                // First press: start at the end. Subsequent: move back.
                const next =
                    historyIndex.current === null
                        ? history.length - 1
                        : Math.max(0, historyIndex.current - 1);
                historyIndex.current = next;
                const entry = history[next];
                if (entry !== undefined) setInput(entry);
            } else {
                if (historyIndex.current === null) return;
                const next = historyIndex.current + 1;
                if (next >= history.length) {
                    historyIndex.current = null;
                    setInput("");
                } else {
                    historyIndex.current = next;
                    const entry = history[next];
                    if (entry !== undefined) setInput(entry);
                }
            }
        },
        [history],
    );

    return {
        lines,
        input,
        isReady,
        history,
        setInput,
        submit,
        recallHistory,
        clearScreen,
    };
}
