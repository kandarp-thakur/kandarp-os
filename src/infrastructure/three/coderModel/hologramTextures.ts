"use client";

/**
 * hologramTextures — procedural canvas textures for the mascot's holographic
 * engineering interfaces.
 *
 * The redesigned Kandarp OS mascot no longer holds a laptop. Instead it
 * interacts with floating holographic UI — terminal output, git commit
 * graphs, docker container stacks, CI/CD pipelines, infrastructure topology,
 * cloud nodes, and live metrics. These textures are the content of those
 * holograms: thin, glowing, line-based HUD panels drawn once into an offscreen
 * `<canvas>` (transparent background) and wrapped in a `THREE.CanvasTexture`.
 *
 * Design language (task §Props + §Design Language):
 *  - **Glass holograms**, not cards. Every texture is drawn on a transparent
 *    canvas with thin glowing strokes + monospace text — no solid fill, no
 *    opaque rectangle. The only "frame" is a set of corner brackets + a header
 *    bar (a HUD read), never a closed box.
 *  - **Premium engineering aesthetic** — Apple/Linear/Vercel/Raycast/Docker
 *    Desktop. Crisp 1px lines, restrained palette (electric blue + soft Docker Blue
 *    + white), small monospace type, subtle status dots.
 *  - **Zero network weight** — no image assets, no fetch. Drawn once, disposed
 *    by the caller.
 *
 * The textures are intentionally moderate-resolution (320×200) — they sit on
 * small hologram meshes around the figure, so 4K would be wasted fill rate.
 */

import * as THREE from "three";

export type HologramKind =
    "terminal" | "git" | "docker" | "cicd" | "topology" | "cloud" | "metrics";

export interface HologramTextureOptions {
    /** Canvas width in px. Default 320. */
    width?: number;
    /** Canvas height in px. Default 200. */
    height?: number;
    /** Primary accent (lines/labels). Defaults to electric blue. */
    accentColor?: string;
    /** Secondary accent (highlights/active). Defaults to soft Docker Blue. */
    accentColor2?: string;
}

const DEFAULT_ACCENT = "#38BDF8"; // electric blue
const DEFAULT_ACCENT2 = "#2496ED"; // soft Docker Blue
const TEXT_COLOR = "#e2e8f0"; // near-white
const DIM_COLOR = "#64748b"; // slate
const OK_COLOR = "#4ade80"; // green (running / passed)

/** All hologram kinds, in display order. */
export const HOLOGRAM_KINDS: readonly HologramKind[] = [
    "terminal",
    "git",
    "docker",
    "cicd",
    "topology",
    "cloud",
    "metrics",
] as const;

function makeCanvas(w: number, h: number) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return { c, ctx: c.getContext("2d") };
}

/** Sets a soft additive glow on the active stroke/fill. */
function withGlow(
    ctx: CanvasRenderingContext2D,
    color: string,
    blur: number,
    fn: () => void,
) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    fn();
    ctx.restore();
}

/**
 * Draws the shared HUD frame: corner brackets + a header bar with a label +
 * a faint status dot. No closed rectangle — the panel reads as a holographic
 * projection, not a card.
 */
function drawHudFrame(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    accent: string,
    accent2: string,
    label: string,
) {
    const pad = 10;
    const bracket = 16;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Corner brackets (L-shaped) at the four corners.
    withGlow(ctx, accent, 6, () => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(pad, pad + bracket);
        ctx.lineTo(pad, pad);
        ctx.lineTo(pad + bracket, pad);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(w - pad - bracket, pad);
        ctx.lineTo(w - pad, pad);
        ctx.lineTo(w - pad, pad + bracket);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(pad, h - pad - bracket);
        ctx.lineTo(pad, h - pad);
        ctx.lineTo(pad + bracket, h - pad);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(w - pad - bracket, h - pad);
        ctx.lineTo(w - pad, h - pad);
        ctx.lineTo(w - pad, h - pad - bracket);
        ctx.stroke();
    });

    // Header bar — a thin accent line under the label.
    const headerY = pad + bracket + 6;
    withGlow(ctx, accent2, 5, () => {
        ctx.strokeStyle = accent2;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pad + bracket + 4, headerY);
        ctx.lineTo(w - pad - bracket - 4, headerY);
        ctx.stroke();
    });

    // Label text (left of header) + status dot (right).
    ctx.font = `600 11px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = "left";
    ctx.fillText(label, pad + bracket + 8, headerY - 8);

    // Status dot (active = Docker Blue).
    ctx.fillStyle = accent2;
    ctx.beginPath();
    ctx.arc(w - pad - bracket - 6, headerY - 8, 3, 0, Math.PI * 2);
    ctx.fill();
}

/** terminal — a live shell with pod status output. */
function drawTerminal(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    accent: string,
) {
    drawHudFrame(ctx, w, h, accent, DEFAULT_ACCENT2, "term — kandarp@os");
    const x = 22;
    let y = 52;
    const lh = 16;
    ctx.font = `500 12px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const lines: { text: string; color: string }[] = [
        { text: "$ kubectl get pods", color: TEXT_COLOR },
        { text: "NAME        READY  STATUS", color: DIM_COLOR },
        { text: "api-7d9     1/1    Running", color: OK_COLOR },
        { text: "web-3f2     1/1    Running", color: OK_COLOR },
        { text: "db-1a8      1/1    Running", color: OK_COLOR },
        { text: "queue-2c    0/1    Pending", color: accent },
    ];
    for (const line of lines) {
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, x, y);
        y += lh;
    }
    // Blinking caret on the last line.
    ctx.fillStyle = accent;
    ctx.fillRect(x + 96, y - 6, 7, 12);
}

/** git — a commit graph with a feature branch. */
function drawGit(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    accent: string,
    accent2: string,
) {
    drawHudFrame(ctx, w, h, accent, accent2, "git — main");
    const baseY = 96;
    ctx.font = `500 11px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // Main branch (horizontal line of commits).
    withGlow(ctx, accent, 5, () => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, baseY);
        ctx.lineTo(w - 34, baseY);
        ctx.stroke();
    });
    const mainNodes = [30, 78, w - 34];
    for (const nx of mainNodes) {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(nx, baseY, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    // Feature branch diverging + merging.
    const diverge = 78;
    const merge = w - 34;
    withGlow(ctx, accent2, 5, () => {
        ctx.strokeStyle = accent2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(diverge, baseY);
        ctx.quadraticCurveTo((diverge + merge) / 2, baseY - 40, merge, baseY);
        ctx.stroke();
    });
    ctx.fillStyle = accent2;
    ctx.beginPath();
    ctx.arc((diverge + merge) / 2, baseY - 34, 5, 0, Math.PI * 2);
    ctx.fill();

    // Labels.
    ctx.fillStyle = DIM_COLOR;
    ctx.fillText("main", 30, baseY + 18);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText("feat/autoscale", (diverge + merge) / 2 - 28, baseY - 44);
    ctx.fillStyle = OK_COLOR;
    ctx.fillText("✓ merged", merge - 30, baseY + 18);
}

/** docker — a container stack with status dots. */
function drawDocker(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    accent: string,
    accent2: string,
) {
    drawHudFrame(ctx, w, h, accent, accent2, "containers");
    const labels = ["nginx", "redis", "api", "worker"];
    const sz = 26;
    const gap = 8;
    const totalW = labels.length * sz + (labels.length - 1) * gap;
    const x = (w - totalW) / 2;
    const y = 96;
    ctx.font = `500 10px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < labels.length; i++) {
        const lx = x + i * (sz + gap);
        const label = labels[i] ?? "svc";
        withGlow(ctx, accent, 6, () => {
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.strokeRect(lx, y, sz, sz);
        });
        // Status dot (top-right of each container).
        ctx.fillStyle = i === labels.length - 1 ? accent2 : OK_COLOR;
        ctx.beginPath();
        ctx.arc(lx + sz - 5, y + 5, 3, 0, Math.PI * 2);
        ctx.fill();
        // Label under the cube.
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(label, lx + sz / 2, y + sz + 14);
    }
    // A subtle "whale" baseline under the stack.
    withGlow(ctx, accent2, 5, () => {
        ctx.strokeStyle = accent2;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 8, y + sz + 30);
        ctx.quadraticCurveTo(w / 2, y + sz + 42, x + totalW + 8, y + sz + 30);
        ctx.stroke();
    });
}

/** cicd — a pipeline of stages with a progress bar. */
function drawCicd(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    accent: string,
    accent2: string,
) {
    drawHudFrame(ctx, w, h, accent, accent2, "pipeline");
    const stages = ["build", "test", "scan", "deploy"];
    const y = 96;
    const padX = 26;
    const usable = w - padX * 2;
    const step = usable / (stages.length - 1);

    // Connector line.
    withGlow(ctx, accent, 5, () => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(w - padX, y);
        ctx.stroke();
    });

    ctx.font = `500 10px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < stages.length; i++) {
        const sx = padX + i * step;
        const done = i < stages.length - 1;
        const stage = stages[i] ?? "step";
        ctx.fillStyle = done ? OK_COLOR : accent2;
        ctx.beginPath();
        ctx.arc(sx, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = done ? DIM_COLOR : TEXT_COLOR;
        ctx.fillText(stage, sx, y + 20);
        if (done) {
            ctx.fillStyle = OK_COLOR;
            ctx.fillText("✓", sx, y - 16);
        }
    }
    // Progress bar (deploy in progress).
    const barY = y + 40;
    withGlow(ctx, accent2, 4, () => {
        ctx.strokeStyle = DIM_COLOR;
        ctx.lineWidth = 1;
        ctx.strokeRect(padX, barY, usable, 6);
        ctx.fillStyle = accent2;
        ctx.fillRect(padX, barY, usable * 0.72, 6);
    });
}

/** topology — an infrastructure network graph. */
function drawTopology(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    accent: string,
    accent2: string,
) {
    drawHudFrame(ctx, w, h, accent, accent2, "topology");
    const cx = w / 2;
    const cy = 104;
    const nodes: { x: number; y: number; r: number; label: string }[] = [
        { x: cx, y: cy, r: 8, label: "core" },
        { x: cx - 70, y: cy - 26, r: 6, label: "us-east" },
        { x: cx + 70, y: cy - 26, r: 6, label: "eu-west" },
        { x: cx - 60, y: cy + 34, r: 6, label: "ap-south" },
        { x: cx + 60, y: cy + 34, r: 6, label: "edge" },
    ];

    // Edges from core to each node.
    const core = nodes[0];
    withGlow(ctx, accent, 5, () => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        if (!core) return;
        for (let i = 1; i < nodes.length; i++) {
            const n = nodes[i];
            if (!n) continue;
            ctx.beginPath();
            ctx.moveTo(core.x, core.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
        }
    });
    // Nodes.
    ctx.font = `500 9px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!n) continue;
        ctx.fillStyle = i === 0 ? accent2 : accent;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = DIM_COLOR;
        ctx.fillText(n.label, n.x, n.y + n.r + 10);
    }
}

/** cloud — a cloud silhouette with embedded nodes. */
function drawCloud(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    accent: string,
    accent2: string,
) {
    drawHudFrame(ctx, w, h, accent, accent2, "cloud");
    const cx = w / 2;
    const cy = 104;
    withGlow(ctx, accent, 6, () => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx - 34, cy + 8, 20, Math.PI, 0);
        ctx.arc(cx, cy - 6, 26, Math.PI, 0);
        ctx.arc(cx + 34, cy + 8, 18, Math.PI, 0);
        ctx.lineTo(cx - 54, cy + 26);
        ctx.closePath();
        ctx.stroke();
    });
    // Embedded nodes inside the cloud.
    const dots: ReadonlyArray<readonly [number, number]> = [
        [cx - 18, cy + 2],
        [cx + 4, cy - 2],
        [cx + 22, cy + 4],
    ];
    for (const dot of dots) {
        const dx = dot[0];
        const dy = dot[1];
        ctx.fillStyle = accent2;
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

/** metrics — a small live line chart + bars. */
function drawMetrics(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    accent: string,
    accent2: string,
) {
    drawHudFrame(ctx, w, h, accent, accent2, "metrics");
    const x0 = 26;
    const y0 = 60;
    const cw = w - 52;
    const ch = 80;

    // Axis.
    withGlow(ctx, DIM_COLOR, 0, () => {
        ctx.strokeStyle = DIM_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0, y0 + ch);
        ctx.lineTo(x0 + cw, y0 + ch);
        ctx.stroke();
    });

    // Area + line chart (CPU).
    const pts = [0.3, 0.45, 0.38, 0.6, 0.5, 0.72, 0.58, 0.8];
    withGlow(ctx, accent, 6, () => {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach((v, i) => {
            const px = x0 + (i / (pts.length - 1)) * cw;
            const py = y0 + ch - v * ch;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();
    });
    // Faint fill under the line.
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    pts.forEach((v, i) => {
        const px = x0 + (i / (pts.length - 1)) * cw;
        const py = y0 + ch - v * ch;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.lineTo(x0 + cw, y0 + ch);
    ctx.lineTo(x0, y0 + ch);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Mini bars (memory) along the bottom.
    const bars = [0.4, 0.55, 0.5, 0.7, 0.62];
    const bw = cw / (bars.length * 2);
    for (let i = 0; i < bars.length; i++) {
        const bx = x0 + cw * 0.5 + i * bw * 1.6;
        const bh = (bars[i] ?? 0.5) * 22;
        ctx.fillStyle = accent2;
        ctx.fillRect(bx, y0 + ch - bh, bw, bh);
    }
}

const DRAWERS: Record<
    HologramKind,
    (
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        a: string,
        a2: string,
    ) => void
> = {
    terminal: (ctx, w, h, a) => drawTerminal(ctx, w, h, a),
    git: (ctx, w, h, a, a2) => drawGit(ctx, w, h, a, a2),
    docker: (ctx, w, h, a, a2) => drawDocker(ctx, w, h, a, a2),
    cicd: (ctx, w, h, a, a2) => drawCicd(ctx, w, h, a, a2),
    topology: (ctx, w, h, a, a2) => drawTopology(ctx, w, h, a, a2),
    cloud: (ctx, w, h, a, a2) => drawCloud(ctx, w, h, a, a2),
    metrics: (ctx, w, h, a, a2) => drawMetrics(ctx, w, h, a, a2),
};

/**
 * Builds a single hologram texture. The caller is responsible for disposing
 * the returned texture on unmount / tier change to avoid GPU leaks.
 */
export function createHologramTexture(
    kind: HologramKind,
    options: HologramTextureOptions = {},
): THREE.CanvasTexture | null {
    if (typeof document === "undefined") return null;
    const {
        width = 320,
        height = 200,
        accentColor = DEFAULT_ACCENT,
        accentColor2 = DEFAULT_ACCENT2,
    } = options;

    const { c, ctx } = makeCanvas(width, height);
    if (!ctx) return null;
    ctx.clearRect(0, 0, width, height);
    DRAWERS[kind](ctx, width, height, accentColor, accentColor2);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
}

/**
 * Builds the full set of hologram textures (one per kind). Returns a `Map` so
 * the caller can look up by kind without re-running the factory per panel.
 * The caller disposes every texture on unmount.
 */
export function createHologramTextures(
    options: HologramTextureOptions = {},
): Map<HologramKind, THREE.CanvasTexture> {
    const out = new Map<HologramKind, THREE.CanvasTexture>();
    for (const kind of HOLOGRAM_KINDS) {
        const tex = createHologramTexture(kind, options);
        if (tex) out.set(kind, tex);
    }
    return out;
}
