/**
 * Next.js production configuration for Kandarp OS.
 *
 * Optimisations enabled:
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
 * @type {import('next').NextConfig}
 */
const nextConfig = {
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
};

export default nextConfig;
