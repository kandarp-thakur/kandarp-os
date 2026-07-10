/**
 * Background preview route — content-free.
 *
 * Renders ONLY the animated DevOps background (no page content), per the build
 * scope. A tiny, non-intrusive HUD in the corner surfaces the resolved
 * performance tier + medallion count so the animation can be reviewed against
 * the performance budget (docs/devops-background.md §7.3).
 *
 * Route: /background-preview
 */

import { DevOpsBackground } from "@/components/background/DevOpsBackground";
import { BackgroundTierHud } from "@/components/background/BackgroundTierHud";

export default function BackgroundPreviewPage() {
    return (
        <main className="relative min-h-[100svh] w-full overflow-hidden bg-canvas-base">
            {/* The animated background — the only thing on the page. */}
            <DevOpsBackground
                fixed
                debugLabel="// devops ecosystem · background only"
            />

            {/* Performance review HUD — informational, not page content. */}
            <BackgroundTierHud />
        </main>
    );
}
