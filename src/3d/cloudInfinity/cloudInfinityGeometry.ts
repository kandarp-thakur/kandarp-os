import * as THREE from "three";

/**
 * CloudInfinity geometry — the signature 3D object of Kandarp OS.
 *
 * One unified shape that merges **Cloud** + **DevOps Infinity Loop** into a
 * single continuous form. It is NOT a cloud placed beside an infinity icon —
 * it is one tube whose centerline is a lemniscate (the ∞ / continuous-delivery
 * cycle) and whose radius swells at the two lobes (the cloud puffs) and pinches
 * at the crossing (the flow that connects them).
 *
 *   Plan → Code → Build → Test → Release → Deploy → Operate → Monitor → Plan
 *                              ↺  the loop never ends  ↺
 *
 * The lemniscate of Bernoulli traces this figure-8 smoothly and returns to its
 * start, so the tube is a closed, seamless ribbon — continuous curves, soft
 * rounded edges, no sharp angles, no mechanical parts. A gentle Z undulation
 * lifts both lobes and dips the crossing so the object reads as two floating
 * cloud masses joined by a flowing neck, giving it sculptural depth.
 *
 * The tube is built with rotation-minimizing (parallel-transport) frames and a
 * closed-loop twist correction, so the cross-section never twists awkwardly
 * around the loop. Vertex normals point radially outward for smooth shading.
 *
 * Performance: one geometry, one draw call. Segment counts are tier-scaled by
 * the caller (see [`CloudInfinity`](./CloudInfinity.tsx)).
 */

export interface CloudInfinityGeometryOptions {
    /** Lemniscate scale (`a`). Overall footprint ≈ `2 * size` wide. */
    size?: number;
    /** Max tube radius at the lobe centers — the "cloud puff" thickness. */
    lobeRadius?: number;
    /** Min tube radius at the crossing — the "flow neck" thickness. */
    neckRadius?: number;
    /** Path resolution (unique points around the loop). */
    tubularSegments?: number;
    /** Cross-section resolution (vertices per ring). */
    radialSegments?: number;
    /** Z undulation amplitude — lifts the lobes, dips the crossing. */
    lift?: number;
    /** Swelling concentration. <1 broadens the fat region (puffier lobes). */
    lobePower?: number;
}

const DEFAULTS: Required<CloudInfinityGeometryOptions> = {
    size: 2.4,
    lobeRadius: 0.42,
    neckRadius: 0.16,
    tubularSegments: 256,
    radialSegments: 18,
    lift: 0.18,
    lobePower: 0.6,
};

/** A frame at a path sample: position, tangent, and the two basis normals. */
interface Frame {
    pos: THREE.Vector3;
    tan: THREE.Vector3;
    n: THREE.Vector3;
    b: THREE.Vector3;
    radius: number;
}

/**
 * Builds the cloud-infinity tube geometry.
 *
 * @example
 * ```ts
 * const geo = createCloudInfinityGeometry({ tubularSegments: 200 });
 * ```
 */
export function createCloudInfinityGeometry(
    options: CloudInfinityGeometryOptions = {},
): THREE.BufferGeometry {
    const {
        size,
        lobeRadius,
        neckRadius,
        tubularSegments,
        radialSegments,
        lift,
        lobePower,
    } = { ...DEFAULTS, ...options };

    const n = Math.max(8, Math.floor(tubularSegments));
    const rs = Math.max(3, Math.floor(radialSegments));

    /* 1. Build the frames: lemniscate centerline + per-point radius + tangents. */
    const frames: Frame[] = new Array(n);

    for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const s = Math.sin(t);
        const c = Math.cos(t);
        const denom = 1 + s * s;
        // Lemniscate of Bernoulli — the ∞ curve.
        const x = (size * c) / denom;
        const y = (size * s * c) / denom;
        // Lift both lobes up and dip both crossings (period π → symmetric).
        const z = lift * Math.cos(2 * t) * 0.5;
        const pos = new THREE.Vector3(x, y, z);

        // |cos t| is 1 at the lobe tips, 0 at the crossings.
        const lobe = Math.pow(Math.abs(c), lobePower);
        const radius = neckRadius + (lobeRadius - neckRadius) * lobe;

        frames[i] = {
            pos,
            tan: new THREE.Vector3(),
            n: new THREE.Vector3(),
            b: new THREE.Vector3(),
            radius,
        };
    }

    /* 2. Tangents (central difference, wrap-around for the closed loop). */
    for (let i = 0; i < n; i++) {
        const prev = frames[(i - 1 + n) % n];
        const next = frames[(i + 1) % n];
        const cur = frames[i];
        if (!prev || !next || !cur) continue;
        cur.tan.subVectors(next.pos, prev.pos).normalize();
    }

    /* 3. Rotation-minimizing frames via double reflection (Wang et al.). */
    // Initial normal: world-up projected out of the first tangent.
    const firstFrame = frames[0];
    if (!firstFrame) return new THREE.BufferGeometry();
    const N0 = new THREE.Vector3(0, 0, 1);
    projectOut(N0, firstFrame.tan);
    if (N0.lengthSq() < 1e-6) N0.set(1, 0, 0);
    N0.normalize();
    firstFrame.n.copy(N0);
    firstFrame.b.crossVectors(firstFrame.tan, N0).normalize();

    for (let i = 1; i < n; i++) {
        const prev = frames[i - 1];
        const cur = frames[i];
        if (!prev || !cur) continue;
        const ni = transportFrame(prev.n, prev.pos, cur.pos, prev.tan, cur.tan);
        cur.n.copy(ni);
        cur.b.crossVectors(cur.tan, ni).normalize();
        // Re-orthogonalize N against the fresh B for numerical stability.
        cur.n.crossVectors(cur.b, cur.tan).normalize();
    }

    /* 4. Closed-loop twist correction. */
    // Transport one more step back to the start; measure the residual twist and
    // distribute it evenly so the cross-section closes seamlessly.
    const last = frames[n - 1];
    const first = frames[0];
    if (!last || !first) return new THREE.BufferGeometry();
    const Nn = transportFrame(last.n, last.pos, first.pos, last.tan, first.tan);
    const theta = Math.atan2(
        new THREE.Vector3().crossVectors(first.n, Nn).dot(first.tan),
        first.n.dot(Nn),
    );
    for (let i = 0; i < n; i++) {
        const f = frames[i];
        if (!f) continue;
        const a = (-theta * i) / n;
        rotateAroundAxis(f.n, f.tan, a);
        rotateAroundAxis(f.b, f.tan, a);
    }

    /* 5. Build the vertex buffers. */
    const vertexCount = (n + 1) * (rs + 1);
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);

    const cosSin: [number, number][] = new Array(rs + 1);
    for (let j = 0; j <= rs; j++) {
        const phi = (j / rs) * Math.PI * 2;
        cosSin[j] = [Math.cos(phi), Math.sin(phi)];
    }

    let p = 0;
    let uv = 0;
    for (let i = 0; i <= n; i++) {
        const ii = i % n; // wrap the last ring back to the first for closure
        const f = frames[ii];
        if (!f) continue;
        const r = f.radius;

        for (let j = 0; j <= rs; j++) {
            const cs = cosSin[j];
            if (!cs) continue;
            const [cp, sp] = cs;
            // Outward radial direction in the frame's N-B plane.
            const nx = cp * f.n.x + sp * f.b.x;
            const ny = cp * f.n.y + sp * f.b.y;
            const nz = cp * f.n.z + sp * f.b.z;

            positions[p] = f.pos.x + r * nx;
            positions[p + 1] = f.pos.y + r * ny;
            positions[p + 2] = f.pos.z + r * nz;
            normals[p] = nx;
            normals[p + 1] = ny;
            normals[p + 2] = nz;
            uvs[uv] = i / n;
            uvs[uv + 1] = j / rs;
            p += 3;
            uv += 2;
        }
    }

    /* 6. Index buffer (two triangles per quad). */
    const indexCount = n * rs * 6;
    const indices =
        vertexCount > 65535
            ? new Uint32Array(indexCount)
            : new Uint16Array(indexCount);
    let idx = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < rs; j++) {
            const a = i * (rs + 1) + j;
            const b = (i + 1) * (rs + 1) + j;
            const c = i * (rs + 1) + (j + 1);
            const d = (i + 1) * (rs + 1) + (j + 1);
            indices[idx++] = a;
            indices[idx++] = b;
            indices[idx++] = c;
            indices[idx++] = c;
            indices[idx++] = b;
            indices[idx++] = d;
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();

    return geometry;
}

/* -------------------------------------------------------------------------- */
/* Frame helpers                                                              */
/* -------------------------------------------------------------------------- */

/** Removes the component of `v` along `axis` (in place). */
function projectOut(v: THREE.Vector3, axis: THREE.Vector3): void {
    v.addScaledVector(axis, -v.dot(axis));
}

/** Rotates `v` around `axis` (assumed unit) by `angle` radians (in place). */
function rotateAroundAxis(
    v: THREE.Vector3,
    axis: THREE.Vector3,
    angle: number,
): void {
    if (Math.abs(angle) < 1e-9) return;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dot = v.dot(axis);
    const cross = new THREE.Vector3().crossVectors(axis, v);
    v.x = v.x * cos + cross.x * sin + axis.x * dot * (1 - cos);
    v.y = v.y * cos + cross.y * sin + axis.y * dot * (1 - cos);
    v.z = v.z * cos + cross.z * sin + axis.z * dot * (1 - cos);
}

/**
 * Parallel-transports a normal from point P0→P1 using the double-reflection
 * method (rotation-minimizing frame). Returns a fresh, normalized normal.
 */
function transportFrame(
    Nprev: THREE.Vector3,
    P0: THREE.Vector3,
    P1: THREE.Vector3,
    T0: THREE.Vector3,
    T1: THREE.Vector3,
): THREE.Vector3 {
    const v1 = new THREE.Vector3().subVectors(P1, P0);
    let c1 = v1.dot(v1);
    if (c1 < 1e-12) c1 = 1e-12;
    // Reflect Nprev across the plane perpendicular to v1.
    const nL = new THREE.Vector3()
        .copy(Nprev)
        .addScaledVector(v1, (-2 * v1.dot(Nprev)) / c1);
    // Reflect T0 across the same plane → tL.
    const tL = new THREE.Vector3()
        .copy(T0)
        .addScaledVector(v1, (-2 * v1.dot(T0)) / c1);
    // Reflect nL across the plane perpendicular to (T1 - tL).
    const v2 = new THREE.Vector3().subVectors(T1, tL);
    let c2 = v2.dot(v2);
    if (c2 < 1e-12) c2 = 1e-12;
    const Ni = new THREE.Vector3()
        .copy(nL)
        .addScaledVector(v2, (-2 * v2.dot(nL)) / c2);
    return Ni.normalize();
}
