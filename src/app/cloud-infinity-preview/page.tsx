/**
 * Cloud Infinity preview route — content-free.
 *
 * Renders ONLY the signature CloudInfinity 3D object (no page content) so the
 * visual identity can be reviewed in isolation. Mirrors the existing
 * `/background-preview` pattern for the DevOps constellation.
 *
 * Route: /cloud-infinity-preview
 */

import { CloudInfinityBackground } from "@/components/background/CloudInfinityBackground";

export default function CloudInfinityPreviewPage() {
    return (
        <main className="relative min-h-[200svh] w-full overflow-hidden bg-canvas-base">
            {/* The signature object — the only thing on the page. */}
            <CloudInfinityBackground disableScroll={false} />

            {/* A tall spacer so the scroll-fade can be observed. */}
            <div className="relative z-10 flex h-[100svh] items-center justify-center">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-tertiary">
                    {"// cloud infinity · signature object"}
                </span>
            </div>
            <div className="relative z-10 flex h-[100svh] items-center justify-center">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-tertiary">
                    {"// scroll to observe the fade"}
                </span>
            </div>
        </main>
    );
}
