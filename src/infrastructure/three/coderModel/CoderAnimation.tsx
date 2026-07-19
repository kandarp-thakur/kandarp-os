"use client";

import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

import { useMouse } from "../hooks/useMouse";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { DeviceTier } from "../types";

/**
 * CoderAnimation — the living motion of the Kandarp OS mascot.
 *
 * Design contract (task §Animation + arch §15):
 *  - The figure never stops moving, but the motion is calm and very slow.
 *  - **Breathing** — a subtle scale pulse on the torso (chest rises + falls).
 *    Period ~4s.
 *  - **Subtle floating** — a gentle vertical bob of the whole figure. Period
 *    ~8s. The figure "hovers" slightly.
 *  - **Eye movement** — the irises drift slowly (saccades) + track the mouse
 *    a touch so the gaze feels alive + intelligent.
 *  - **Subtle blinking** — the eyelids close briefly at a natural, irregular
 *    cadence (every ~4–6s, with a fast close + slower open).
 *  - **Slight cloth movement** — the hair + jacket collar + sleeves sway a
 *    touch in response to the float + a slow ambient breeze.
 *  - **Hand reach** — the raised (right) hand drifts subtly toward the
 *    holograms (a slow "interacting" motion), so the figure reads as
 *    controlling the engineering UI. The left hand rests in a jacket pocket
 *    (heavily dampened) when `leftArmPocket` is set.
 *  - **Mouse body rotation** — the whole figure rotates slightly around Y
 *    toward where the user looks, plus a tiny tilt. Smooth, frame-rate
 *    independent damping. Never snaps.
 *  - `prefers-reduced-motion` freezes the figure: it holds a static, composed
 *    pose (arch §15.10). Still visible — just still.
 *
 * Implementation:
 *  - All motion is driven from a single `useFrame` loop writing directly to the
 *    group transforms — no React re-renders per frame (arch §15.5).
 *  - Motion is composed of independent sine layers at different periods so it
 *    never reads as mechanical.
 *  - Blinking uses a scheduled timer (not a sine) so the cadence is irregular +
 *    natural; the eyelid position is a quick ease-in / slow ease-out.
 *  - Mouse rotation + gaze are damped toward the smoothed pointer (mouse bus).
 *
 * The component renders nothing visible; it attaches to the target group refs
 * passed by the parent ([`CoderModel`](./CoderModel.tsx)).
 */

export interface CoderAnimationProps {
    /** The outer group whose Y rotation this animation drives (mouse body
     *  rotation + sway). Its `userData.baseRotationY` is respected. */
    targetRef: React.RefObject<THREE.Group | null>;
    /** The root group that floats (vertical bob). */
    rootRef: React.RefObject<THREE.Group | null>;
    /** The torso group that breathes (scale pulse). */
    torsoRef: React.RefObject<THREE.Group | null>;
    /** The head group that tilts slightly with the mouse. */
    headRef: React.RefObject<THREE.Group | null>;
    /** The hair group that sways with the float + breeze. */
    hairRef: React.RefObject<THREE.Group | null>;
    /** The jacket collar group that sways with the float + breeze. */
    collarRef: React.RefObject<THREE.Group | null>;
    /** The left arm group (reaches toward a hologram). */
    leftArmRef: React.RefObject<THREE.Group | null>;
    /** The right arm group (reaches toward a hologram). */
    rightArmRef: React.RefObject<THREE.Group | null>;
    /** The left hand group (subtle finger/hand motion). */
    leftHandRef: React.RefObject<THREE.Group | null>;
    /** The right hand group (subtle finger/hand motion). */
    rightHandRef: React.RefObject<THREE.Group | null>;
    /** The eyelids group (blinks). */
    eyelidsRef: React.RefObject<THREE.Group | null>;
    /** The eyes group (gaze / saccades). */
    eyesRef: React.RefObject<THREE.Group | null>;
    /** Device tier — low tiers reduce motion amplitude (arch §11). */
    tier?: DeviceTier;
    /**
     * When true the left arm rests in a jacket pocket — its reach + hand motion
     * are heavily dampened so it reads as a relaxed pocket hand, not a working
     * one. Default false.
     */
    leftArmPocket?: boolean;
    /** Sway speed multiplier. Default 1 (very slow ambient breeze). */
    swaySpeed?: number;
    /** Floating bob amplitude in world units. Default 0.05. */
    floatAmplitude?: number;
    /** Breathing scale amplitude (chest rise). Default 0.012. */
    breathAmplitude?: number;
    /** Max Y rotation from mouse in radians. Default 0.22 (~13°). */
    rotationAmplitude?: number;
    /** Max head tilt from mouse in radians. Default 0.1 (~6°). */
    tiltAmplitude?: number;
    /** Damping factor for the mouse rotation (0–1). Lower = smoother/slower. */
    rotationSmoothing?: number;
}

/** Per-tier motion amplitude multiplier — low tiers move less. */
const TIER_AMP: Record<DeviceTier, number> = {
    high: 1,
    medium: 0.8,
    low: 0.5,
    off: 0,
};

/** Sway range (radians) — the hair/hood oscillate ±this around rest. */
const SWAY_RANGE = 0.05;

/** Blink timing (seconds). Natural irregular cadence. */
const BLINK_MIN_INTERVAL = 3.5;
const BLINK_MAX_INTERVAL = 6.5;
/** Blink duration (close + open). Fast close, slower open. */
const BLINK_DURATION = 0.18;

/** Smoothstep easing for the blink eyelid travel. */
function smoothstep(x: number): number {
    const c = Math.max(0, Math.min(1, x));
    return c * c * (3 - 2 * c);
}

function CoderAnimationImpl({
    targetRef,
    rootRef,
    torsoRef,
    headRef,
    hairRef,
    collarRef,
    leftArmRef,
    rightArmRef,
    leftHandRef,
    rightHandRef,
    eyelidsRef,
    eyesRef,
    tier = "high",
    leftArmPocket = false,
    swaySpeed = 1,
    floatAmplitude = 0.05,
    breathAmplitude = 0.012,
    rotationAmplitude = 0.22,
    tiltAmplitude = 0.1,
    rotationSmoothing = 0.05,
}: CoderAnimationProps) {
    const reducedMotion = useReducedMotion();
    const { stateRef: mouseStateRef } = useMouse();

    // Smoothed rotation/tilt/gaze targets — damped toward the mouse so the
    // motion eases. Held in refs (no per-frame React state).
    const rotY = useRef(0);
    const tiltX = useRef(0);
    const tiltZ = useRef(0);
    const gazeX = useRef(0);
    const gazeY = useRef(0);

    // Blink scheduler — next blink time + current blink progress (0 = open,
    // 1 = closed). Reset on mount.
    const blink = useRef({
        nextAt: 2 + Math.random() * 2,
        progress: 0,
        closing: false,
    });

    // Seed the phase offsets once so the motion doesn't start at zero and the
    // layers stay out of sync (never reads as mechanical).
    const phase = useRef({
        sway: Math.random() * Math.PI * 2,
        float: Math.random() * Math.PI * 2,
        breath: Math.random() * Math.PI * 2,
        breeze: Math.random() * Math.PI * 2,
        saccadeX: Math.random() * Math.PI * 2,
        saccadeY: Math.random() * Math.PI * 2,
        reachL: Math.random() * Math.PI * 2,
        reachR: Math.random() * Math.PI * 2,
    });

    // Accumulated time (seconds) for the blink scheduler — independent of the
    // sine phases so blinks stay irregular.
    const elapsed = useRef(0);

    useFrame((_, delta) => {
        const group = targetRef.current;
        if (!group) return;

        // Clamp delta so a backgrounded tab doesn't fast-forward the motion.
        const dt = Math.min(delta, 0.05);
        const amp = TIER_AMP[tier];

        if (reducedMotion) {
            // Frozen pose: hold a gentle, static tilt so the figure still looks
            // composed (not dead-flat). Eyes open, hands at rest reach.
            group.rotation.set(0.02, group.userData.baseRotationY ?? 0, 0.01);
            const root = rootRef.current;
            if (root) root.position.y = 0;
            const torso = torsoRef.current;
            if (torso) torso.scale.setScalar(1);
            const head = headRef.current;
            if (head) head.rotation.set(0, 0, 0);
            const hair = hairRef.current;
            if (hair) hair.rotation.set(0, 0, 0);
            const collar = collarRef.current;
            if (collar) collar.rotation.set(0, 0, 0);
            const eyelids = eyelidsRef.current;
            if (eyelids) eyelids.position.y = 0;
            const eyes = eyesRef.current;
            if (eyes) eyes.rotation.set(0, 0, 0);
            return;
        }

        elapsed.current += dt;
        const t = performance.now() * 0.001;
        const ph = phase.current;

        /* Gentle floating — vertical sine bob of the whole figure. Period
           ~8s, very calm. The figure "hovers" slightly. */
        const float = Math.sin(t * 0.8 + ph.float) * floatAmplitude * amp;
        const root = rootRef.current;
        if (root) root.position.y = float;

        /* Idle breathing — a subtle scale pulse on the torso (chest rises +
           falls). Period ~4s. Only the Y scale breathes so the shoulders
           don't widen — it reads as a chest expansion, not a growth. */
        const breath =
            1 + Math.sin(t * 1.6 + ph.breath) * breathAmplitude * amp;
        const torso = torsoRef.current;
        if (torso) torso.scale.set(1, breath, 1);

        /* Hair + hoodie reaction — a slow ambient breeze sway, modulated by
           the float so the hair reacts slightly to the figure's motion (the
           "cloth movement" cue). Two layers at different periods. */
        const breeze =
            Math.sin(t * 0.5 * swaySpeed + ph.breeze) * SWAY_RANGE * amp;
        const floatReact =
            Math.sin(t * 0.8 + ph.float) * SWAY_RANGE * 0.4 * amp;
        const swayZ = breeze + floatReact;
        const swayX =
            Math.sin(t * 0.43 * swaySpeed + ph.sway) * SWAY_RANGE * 0.6 * amp;
        const hair = hairRef.current;
        if (hair) hair.rotation.set(swayX, 0, swayZ);
        const collar = collarRef.current;
        if (collar) collar.rotation.set(swayX * 0.6, 0, swayZ * 0.6);

        /* Hand reach — the raised hands drift subtly toward the holograms
           (a slow "interacting" motion). Each hand has its own phase so they
           don't move in sync. The reach is a tiny rotation around the arm
           group's pivot + a small hand-group offset — reads as the fingers
           "working" the UI. */
        // The left arm rests in a jacket pocket — dampen its reach so it reads
        // as a relaxed hand, not a working one.
        const pocketDamp = leftArmPocket ? 0.15 : 1;
        const reachL = Math.sin(t * 0.6 + ph.reachL) * 0.06 * amp * pocketDamp;
        const reachR = Math.sin(t * 0.55 + ph.reachR + 1.3) * 0.06 * amp;
        const leftArm = leftArmRef.current;
        if (leftArm) {
            // Compose on top of the base arm rotation (set in JSX) by nudging
            // the X + Z a touch. We read the base from userData so we don't
            // overwrite the parent's pose.
            const base = leftArm.userData.baseRot as
                [number, number, number] | undefined;
            const bx = base?.[0] ?? 1.25;
            const by = base?.[1] ?? 0.1;
            const bz = base?.[2] ?? 0.32;
            leftArm.rotation.set(bx + reachL, by, bz + reachL * 0.5);
        }
        const rightArm = rightArmRef.current;
        if (rightArm) {
            const base = rightArm.userData.baseRot as
                [number, number, number] | undefined;
            const bx = base?.[0] ?? 1.25;
            const by = base?.[1] ?? -0.1;
            const bz = base?.[2] ?? -0.32;
            rightArm.rotation.set(bx + reachR, by, bz - reachR * 0.5);
        }
        // Subtle hand "working" — a tiny rotation on each hand group.
        const leftHand = leftHandRef.current;
        if (leftHand)
            leftHand.rotation.x =
                Math.sin(t * 1.1 + ph.reachL) *
                0.05 *
                amp *
                (leftArmPocket ? 0.1 : 1);
        const rightHand = rightHandRef.current;
        if (rightHand)
            rightHand.rotation.x = Math.sin(t * 1.0 + ph.reachR) * 0.05 * amp;

        /* Eye movement — slow saccades (drift) + mouse tracking. The irises
           (children of eyesRef) shift via a small group rotation so the gaze
           feels alive + intelligent. */
        const saccadeX = Math.sin(t * 0.31 + ph.saccadeX) * 0.12 * amp;
        const saccadeY = Math.sin(t * 0.27 + ph.saccadeY) * 0.08 * amp;
        const mouse = mouseStateRef.current.smoothed;
        const targetGazeX = mouse.x * 0.12 * amp + saccadeX;
        const targetGazeY = -mouse.y * 0.08 * amp + saccadeY;
        const gf = 1 - Math.pow(1 - 0.08, dt * 60);
        gazeX.current += (targetGazeX - gazeX.current) * gf;
        gazeY.current += (targetGazeY - gazeY.current) * gf;
        const eyes = eyesRef.current;
        if (eyes) eyes.rotation.set(gazeY.current, gazeX.current, 0);

        /* Subtle blinking — a scheduled, irregular blink. The eyelids slide
           down (close) fast + up (open) slower. We drive the eyelids group's
           Y position (the lids sit just above the eyes at rest; lowering them
           covers the eyes). */
        const b = blink.current;
        b.nextAt -= dt;
        if (b.nextAt <= 0 && !b.closing && b.progress === 0) {
            b.closing = true;
        }
        if (b.closing) {
            // Close phase (0 → 1) over half the duration, then open (1 → 0).
            b.progress += dt / BLINK_DURATION;
            if (b.progress >= 1) {
                b.progress = 0;
                b.closing = false;
                b.nextAt =
                    BLINK_MIN_INTERVAL +
                    Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL);
            }
        }
        // Eyelid travel: 0 (open) → -0.03 (closed). Fast close, slow open via
        // an asymmetric smoothstep on the two halves.
        let lidY = 0;
        if (b.closing) {
            const p = b.progress;
            if (p < 0.5) {
                // Close — quick ease-in.
                lidY = -0.03 * smoothstep(p / 0.5);
            } else {
                // Open — slower ease-out.
                lidY = -0.03 * (1 - smoothstep((p - 0.5) / 0.5));
            }
        }
        const eyelids = eyelidsRef.current;
        if (eyelids) eyelids.position.y = lidY * amp;

        /* Mouse body rotation — the whole figure rotates around Y toward
           where the user looks, plus a tiny tilt. Damped toward the smoothed
           pointer so it eases, never snaps. */
        const targetRotY = mouse.x * rotationAmplitude * amp;
        const targetTiltX = mouse.y * tiltAmplitude * amp;
        const targetTiltZ = -mouse.x * tiltAmplitude * 0.5 * amp;

        // Frame-rate independent damping.
        const f = 1 - Math.pow(1 - rotationSmoothing, dt * 60);
        rotY.current += (targetRotY - rotY.current) * f;
        tiltX.current += (targetTiltX - tiltX.current) * f;
        tiltZ.current += (targetTiltZ - tiltZ.current) * f;

        // Compose: base rotationY (set by the parent) + mouse rotation.
        group.rotation.y = (group.userData.baseRotationY ?? 0) + rotY.current;
        group.rotation.x = tiltX.current;
        group.rotation.z = tiltZ.current;

        // Head tilts a touch more than the body — the figure "looks" toward the
        // cursor (subtle, never exaggerated). The gaze (eye rotation) is
        // handled separately above.
        const head = headRef.current;
        if (head) {
            head.rotation.x = tiltX.current * 0.6;
            head.rotation.y = rotY.current * 0.3;
        }
    });

    // Nothing renders — this is a frame-loop side effect.
    return null;
}

/**
 * Memoized CoderAnimation. The component's output depends only on its props
 * (all stable across re-renders once the tier resolves) — it renders `null`
 * and only registers a `useFrame` callback. Without `memo`, the parent
 * CoderModel's re-renders would re-register the frame callback unnecessarily
 * (task §Performance: "React optimization — memo").
 */
export const CoderAnimation = memo(CoderAnimationImpl);

CoderAnimation.displayName = "CoderAnimation";
