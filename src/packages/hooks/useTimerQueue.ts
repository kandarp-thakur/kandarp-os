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
     * `cancelledRef` is flipped to `true` by the consumer effect's own cleanup
     * so in-flight callbacks can bail out. Under React StrictMode (dev),
     * effects double-invoke: the consumer cleanup runs, then the consumer
     * effect re-runs and calls `reset()` to clear the stale `true`. Call this
     * at the top of any effect that schedules callbacks via `push`.
     */
    const reset = useCallback(() => {
        cancelledRef.current = false;
    }, []);

    // Unmount safety net: cancel any timers the caller forgot to clear.
    //
    // IMPORTANT: this cleanup only clears timers — it must NOT flip
    // `cancelledRef.current = true`. That flag is owned by the CONSUMER's
    // effect lifecycle (the consumer sets it in its own cleanup and clears it
    // via `reset()` on re-run). Under React StrictMode, this internal effect
    // also double-invokes: its cleanup runs, then it re-mounts. If this
    // cleanup set `cancelledRef = true`, the re-mount would leave the flag
    // `true` (there is no `reset()` here), and because effect re-runs are
    // ordered, this internal cleanup can fire AFTER the consumer's `reset()`
    // — clobbering the flag back to `true` so every scheduled callback bails
    // and the terminal animation never starts (the root cause of the
    // "terminal content never loads" bug). The consumer already sets
    // `cancelledRef = true` in its own cleanup, so clearing timers here is
    // sufficient.
    useEffect(() => {
        return () => {
            clearAll();
        };
    }, [clearAll]);

    return { push, clearAll, reset, cancelledRef };
}
