/**
 * make-portrait-transparent.mjs
 *
 * One-off utility that converts the hero portrait
 * (`public/images/profile/portrait.webp`) from an opaque RGB image on a
 * near-white background into an RGBA WebP with a real alpha channel, written
 * back to the SAME path so the existing Next.js public path
 * (`/images/profile/portrait.webp`) keeps working unchanged.
 *
 * Why: the hero requires a transparent portrait that blends with the Three.js
 * scene, and the integration spec forbids CSS `mask` / `clip-path` /
 * `mix-blend-mode` to fake transparency — so the transparency must live in the
 * image pixels themselves. The opaque original is preserved beforehand as
 * `public/images/profile/portrait.original.webp` (run the backup `copy` step
 * separately before this script).
 *
 * Method: flood-fill from the 4 frame edges through near-white pixels
 * (luminance > LUM_THRESHOLD); those edge-connected background pixels become
 * alpha 0 (transparent). Interior pixels — including any light subject
 * regions that are NOT connected to the frame edge — stay alpha 255. A 1px
 * alpha feather softens the silhouette edge so it reads cleanly when the
 * browser downscales the 1150×928 source to the hero render size.
 *
 * Run:  node scripts/make-portrait-transparent.mjs
 */
import sharp from "sharp";

const SRC = "public/images/profile/portrait.original.webp";
const OUT = "public/images/profile/portrait.transparent.webp";
/**
 * Luminance above this = treated as background. The portrait's background is a
 * textured light region (luminance ~178–255), while the subject is dark
 * (luminance mostly < 100, skin up to ~174). 175 sits just below the
 * background's minimum so the flood-fill spreads through the whole connected
 * background, while the dark subject blocks it. Flood-fill connectivity
 * protects enclosed subject highlights (~191) from leaking.
 */
const LUM_THRESHOLD = 175;

const { data, info } = await sharp(SRC)
    .raw()
    .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const ch = info.channels;
if (ch !== 3) {
    console.error(`Expected a 3-channel RGB source, got ${ch} channels.`);
    process.exit(1);
}

const at = (x, y) => (y * W + x) * ch;
const lum = (i) =>
    0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

// Flood-fill mask: 1 = background (will become transparent).
const mask = new Uint8Array(W * H);
const stack = [];
const trySeed = (x, y) => {
    const p = y * W + x;
    if (mask[p]) return;
    if (lum(at(x, y)) > LUM_THRESHOLD) {
        mask[p] = 1;
        stack.push(x, y);
    }
};
// Seed from every frame-edge pixel that is near-white.
for (let x = 0; x < W; x++) {
    trySeed(x, 0);
    trySeed(x, H - 1);
}
for (let y = 0; y < H; y++) {
    trySeed(0, y);
    trySeed(W - 1, y);
}

const NBR = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
];
// DFS through edge-connected near-white pixels.
while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    for (const [dx, dy] of NBR) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const np = ny * W + nx;
        if (mask[np]) continue;
        if (lum(at(nx, ny)) > LUM_THRESHOLD) {
            mask[np] = 1;
            stack.push(nx, ny);
        }
    }
}

// Build the RGBA buffer + a 1px alpha feather on the silhouette edge.
const rgba = Buffer.alloc(W * H * 4);
let fullyTransparent = 0;
for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
        const p = y * W + x;
        const i = p * ch;
        const o = p * 4;
        rgba[o] = data[i];
        rgba[o + 1] = data[i + 1];
        rgba[o + 2] = data[i + 2];
        if (mask[p]) {
            // Background. Feather only the 1px band touching the subject so
            // the edge anti-aliases instead of stair-stepping.
            let adjacentFg = false;
            for (const [dx, dy] of NBR) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                if (!mask[ny * W + nx]) {
                    adjacentFg = true;
                    break;
                }
            }
            rgba[o + 3] = adjacentFg ? 128 : 0;
            if (!adjacentFg) fullyTransparent++;
        } else {
            rgba[o + 3] = 255;
        }
    }
}

await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(
    JSON.stringify({
        size: `${W}x${H}`,
        transparentPct: ((fullyTransparent / (W * H)) * 100).toFixed(1),
        outputChannels: meta.channels,
        hasAlpha: meta.hasAlpha,
        format: meta.format,
    }),
);
