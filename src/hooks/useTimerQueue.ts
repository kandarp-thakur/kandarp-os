"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * useTimerQueue — shared setTimeout lifecycle manager.
 *
 * Both terminal hooks (`useHeroTerminal`, `useAboutTerminal`) maintain an
 * identical pattern: a ref array of pending `setTimeout` handles, a `push`
 * helper that appends to it, and a `clearAll` that flushes them on unmount or
 * re-run. This hook centralizes that bookkeeping so each terminal hook only
 * owns its own sequencing logic.
 *
 * Returns:
 *   - `push(timer)` — register a pending timer so it is cleaned up later.
 *   - `clearAll()` — cancel every pending timer and reset the queue.
 *   - `cancelledRef` — a ref boolean the effect closure can read to bail out
 *     of scheduled callbacks after the effect has torn down. Set to `true` by
 *     the cleanup function.
 *
 * The hook also installs its own unmount cleanup that calls `clearAll()`, so
 * callers do not need to repeat that in their own effect cleanup (though they
 * typically still set `cancelledRef.current = true` first to short-circuit
 * any in-flight callbacks).
 */
export function useTimerQueue() {
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const cancelledRef = useRef(false);

    const push = useCallback((timer: ReturnType<typeof setTimeout>) => {
        timersRef.current.push(timer);
    }, []);

    const clearAll = useCallback(() => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    }, []);

    /**
     * Mark this queue as live again (not cancelled).
     *
     * `cancelledRef` is flipped to `true` by the unmount/effect cleanup so
     * in-flight callbacks can bail out. Under React StrictMode (dev), effects
     * double-invoke: cleanup runs, then the effect re-runs. Without resetting
     * the flag, every callback scheduled by the second run would short-circuit
     * on the stale `true` left by the first cleanup — stranding the sequence
     * (e.g. the About terminal's typing never starts). Call this at the top of
     * any effect that schedules callbacks via `push`.
     */
    const reset = useCallback(() => {
        cancelledRef.current = false;
    }, []);

    // Unmount safety net: cancel any timers the caller forgot to clear.
    useEffect(() => {
        return () => {
            cancelledRef.current = true;
            clearAll();
        };
    }, [clearAll]);

    return { push, clearAll, reset, cancelledRef };
}
