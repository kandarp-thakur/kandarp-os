/**
 * Next.js production configuration for Kandarp OS.
 *
 * Optimisations enabled:
 *   • `output: "standalone"` — bundles a minimal self-contained server into
 *     `.next/standalone/` so the production image doesn't need the full
 *     `node_modules` tree. Required for Docker / self-hosted deployments
 *     (AWS EC2, ECS Fargate, App Runner). See `Dockerfile` + `docs/deployment-aws.md`.
 *   • `optimizePackageImports` — tree-shakes barrel exports from heavy
 *     libraries (lucide icons, framer-motion, three/drei) so only the
 *     symbols actually used ship to the client.
 *   • `removeConsole` — strips `console.*` calls in production builds
 *     (errors are preserved for error reporting).
 *   • `poweredByHeader` — removes the `X-Powered-By` response header
 *     for a smaller, less fingerprintable response.
 *   • `compress` — enables gzip compression for served assets.
 *   • `reactStrictMode` — surfaces side-effect bugs in development.
 *   • `productionBrowserSourceMaps` disabled — source maps are not
 *     shipped to the client (smaller production payload; debugging
 *     happens locally).
 *
 * Security headers (applied to every route via `headers()`):
 *   • HSTS — force HTTPS for 2 years, includeSubDomains, preload.
 *   • `X-Content-Type-Options: nosniff` — prevent MIME sniffing.
 *   • `X-Frame-Options: DENY` — clickjacking defence (legacy browsers).
 *   • `Referrer-Policy` — limit referrer leakage to cross-origin.
 *   • `Permissions-Policy` — disable invasive browser APIs.
 *   • `Content-Security-Policy` — restrict resource origins.
 *
 * Dynamic per-request controls (rate limiting, CSRF, body-size) live in
 * `src/middleware.ts` for admin API routes.
 *
 * @type {import('next').NextConfig}
 */

/** Content-Security-Policy — strict, same-origin-first. */
const csp = [
    "default-src 'self'",
    // Next.js App Router injects inline <script> for hydration and inline
    // <style> for CSS. Without nonce infrastructure these require 'unsafe-inline'.
    // TODO: upgrade to nonce-based CSP (generate nonce in middleware, pass to
    // layout) to remove 'unsafe-inline' from script-src.
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    // Images: self, data: URIs (blur placeholders), blob: (object URLs),
    // Cloudinary (production media CDN).
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self' data:",
    // API calls: self. Cloudinary upload/transform API.
    "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com",
    // Three.js / Web Workers may use blob: workers.
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    // Clickjacking: no framing (modern browsers honour frame-ancestors;
    // X-Frame-Options: DENY covers legacy).
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // Force HTTPS in production (omitted in dev for localhost).
    process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
]
    .filter(Boolean)
    .join("; ");

/** Security headers applied to every response. */
const securityHeaders = [
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=(), browsing-topics=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "Content-Security-Policy", value: csp },
];

const nextConfig = {
    // Produce a self-contained `.next/standalone` server for Docker / self-hosting.
    // The standalone output bundles only the Node modules the server actually
    // imports, so the final image is ~150 MB instead of ~1.5 GB. The Dockerfile
    // copies `.next/standalone` + `.next/static` + `public/` into the runner stage.
    output: "standalone",

    reactStrictMode: true,

    // Strip console.* in production, but keep console.error so
    // runtime failures are still surfaced to error reporters.
    compiler: {
        removeConsole:
            process.env.NODE_ENV === "production"
                ? { exclude: ["error"] }
                : false,
    },

    // Tree-shake barrel-exported packages at the import-graph level.
    // R3F packages are intentionally excluded: their custom reconciler relies
    // on package entrypoints and can break when rewritten to deep imports.
    experimental: {
        optimizePackageImports: ["lucide-react", "framer-motion", "gsap"],
    },

    // Security + size hygiene.
    poweredByHeader: false,
    compress: true,

    // Do not ship source maps to the browser in production.
    productionBrowserSourceMaps: false,

    // Security headers — applied to every route (public + admin). These are
    // static, so they're served from the edge cache with zero per-request
    // overhead. Dynamic per-request controls (rate limiting, CSRF, body-size)
    // live in `src/middleware.ts`.
    async headers() {
        return [
            {
                source: "/:path*",
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
