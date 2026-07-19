"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { CoderAnimation } from "./CoderAnimation";
import type { DeviceTier } from "../types";

/**
 * CoderModel — the signature mascot of Kandarp OS (premium editorial redesign).
 *
 * This is NOT the old toy-like hoodie blob. It is a from-scratch, collectible-
 * sculpture-quality stylized human — the visual identity of a premium
 * engineering company. When someone sees it they should instantly think:
 * Engineering · DevOps · Cloud · Infrastructure · Modern Technology.
 *
 * Design language (task §Design Language): Apple / Nothing / Linear / Vercel /
 * Arc / Raycast / GitHub / Docker Desktop / Cloudflare. The figure belongs
 * inside those products — an expensive collectible sculpture, not a game
 * asset.
 *
 * Character (task §Character + §Face + §Hair + §Outfit):
 *  - **Proportions** — natural human proportions, athletic build, mature
 *    (late 20s–30s). No oversized head, no tiny legs, no toy body, no chibi.
 *    Realistic with subtle stylization.
 *  - **Face** — strong jawline, defined cheekbones, sharp but friendly eyes,
 *    natural eyebrows, a short well-groomed beard, a slight confident smile.
 *    Mature, intelligent, professional.
 *  - **Hair** — modern textured hairstyle with a clean fade, natural volume.
 *    No anime spikes.
 *  - **Outfit** — premium modern techwear: black turtleneck (high collar) +
 *    a minimal open bomber jacket (graphite, ribbed cuffs + hem) + dark
 *    trousers + premium low-profile sneakers. A simple smartwatch. No armor,
 *    capes, helmets, or oversized accessories.
 *  - **Accessories** — minimal: round glasses + smartwatch. No gaming headset,
 *    no oversized gadgets.
 *
 * Pose (task §Pose): relaxed and confident, standing naturally. The **left
 * hand rests in the jacket pocket**; the **right hand is raised and
 * interacts with floating holographic DevOps interfaces**. No T-pose, no
 * superhero pose.
 *
 * Props (task §Props): the holographic engineering UI (terminal, git, docker,
 * CI/CD, topology, cloud, metrics) floats around the figure — owned by
 * [`CoderProps`](./CoderProps.tsx). The model exposes refs the animation uses
 * to make the right hand "reach" toward the holograms (the left hand stays
 * relaxed in the pocket).
 *
 * Materials (task §Materials): premium. Matte fabric (turtleneck + jacket +
 * trousers), soft realistic skin, minimal brushed metal (watch + glasses
 * frame + jacket zipper), glass lenses. No plastic look, no glossy toy
 * finish. Per-tier roughness/metalness scaling (arch §11).
 *
 * Animation (task §Animation): breathing, eye movement, subtle blinking, slight
 * hair/collar movement, hologram reaction — all driven by
 * [`CoderAnimation`](./CoderAnimation.tsx). `prefers-reduced-motion` freezes
 * the figure (arch §15.10).
 *
 * Built entirely from primitive geometries (no external GLB asset) so it is
 * zero-network-weight and instant to mount. Materials are shared (skin /
 * turtleneck / jacket / jacketRib / trouser / shoe / sole / hair / beard /
 * glass / metal / accent / watch) so the figure is a small, draw-call-friendly
 * set.
 *
 * @example
 * ```tsx
 * <Canvas3D lightingPreset="soft" enableControls={false}>
 *   <CoderModel tier="high" />
 * </Canvas3D>
 * ```
 */
export interface CoderModelProps {
    /** Device tier — scales material path (arch §11). Default "high". */
    tier?: DeviceTier;
    /** Overall scale multiplier. Default 1. */
    scale?: number;
    /** Position offset [x, y, z]. Default centered at origin. */
    position?: [number, number, number];
    /** Rotation around Y in radians. Default 0 (facing camera). */
    rotationY?: number;
    /** Accent color for the holographic glow + rim + smartwatch.
     *  Defaults to the brand Docker Blue. */
    accentColor?: THREE.ColorRepresentation;
}

/** Per-tier material roughness — lower tiers get a flatter, cheaper look. */
const TIER_ROUGHNESS: Record<DeviceTier, number> = {
    high: 0.66,
    medium: 0.74,
    low: 0.85,
    off: 0.92,
};

/** Per-tier metalness for the minimal metal accents (watch, glasses, zipper). */
const TIER_METAL: Record<DeviceTier, number> = {
    high: 0.7,
    medium: 0.55,
    low: 0.4,
    off: 0.3,
};

function CoderModelImpl({
    tier = "high",
    scale = 1,
    position = [0, 0, 0],
    rotationY = 0,
    accentColor = "#2496ED",
}: CoderModelProps) {
    const groupRef = useRef<THREE.Group>(null);
    const rootRef = useRef<THREE.Group>(null);
    const torsoRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);
    const hairRef = useRef<THREE.Group>(null);
    const collarRef = useRef<THREE.Group>(null);
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const leftHandRef = useRef<THREE.Group>(null);
    const rightHandRef = useRef<THREE.Group>(null);
    const eyelidsRef = useRef<THREE.Group>(null);
    const eyesRef = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.PointLight>(null);

    // --- Shared materials (memoized → small, draw-call-friendly set) ---
    const rough = TIER_ROUGHNESS[tier];
    const metal = TIER_METAL[tier];

    // Turtleneck — deep matte black, soft fine-knit fabric.
    const turtleneckMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#0e0f14"),
            roughness: Math.max(rough - 0.04, 0.4),
            metalness: 0.02,
        });
    }, [rough]);

    // Bomber jacket shell — graphite, matte technical fabric.
    const jacketMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#1b1d24"),
            roughness: rough,
            metalness: 0.05,
        });
    }, [rough]);

    // Bomber jacket ribbing (cuffs + hem) — darker, slightly sheen knit.
    const jacketRibMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#101218"),
            roughness: Math.max(rough - 0.08, 0.36),
            metalness: 0.04,
        });
    }, [rough]);

    // Trousers — dark navy-charcoal, matte.
    const trouserMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#1d2029"),
            roughness: Math.min(rough + 0.04, 1),
            metalness: 0.05,
        });
    }, [rough]);

    // Sneakers — near-black upper + matte white sole.
    const shoeMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#0c0d12"),
            roughness: Math.min(rough + 0.06, 1),
            metalness: 0.08,
        });
    }, [rough]);

    const soleMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#e8eaf0"),
            roughness: 0.5,
            metalness: 0.0,
        });
    }, []);

    // Skin — warm, soft, natural. Slightly desaturated for a mature read.
    const skinMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#d6a578"),
            roughness: Math.max(rough - 0.14, 0.3),
            metalness: 0.0,
        });
    }, [rough]);

    // Hair — near-black with a subtle cool sheen (modern, slightly textured).
    const hairMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#14151b"),
            roughness: Math.max(rough - 0.18, 0.26),
            metalness: 0.14,
        });
    }, [rough]);

    // Beard — same as hair, slightly softer sheen.
    const beardMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#181920"),
            roughness: Math.max(rough - 0.12, 0.32),
            metalness: 0.1,
        });
    }, [rough]);

    // Glasses frame — minimal brushed metal (dark gunmetal).
    const glassesMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#2a2d36"),
            roughness: 0.38,
            metalness: metal,
        });
    }, [metal]);

    // Glasses lenses — subtle tinted glass, slight transparency.
    const lensMat = useMemo(() => {
        return new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#9fb4d8"),
            roughness: 0.08,
            metalness: 0.0,
            transmission: 0.85,
            transparent: true,
            opacity: 0.32,
            thickness: 0.04,
            ior: 1.5,
            clearcoat: 0.6,
            clearcoatRoughness: 0.2,
        });
    }, []);

    // Accent — smartwatch face + jacket zipper + subtle hologram rim light.
    const accentMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(accentColor as THREE.ColorRepresentation),
            roughness: 0.35,
            metalness: 0.6,
            emissive: new THREE.Color(accentColor as THREE.ColorRepresentation),
            emissiveIntensity: 0.3,
        });
    }, [accentColor]);

    // Watch band — dark matte silicone.
    const watchBandMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#16181e"),
            roughness: 0.6,
            metalness: 0.1,
        });
    }, []);

    // Watch case — minimal brushed metal.
    const watchMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#9aa0ad"),
            roughness: 0.4,
            metalness: metal,
        });
    }, [metal]);

    // Eye — dark iris with a soft wet sheen.
    const eyeMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#1a1c22"),
            roughness: 0.25,
            metalness: 0.0,
        });
    }, []);

    // Eye white (sclera) — warm off-white, not pure white (mature, natural).
    const scleraMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#e9e4dc"),
            roughness: 0.4,
            metalness: 0.0,
        });
    }, []);

    // Eyelid — skin-toned, slightly darker (shadowed).
    const eyelidMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#c89868"),
            roughness: Math.max(rough - 0.1, 0.34),
            metalness: 0.0,
        });
    }, [rough]);

    useEffect(() => {
        return () => {
            turtleneckMat.dispose();
            jacketMat.dispose();
            jacketRibMat.dispose();
            trouserMat.dispose();
            shoeMat.dispose();
            soleMat.dispose();
            skinMat.dispose();
            hairMat.dispose();
            beardMat.dispose();
            glassesMat.dispose();
            lensMat.dispose();
            accentMat.dispose();
            watchBandMat.dispose();
            watchMat.dispose();
            eyeMat.dispose();
            scleraMat.dispose();
            eyelidMat.dispose();
        };
    }, [
        turtleneckMat,
        jacketMat,
        jacketRibMat,
        trouserMat,
        shoeMat,
        soleMat,
        skinMat,
        hairMat,
        beardMat,
        glassesMat,
        lensMat,
        accentMat,
        watchBandMat,
        watchMat,
        eyeMat,
        scleraMat,
        eyelidMat,
    ]);

    // Soft hologram light spilling onto the figure's face + right hand — the
    // "engineering UI" glow. Pulsed gently each frame (the holograms react
    // slowly, task §Animation).
    useFrame((state) => {
        const glow = glowRef.current;
        if (!glow) return;
        const t = state.clock.elapsedTime;
        glow.intensity = 0.55 + Math.sin(t * 1.1) * 0.12;
    });

    // Geometry segment counts scale by tier (arch §11).
    const seg = tier === "high" ? 28 : tier === "medium" ? 20 : 14;

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={[0, rotationY, 0]}
            userData={{ baseRotationY: rotationY }}
            scale={scale}
        >
            {/* Root — the whole figure. The animation floats this group so the
                feet stay grounded relative to the float (the figure "hovers"
                slightly rather than the ground moving). */}
            <group ref={rootRef}>
                {/* ===================== Legs (trousers + sneakers) ===================== */}
                {/* Realistic leg proportions: thigh + shin taper, natural length.
                    The figure stands ~1.8 units tall (head ~0.1 above origin). */}
                {/* Left leg */}
                <group position={[-0.13, -0.95, 0]}>
                    {/* Thigh — upper leg. */}
                    <mesh
                        position={[0, 0.18, 0]}
                        material={trouserMat}
                        castShadow={tier !== "off"}
                    >
                        <capsuleGeometry args={[0.115, 0.34, 8, seg]} />
                    </mesh>
                    {/* Shin — lower leg, slightly tapered. */}
                    <mesh
                        position={[0, -0.22, 0]}
                        material={trouserMat}
                        castShadow={tier !== "off"}
                    >
                        <capsuleGeometry args={[0.095, 0.34, 8, seg]} />
                    </mesh>
                    {/* Knee break — a subtle darker band. */}
                    <mesh position={[0, -0.04, 0]} material={trouserMat}>
                        <cylinderGeometry args={[0.1, 0.1, 0.05, seg]} />
                    </mesh>
                    {/* Sneaker — premium low-profile. Upper + toe + sole. */}
                    <mesh
                        position={[0, -0.46, 0.05]}
                        material={shoeMat}
                        castShadow={tier !== "off"}
                    >
                        <boxGeometry args={[0.15, 0.09, 0.32]} />
                    </mesh>
                    <mesh
                        position={[0, -0.45, 0.18]}
                        material={shoeMat}
                        castShadow={tier !== "off"}
                    >
                        <boxGeometry args={[0.14, 0.07, 0.1]} />
                    </mesh>
                    {/* Sole — a crisp white edge (premium contrast). */}
                    <mesh position={[0, -0.5, 0.05]} material={soleMat}>
                        <boxGeometry args={[0.155, 0.03, 0.34]} />
                    </mesh>
                </group>

                {/* Right leg (mirrored) */}
                <group position={[0.13, -0.95, 0]}>
                    <mesh
                        position={[0, 0.18, 0]}
                        material={trouserMat}
                        castShadow={tier !== "off"}
                    >
                        <capsuleGeometry args={[0.115, 0.34, 8, seg]} />
                    </mesh>
                    <mesh
                        position={[0, -0.22, 0]}
                        material={trouserMat}
                        castShadow={tier !== "off"}
                    >
                        <capsuleGeometry args={[0.095, 0.34, 8, seg]} />
                    </mesh>
                    <mesh position={[0, -0.04, 0]} material={trouserMat}>
                        <cylinderGeometry args={[0.1, 0.1, 0.05, seg]} />
                    </mesh>
                    <mesh
                        position={[0, -0.46, 0.05]}
                        material={shoeMat}
                        castShadow={tier !== "off"}
                    >
                        <boxGeometry args={[0.15, 0.09, 0.32]} />
                    </mesh>
                    <mesh
                        position={[0, -0.45, 0.18]}
                        material={shoeMat}
                        castShadow={tier !== "off"}
                    >
                        <boxGeometry args={[0.14, 0.07, 0.1]} />
                    </mesh>
                    <mesh position={[0, -0.5, 0.05]} material={soleMat}>
                        <boxGeometry args={[0.155, 0.03, 0.34]} />
                    </mesh>
                </group>

                {/* ===================== Torso (turtleneck + bomber jacket) ===================== */}
                <group ref={torsoRef}>
                    {/* Turtleneck body — the base layer, a tapered capsule.
                        Slightly slimmer than the old hoodie (the jacket adds
                        the outer volume). */}
                    <mesh
                        position={[0, -0.18, 0]}
                        material={turtleneckMat}
                        castShadow={tier !== "off"}
                        receiveShadow={tier !== "off"}
                    >
                        <capsuleGeometry args={[0.27, 0.46, 8, seg]} />
                    </mesh>
                    {/* Shoulders — a soft cap so the turtleneck reads as fabric
                        under the jacket. */}
                    <mesh
                        position={[0, 0.1, 0]}
                        material={turtleneckMat}
                        castShadow={tier !== "off"}
                    >
                        <sphereGeometry
                            args={[
                                0.33,
                                seg,
                                14,
                                0,
                                Math.PI * 2,
                                0,
                                Math.PI * 0.5,
                            ]}
                        />
                    </mesh>

                    {/* Turtleneck collar — the high folded collar (the signature
                        cue). A short, slightly flared cylinder around the neck. */}
                    <group ref={collarRef} position={[0, 0.18, 0]}>
                        <mesh
                            material={turtleneckMat}
                            castShadow={tier !== "off"}
                        >
                            <cylinderGeometry
                                args={[0.12, 0.135, 0.1, seg, 1, true]}
                            />
                        </mesh>
                        {/* Collar top fold — a thin ring for the folded edge. */}
                        <mesh position={[0, 0.05, 0]} material={turtleneckMat}>
                            <torusGeometry args={[0.122, 0.012, 8, seg]} />
                        </mesh>
                    </group>

                    {/* ===================== Bomber jacket (open front) ===================== */}
                    {/* The jacket shell — slightly larger than the turtleneck so
                        it reads as a worn outer layer. Open at the front (the
                        turtleneck shows through the gap). */}
                    {/* Jacket body — a tapered capsule, a touch wider + shorter
                        than the turtleneck so the hem sits at the waist. */}
                    <mesh
                        position={[0, -0.2, 0]}
                        material={jacketMat}
                        castShadow={tier !== "off"}
                    >
                        <capsuleGeometry args={[0.31, 0.4, 8, seg]} />
                    </mesh>
                    {/* Jacket shoulders — a soft cap, slightly wider than the
                        turtleneck shoulders (the bomber's structured shoulder). */}
                    <mesh
                        position={[0, 0.08, 0]}
                        material={jacketMat}
                        castShadow={tier !== "off"}
                    >
                        <sphereGeometry
                            args={[
                                0.37,
                                seg,
                                14,
                                0,
                                Math.PI * 2,
                                0,
                                Math.PI * 0.5,
                            ]}
                        />
                    </mesh>
                    {/* Jacket lapels / front opening — two angled panels that
                        leave a V gap down the center (the turtleneck shows
                        through). Left front panel. */}
                    <mesh
                        position={[-0.16, -0.12, 0.27]}
                        rotation={[0.1, 0.18, 0.04]}
                        material={jacketMat}
                        castShadow={tier !== "off"}
                    >
                        <boxGeometry args={[0.2, 0.42, 0.06]} />
                    </mesh>
                    {/* Right front panel. */}
                    <mesh
                        position={[0.16, -0.12, 0.27]}
                        rotation={[0.1, -0.18, -0.04]}
                        material={jacketMat}
                        castShadow={tier !== "off"}
                    >
                        <boxGeometry args={[0.2, 0.42, 0.06]} />
                    </mesh>
                    {/* Jacket hem ribbing — the signature bomber waistband. A
                        slightly wider, darker ring at the bottom of the jacket. */}
                    <mesh
                        position={[0, -0.42, 0]}
                        material={jacketRibMat}
                        castShadow={tier !== "off"}
                    >
                        <cylinderGeometry args={[0.315, 0.315, 0.08, seg]} />
                    </mesh>
                    {/* Jacket collar — a subtle stand collar behind the neck
                        (the bomber's collar, open). */}
                    <mesh
                        position={[0, 0.14, -0.04]}
                        rotation={[0.1, 0, 0]}
                        material={jacketMat}
                        castShadow={tier !== "off"}
                    >
                        <cylinderGeometry
                            args={[0.16, 0.17, 0.08, seg, 1, true]}
                        />
                    </mesh>
                    {/* Jacket zipper — a thin accent line down the front (open,
                        so it's a short accent at the hem). */}
                    <mesh position={[0, -0.36, 0.31]} material={accentMat}>
                        <boxGeometry args={[0.012, 0.1, 0.006]} />
                    </mesh>
                    {/* Zipper pull — a small accent tab. */}
                    <mesh position={[0, -0.42, 0.32]} material={accentMat}>
                        <boxGeometry args={[0.025, 0.04, 0.01]} />
                    </mesh>
                </group>

                {/* ===================== Arms ===================== */}
                {/* LEFT arm — relaxed, hand in the jacket pocket. The arm hangs
                    naturally at the side with a slight bend; the hand tucks
                    into the jacket's side pocket. The animation dampens this
                    arm's reach (leftArmPocket) so it reads as a relaxed pocket
                    hand, not a working one. */}
                <group
                    ref={leftArmRef}
                    position={[-0.34, 0.06, 0.02]}
                    rotation={[0.12, 0.06, 0.06]}
                    userData={{ baseRot: [0.12, 0.06, 0.06] }}
                >
                    {/* Upper arm — jacket sleeve. */}
                    <mesh
                        position={[0, -0.16, 0]}
                        material={jacketMat}
                        castShadow={tier !== "off"}
                    >
                        <capsuleGeometry args={[0.092, 0.26, 6, seg]} />
                    </mesh>
                    {/* Elbow — a soft joint. */}
                    <mesh position={[0, -0.3, 0]} material={jacketMat}>
                        <sphereGeometry args={[0.092, 12, 10]} />
                    </mesh>
                    {/* Forearm — sleeve, bent slightly forward into the pocket. */}
                    <group rotation={[0.5, 0, 0.04]}>
                        <mesh
                            position={[0, -0.14, 0]}
                            material={jacketMat}
                            castShadow={tier !== "off"}
                        >
                            <capsuleGeometry args={[0.078, 0.22, 6, seg]} />
                        </mesh>
                        {/* Sleeve cuff ribbing — the bomber's ribbed cuff. */}
                        <mesh position={[0, -0.26, 0]} material={jacketRibMat}>
                            <cylinderGeometry args={[0.08, 0.08, 0.05, seg]} />
                        </mesh>
                        {/* Wrist + hand group (the pocket hand). */}
                        <group ref={leftHandRef} position={[0, -0.3, 0.04]}>
                            {/* Wrist — skin (just past the cuff). */}
                            <mesh
                                material={skinMat}
                                castShadow={tier !== "off"}
                            >
                                <cylinderGeometry
                                    args={[0.05, 0.055, 0.05, 10]}
                                />
                            </mesh>
                            {/* Smartwatch — band + case on the left wrist. */}
                            <mesh
                                position={[0, 0, 0.05]}
                                material={watchBandMat}
                            >
                                <boxGeometry args={[0.075, 0.05, 0.03]} />
                            </mesh>
                            <mesh position={[0, 0, 0.07]} material={watchMat}>
                                <boxGeometry args={[0.06, 0.045, 0.025]} />
                            </mesh>
                            <mesh position={[0, 0, 0.085]} material={accentMat}>
                                <boxGeometry args={[0.04, 0.03, 0.005]} />
                            </mesh>
                            {/* Hand — tucked into the jacket pocket. A relaxed
                                fist shape (fingers curled, thumb alongside)
                                partly hidden inside the jacket hem. */}
                            <mesh
                                position={[0, -0.05, 0.06]}
                                rotation={[0.5, 0, 0]}
                                material={skinMat}
                                castShadow={tier !== "off"}
                            >
                                <boxGeometry args={[0.07, 0.05, 0.08]} />
                            </mesh>
                            {/* Curled fingers — a single rounded block (relaxed
                                fist, not detailed — it's mostly inside the
                                pocket). */}
                            <mesh
                                position={[0, -0.08, 0.1]}
                                rotation={[0.6, 0, 0]}
                                material={skinMat}
                            >
                                <capsuleGeometry args={[0.03, 0.05, 6, 10]} />
                            </mesh>
                        </group>
                    </group>
                </group>

                {/* RIGHT arm — raised forward + slightly out, reaching a
                    hologram on the figure's right (camera-left). The hand is
                    open, interacting with the floating DevOps interfaces. The
                    animation adds subtle reach + finger motion so the
                    interaction reads as live. */}
                <group
                    ref={rightArmRef}
                    position={[0.34, 0.06, 0.02]}
                    rotation={[1.25, -0.1, -0.32]}
                    userData={{ baseRot: [1.25, -0.1, -0.32] }}
                >
                    {/* Upper arm — jacket sleeve. */}
                    <mesh
                        position={[0, -0.16, 0]}
                        material={jacketMat}
                        castShadow={tier !== "off"}
                    >
                        <capsuleGeometry args={[0.092, 0.26, 6, seg]} />
                    </mesh>
                    {/* Elbow — a soft joint. */}
                    <mesh position={[0, -0.3, 0]} material={jacketMat}>
                        <sphereGeometry args={[0.092, 12, 10]} />
                    </mesh>
                    {/* Forearm — sleeve, raised forward. */}
                    <group rotation={[0.7, 0, 0.1]}>
                        <mesh
                            position={[0, -0.14, 0]}
                            material={jacketMat}
                            castShadow={tier !== "off"}
                        >
                            <capsuleGeometry args={[0.078, 0.22, 6, seg]} />
                        </mesh>
                        {/* Sleeve cuff ribbing. */}
                        <mesh position={[0, -0.26, 0]} material={jacketRibMat}>
                            <cylinderGeometry args={[0.08, 0.08, 0.05, seg]} />
                        </mesh>
                        {/* Wrist + hand group (the reaching hand). */}
                        <group ref={rightHandRef} position={[0, -0.32, 0]}>
                            {/* Wrist — skin. */}
                            <mesh
                                material={skinMat}
                                castShadow={tier !== "off"}
                            >
                                <cylinderGeometry
                                    args={[0.05, 0.055, 0.06, 10]}
                                />
                            </mesh>
                            {/* Palm — an open hand reaching forward. */}
                            <mesh
                                position={[0, -0.06, 0.02]}
                                rotation={[0.4, 0, 0]}
                                material={skinMat}
                                castShadow={tier !== "off"}
                            >
                                <boxGeometry args={[0.07, 0.04, 0.09]} />
                            </mesh>
                            {/* Fingers — four slim capsules (relaxed, slightly
                                curled — "interacting", not a fist). */}
                            {[-0.025, -0.008, 0.009, 0.026].map((fx, i) => (
                                <mesh
                                    key={`rf-${i}`}
                                    position={[fx, -0.1, 0.06]}
                                    rotation={[0.5, 0, 0]}
                                    material={skinMat}
                                    castShadow={tier !== "off"}
                                >
                                    <capsuleGeometry
                                        args={[0.012, 0.05, 4, 8]}
                                    />
                                </mesh>
                            ))}
                            {/* Thumb — offset to the side. */}
                            <mesh
                                position={[0.045, -0.05, 0.0]}
                                rotation={[0.2, 0, -0.9]}
                                material={skinMat}
                                castShadow={tier !== "off"}
                            >
                                <capsuleGeometry args={[0.013, 0.04, 4, 8]} />
                            </mesh>
                        </group>
                    </group>
                </group>

                {/* ===================== Head + face (mature, confident) ===================== */}
                <group ref={headRef} position={[0, 0.44, 0]}>
                    {/* Neck — a short cylinder, natural thickness. */}
                    <mesh
                        position={[0, -0.16, 0]}
                        material={skinMat}
                        castShadow={tier !== "off"}
                    >
                        <cylinderGeometry args={[0.075, 0.09, 0.14, 12]} />
                    </mesh>

                    {/* Head — natural human proportions (slightly taller than
                        wide, mature). NOT an oversized sphere. */}
                    <mesh
                        position={[0, 0, 0]}
                        scale={[0.92, 1.06, 0.96]}
                        material={skinMat}
                        castShadow={tier !== "off"}
                    >
                        <sphereGeometry args={[0.2, seg, 18]} />
                    </mesh>

                    {/* Jaw + chin — a strong, defined lower face (mature, not
                        childish). Slightly squarer for a strong jawline. */}
                    <mesh
                        position={[0, -0.13, 0.03]}
                        scale={[0.86, 0.6, 0.82]}
                        material={skinMat}
                        castShadow={tier !== "off"}
                    >
                        <sphereGeometry args={[0.16, 16, 14]} />
                    </mesh>
                    {/* Chin — a subtle forward point for a defined chin. */}
                    <mesh
                        position={[0, -0.17, 0.16]}
                        scale={[0.5, 0.5, 0.5]}
                        material={skinMat}
                    >
                        <sphereGeometry args={[0.05, 10, 8]} />
                    </mesh>

                    {/* Cheekbones — defined on each side (the "defined
                        cheekbones" cue). */}
                    <mesh
                        position={[-0.11, -0.03, 0.13]}
                        scale={[0.5, 0.6, 0.5]}
                        material={skinMat}
                    >
                        <sphereGeometry args={[0.1, 12, 10]} />
                    </mesh>
                    <mesh
                        position={[0.11, -0.03, 0.13]}
                        scale={[0.5, 0.6, 0.5]}
                        material={skinMat}
                    >
                        <sphereGeometry args={[0.1, 12, 10]} />
                    </mesh>

                    {/* Nose — a refined, natural nose (bridge + tip), not a
                        cartoon wedge. */}
                    <mesh
                        position={[0, -0.03, 0.19]}
                        scale={[0.6, 1, 0.7]}
                        material={skinMat}
                    >
                        <capsuleGeometry args={[0.022, 0.06, 4, 8]} />
                    </mesh>
                    <mesh position={[0, -0.07, 0.2]} material={skinMat}>
                        <sphereGeometry args={[0.022, 10, 8]} />
                    </mesh>

                    {/* ===================== Eyes (mature, focused) ===================== */}
                    {/* Natural almond eyes — not exaggerated anime. A sclera +
                        iris + a subtle upper lid. The eyelids blink (driven by
                        the animation via eyelidsRef). */}
                    <group ref={eyesRef}>
                        {/* Left eye socket + sclera. */}
                        <group position={[-0.07, 0.01, 0.16]}>
                            <mesh material={scleraMat}>
                                <sphereGeometry args={[0.026, 12, 10]} />
                            </mesh>
                            {/* Iris — dark, with a soft wet sheen. */}
                            <mesh position={[0, 0, 0.018]} material={eyeMat}>
                                <sphereGeometry args={[0.014, 12, 10]} />
                            </mesh>
                            {/* Pupil highlight — a tiny accent glint (the
                                "intelligent" cue, very subtle). */}
                            <mesh
                                position={[0.004, 0.004, 0.028]}
                                material={accentMat}
                            >
                                <sphereGeometry args={[0.0035, 6, 6]} />
                            </mesh>
                        </group>
                        {/* Right eye socket + sclera. */}
                        <group position={[0.07, 0.01, 0.16]}>
                            <mesh material={scleraMat}>
                                <sphereGeometry args={[0.026, 12, 10]} />
                            </mesh>
                            <mesh position={[0, 0, 0.018]} material={eyeMat}>
                                <sphereGeometry args={[0.014, 12, 10]} />
                            </mesh>
                            <mesh
                                position={[-0.004, 0.004, 0.028]}
                                material={accentMat}
                            >
                                <sphereGeometry args={[0.0035, 6, 6]} />
                            </mesh>
                        </group>
                    </group>

                    {/* Eyelids — thin skin-toned shells that slide down to blink.
                        Driven by the animation (eyelidsRef). At rest they sit
                        just above the eyes (open). */}
                    <group ref={eyelidsRef}>
                        <mesh
                            position={[-0.07, 0.018, 0.165]}
                            rotation={[0.2, 0, 0]}
                            material={eyelidMat}
                        >
                            <sphereGeometry
                                args={[
                                    0.028,
                                    12,
                                    10,
                                    0,
                                    Math.PI * 2,
                                    0,
                                    Math.PI * 0.4,
                                ]}
                            />
                        </mesh>
                        <mesh
                            position={[0.07, 0.018, 0.165]}
                            rotation={[0.2, 0, 0]}
                            material={eyelidMat}
                        >
                            <sphereGeometry
                                args={[
                                    0.028,
                                    12,
                                    10,
                                    0,
                                    Math.PI * 2,
                                    0,
                                    Math.PI * 0.4,
                                ]}
                            />
                        </mesh>
                    </group>

                    {/* Eyebrows — thin, natural arcs (definition, focused). */}
                    <mesh
                        position={[-0.07, 0.05, 0.175]}
                        rotation={[0, 0, -0.08]}
                        material={hairMat}
                    >
                        <boxGeometry args={[0.045, 0.01, 0.012]} />
                    </mesh>
                    <mesh
                        position={[0.07, 0.05, 0.175]}
                        rotation={[0, 0, 0.08]}
                        material={hairMat}
                    >
                        <boxGeometry args={[0.045, 0.01, 0.012]} />
                    </mesh>

                    {/* Mouth — a calm, confident slight smile (a subtle curved
                        line, not a cartoon smile). */}
                    <mesh position={[0, -0.1, 0.185]} material={eyelidMat}>
                        <boxGeometry args={[0.05, 0.008, 0.01]} />
                    </mesh>
                    {/* Lower lip — a subtle fullness. */}
                    <mesh position={[0, -0.115, 0.182]} material={skinMat}>
                        <boxGeometry args={[0.04, 0.012, 0.008]} />
                    </mesh>

                    {/* Ears — two natural shapes on the sides. */}
                    <mesh
                        position={[-0.19, -0.01, 0.0]}
                        rotation={[0, -0.2, 0]}
                        material={skinMat}
                    >
                        <sphereGeometry args={[0.035, 10, 8]} />
                    </mesh>
                    <mesh
                        position={[0.19, -0.01, 0.0]}
                        rotation={[0, 0.2, 0]}
                        material={skinMat}
                    >
                        <sphereGeometry args={[0.035, 10, 8]} />
                    </mesh>

                    {/* ===================== Beard (short, well-groomed) ===================== */}
                    {/* A short, even beard covering the jaw + chin + a thin
                        cheek line. Built as a slightly-larger shell over the
                        lower face so the skin shows through the upper face
                        (mature, professional — not a full lumberjack beard). */}
                    {/* Chin + jaw beard — a shell over the lower face. */}
                    <mesh
                        position={[0, -0.12, 0.02]}
                        scale={[0.88, 0.66, 0.86]}
                        material={beardMat}
                        castShadow={tier !== "off"}
                    >
                        <sphereGeometry
                            args={[
                                0.165,
                                16,
                                12,
                                0,
                                Math.PI * 2,
                                Math.PI * 0.45,
                                Math.PI * 0.55,
                            ]}
                        />
                    </mesh>
                    {/* Mustache — a thin volume under the nose. */}
                    <mesh
                        position={[0, -0.075, 0.17]}
                        rotation={[0.1, 0, 0]}
                        scale={[1, 0.4, 0.6]}
                        material={beardMat}
                    >
                        <sphereGeometry args={[0.05, 12, 10]} />
                    </mesh>
                    {/* Sideburns — thin strips down from the hairline to the
                        jaw (the "clean fade" transition). */}
                    <mesh
                        position={[-0.16, -0.02, 0.06]}
                        scale={[0.3, 1.1, 0.5]}
                        material={beardMat}
                    >
                        <sphereGeometry args={[0.05, 10, 8]} />
                    </mesh>
                    <mesh
                        position={[0.16, -0.02, 0.06]}
                        scale={[0.3, 1.1, 0.5]}
                        material={beardMat}
                    >
                        <sphereGeometry args={[0.05, 10, 8]} />
                    </mesh>

                    {/* ===================== Glasses (round, premium) ===================== */}
                    {/* Minimal round glasses — two thin metal rings + a bridge
                        + subtle temples. The lenses are faintly tinted glass. */}
                    <group position={[0, 0.01, 0.16]}>
                        {/* Left lens ring (frame). */}
                        <mesh position={[-0.07, 0, 0.02]} material={glassesMat}>
                            <torusGeometry args={[0.04, 0.004, 8, 24]} />
                        </mesh>
                        {/* Left lens (glass). */}
                        <mesh position={[-0.07, 0, 0.02]} material={lensMat}>
                            <circleGeometry args={[0.038, 24]} />
                        </mesh>
                        {/* Right lens ring (frame). */}
                        <mesh position={[0.07, 0, 0.02]} material={glassesMat}>
                            <torusGeometry args={[0.04, 0.004, 8, 24]} />
                        </mesh>
                        {/* Right lens (glass). */}
                        <mesh position={[0.07, 0, 0.02]} material={lensMat}>
                            <circleGeometry args={[0.038, 24]} />
                        </mesh>
                        {/* Bridge — a thin bar between the lenses. */}
                        <mesh position={[0, 0, 0.02]} material={glassesMat}>
                            <boxGeometry args={[0.03, 0.006, 0.006]} />
                        </mesh>
                        {/* Temples — thin arms going back to the ears. */}
                        <mesh
                            position={[-0.12, 0, -0.02]}
                            rotation={[0, 0.4, 0]}
                            material={glassesMat}
                        >
                            <boxGeometry args={[0.06, 0.005, 0.005]} />
                        </mesh>
                        <mesh
                            position={[0.12, 0, -0.02]}
                            rotation={[0, -0.4, 0]}
                            material={glassesMat}
                        >
                            <boxGeometry args={[0.06, 0.005, 0.005]} />
                        </mesh>
                    </group>

                    {/* ===================== Hair (modern, textured, clean fade) ===================== */}
                    {/* A modern short-to-medium textured cut with a clean fade
                        on the sides + a swept front fringe + natural volume on
                        top. No unrealistic spikes. */}
                    <group ref={hairRef}>
                        {/* Hair cap — covers the top + back, follows the skull. */}
                        <mesh
                            position={[0, 0.04, -0.01]}
                            scale={[1.04, 1.02, 1.05]}
                            material={hairMat}
                            castShadow={tier !== "off"}
                        >
                            <sphereGeometry
                                args={[
                                    0.2,
                                    seg,
                                    16,
                                    0,
                                    Math.PI * 2,
                                    0,
                                    Math.PI * 0.55,
                                ]}
                            />
                        </mesh>
                        {/* Top volume — a natural, slightly lifted top (the
                            "natural volume" cue). */}
                        <mesh
                            position={[0, 0.12, -0.02]}
                            scale={[1.0, 0.7, 1.0]}
                            material={hairMat}
                            castShadow={tier !== "off"}
                        >
                            <sphereGeometry args={[0.18, 16, 12]} />
                        </mesh>
                        {/* Front fringe — a clean swept volume over the
                            forehead (modern, slightly off-center part). */}
                        <mesh
                            position={[0.02, 0.1, 0.14]}
                            rotation={[0.18, 0.05, 0.04]}
                            scale={[1.02, 0.62, 0.85]}
                            material={hairMat}
                            castShadow={tier !== "off"}
                        >
                            <sphereGeometry args={[0.17, 16, 12]} />
                        </mesh>
                        {/* Clean fade sides — the sides are tight to the head
                            (the "clean fade" cue). Thin, low-volume shells that
                            hug the skull above the ears. */}
                        <mesh
                            position={[-0.17, 0.02, 0.04]}
                            rotation={[0.05, 0.2, -0.12]}
                            scale={[0.32, 0.55, 0.5]}
                            material={hairMat}
                            castShadow={tier !== "off"}
                        >
                            <sphereGeometry args={[0.12, 12, 10]} />
                        </mesh>
                        <mesh
                            position={[0.17, 0.02, 0.04]}
                            rotation={[0.05, -0.2, 0.12]}
                            scale={[0.32, 0.55, 0.5]}
                            material={hairMat}
                            castShadow={tier !== "off"}
                        >
                            <sphereGeometry args={[0.12, 12, 10]} />
                        </mesh>
                        {/* Back volume — the hair at the back of the head. */}
                        <mesh
                            position={[0, 0.0, -0.13]}
                            scale={[1.0, 0.95, 0.85]}
                            material={hairMat}
                            castShadow={tier !== "off"}
                        >
                            <sphereGeometry args={[0.18, 16, 12]} />
                        </mesh>
                        {/* A couple of subtle front strands — modern texture,
                            not spikes. */}
                        <mesh
                            position={[-0.05, 0.16, 0.12]}
                            rotation={[0.25, 0, 0.15]}
                            material={hairMat}
                        >
                            <capsuleGeometry args={[0.018, 0.07, 4, 8]} />
                        </mesh>
                        <mesh
                            position={[0.07, 0.16, 0.1]}
                            rotation={[0.25, 0, -0.2]}
                            material={hairMat}
                        >
                            <capsuleGeometry args={[0.018, 0.07, 4, 8]} />
                        </mesh>
                    </group>
                </group>

                {/* ===================== Hologram glow on the figure ===================== */}
                {/* A soft point light in front of the figure so the holographic
                    UI spills onto the face + right hand — the "engineering UI"
                    glow. The holograms themselves live in CoderProps. */}
                <pointLight
                    ref={glowRef}
                    position={[0, 0.2, 0.7]}
                    color={accentColor}
                    intensity={0.55}
                    distance={2.2}
                    decay={2}
                />
            </group>

            {/* Living motion — breathing + float + eye movement + blinking +
                hair/collar reaction + right-hand reach + mouse body rotation.
                The left arm rests in the pocket (leftArmPocket) so its motion
                is dampened. Frozen under reduced motion (handled inside the
                animation hook). */}
            <CoderAnimation
                targetRef={groupRef}
                rootRef={rootRef}
                torsoRef={torsoRef}
                headRef={headRef}
                hairRef={hairRef}
                collarRef={collarRef}
                leftArmRef={leftArmRef}
                rightArmRef={rightArmRef}
                leftHandRef={leftHandRef}
                rightHandRef={rightHandRef}
                eyelidsRef={eyelidsRef}
                eyesRef={eyesRef}
                tier={tier}
                leftArmPocket
            />
        </group>
    );
}

/**
 * Memoized CoderModel. The figure's output depends only on `tier`, `scale`,
 * `position`, `rotationY`, and `accentColor` — all stable across re-renders
 * once the tier resolves. Memoizing prevents the whole 3D subtree from
 * re-rendering when the host re-renders due to the `frameloop` state change
 * (task §Performance: "React optimization — memo").
 */
export const CoderModel = memo(CoderModelImpl);

CoderModel.displayName = "CoderModel";
