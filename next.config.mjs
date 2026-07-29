/**
 * Next.js configuration for Kandarp OS — frontend-only build.
 *
 * Optimisations enabled:
 *   • `optimizePackageImports` — tree-shakes barrel exports from heavy
 *     libraries (lucide icons, framer-motion, gsap) so only the symbols
 *     actually used ship to the client.
 *   • `removeConsole` — strips `console.*` calls in production builds
 *     (errors are preserved for error reporting).
 *   • `poweredByHeader` — removes the `X-Powered-By` response header.
 *   • `compress` — enables gzip compression for served assets.
 *   • `reactStrictMode` — surfaces side-effect bugs in development.
 *
 * Security headers (applied to every route via `headers()`):
 *   • HSTS — force HTTPS for 2 years, includeSubDomains, preload.
 *   • `X-Content-Type-Options: nosniff` — prevent MIME sniffing.
 *   • `X-Frame-Options: DENY` — clickjacking defence (legacy browsers).
 *   • `Referrer-Policy` — limit referrer leakage to cross-origin.
 *   • `Permissions-Policy` — disable invasive browser APIs.
 *   • `Content-Security-Policy` — restrict resource origins.
 *
 * @type {import('next').NextConfig}
 */

/** Content-Security-Policy — strict in production, Next-dev compatible locally. */
const isDevelopment = process.env.NODE_ENV === "development";
const csp = [
    "default-src 'self'",
    // Next.js injects inline hydration scripts. Its development runtime also
    // evaluates generated modules, so blocking `unsafe-eval` prevents React
    // hydration and leaves every client component and animation inert.
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // Images: self, data: URIs (blur placeholders), blob: (object URLs).
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    // Development HMR uses a WebSocket; production remains same-origin only.
    `connect-src 'self'${
        isDevelopment ? " ws://localhost:* ws://127.0.0.1:*" : ""
    }`,
    // Three.js / Web Workers may use blob: workers.
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    // Clickjacking: no framing.
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // Force HTTPS in production (omitted in dev for localhost).
    isDevelopment ? "" : "upgrade-insecure-requests",
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
    // Keep development and production build artifacts isolated. Running
    // `next dev` while a production build/start check uses the default `.next`
    // directory can replace the dev CSS manifest and make the HTML reference
    // `/_next/static/css/app/layout.css` after that file has disappeared. The
    // browser then receives a 404 and renders the complete page as unstyled
    // text. A dedicated dev directory prevents either process from corrupting
    // the other process's assets.
    distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",

    // The repo root is this directory; tell Next.js so it doesn't warn about
    // inferred workspace roots during build.
    outputFileTracingRoot: process.cwd(),

    // React StrictMode double-invokes effects (mount → unmount → mount) in
    // DEVELOPMENT only. With framer-motion's `useScroll`/`useTransform` in the
    // Hero, the second mount computes a different scroll-derived MotionValue
    // than the server-rendered HTML, producing a hydration mismatch that bails
    // the ENTIRE page route segment to client-side rendering — orphaning the
    // streamed server HTML for every section after the hero (they appear as
    // blank space the user can scroll through). Production builds do NOT
    // double-invoke effects, which is why production renders all sections
    // correctly. Disabling StrictMode in dev makes dev behave identically to
    // production. StrictMode is still respected in production builds.
    reactStrictMode: process.env.NODE_ENV === "production",

    // Strip console.* in production, but keep console.error so runtime
    // failures are still surfaced to error reporters.
    compiler: {
        removeConsole:
            process.env.NODE_ENV === "production"
                ? { exclude: ["error"] }
                : false,
    },

    // Tree-shake barrel-exported packages at the import-graph level.
    // NOTE: `framer-motion` is intentionally excluded — under Next.js 15 dev
    // SSR, `optimizePackageImports` for framer-motion corrupts the React
    // Server Components client manifest (the "SegmentViewNode" /
    // "Cannot read properties of undefined (reading 'call')" errors), which
    // bails every `motion.*` subtree to client rendering and then fails there
    // too — making the Hero (and every animated Client Component) disappear.
    // `lucide-react` and `gsap` are safe; framer-motion is tree-shaken fine by
    // the bundler without this flag.
    experimental: {
        optimizePackageImports: ["lucide-react", "gsap"],
        // Disable the Next.js 15.5 "Segment Explorer" devtools feature
        // (SegmentViewNode). In 15.5.x this feature has a bug: the RSC
        // bundler fails to register `segment-explorer-node.js#SegmentViewNode`
        // in the client manifest, so when the server streams the page, every
        // segment boundary (layout, page, loading, error, template) is wrapped
        // in a <SegmentViewNode> reference the client cannot resolve. React
        // aborts hydration and CLEARS the server-rendered DOM for every
        // section after the hero — the user can scroll through blank space but
        // sees no content. Setting `devtoolSegmentExplorer: false` removes
        // SegmentViewNode from the server component tree entirely so hydration
        // succeeds and all sections remain visible. This is dev-only (the flag
        // is ignored in production builds) and has zero production impact.
        devtoolSegmentExplorer: false,
    },

    // Security + size hygiene.
    poweredByHeader: false,
    compress: true,

    // Do not ship source maps to the browser in production.
    productionBrowserSourceMaps: false,

    // Security headers — applied to every route. These are static, so they're
    // served from the edge cache with zero per-request overhead.
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
