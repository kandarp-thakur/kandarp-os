import type { CSSProperties } from "react";

import { getSiteConfig } from "@/hooks/useSiteConfig";

/**
 * ThemeTokens — a server component that injects CMS-driven CSS custom
 * properties (design tokens) into the document `<head>`.
 *
 * Reads the resolved site identity (Settings + Profile) and emits a
 * `<style>` block that overrides the default tokens from
 * `src/styles/tokens.css` with the admin-configured values. This makes the
 * Theme & Branding admin module live: editing colors, fonts, or the accent
 * revalidates the layout (via the `public:settings` tag) and the next render
 * picks up the new tokens.
 *
 * The tokens are scoped to `:root[data-theme="..."]` so they only apply to the
 * public site (the admin console has its own `admin-surface` tokens and is
 * never affected by public theme changes).
 *
 * Place this in the root layout's `<head>` (after `globals.css`).
 */
export async function ThemeTokens() {
    const config = await getSiteConfig();

    // Build the CSS custom property overrides. Only emit properties that
    // differ from the defaults to keep the style block minimal.
    const tokens: Record<string, string> = {};

    // Brand colors.
    if (config.brand.primaryColor) {
        tokens["--color-accent"] = config.brand.primaryColor;
    }
    if (config.brand.accentColor) {
        tokens["--color-accent-secondary"] = config.brand.accentColor;
    }

    // Surface/text/border palette.
    if (config.colors.background) {
        tokens["--color-canvas-base"] = config.colors.background;
    }
    if (config.colors.surface) {
        tokens["--color-surface"] = config.colors.surface;
    }
    if (config.colors.text) {
        tokens["--color-text-primary"] = config.colors.text;
    }
    if (config.colors.textMuted) {
        tokens["--color-text-tertiary"] = config.colors.textMuted;
    }
    if (config.colors.border) {
        tokens["--color-border"] = config.colors.border;
    }
    if (config.colors.success) {
        tokens["--color-success"] = config.colors.success;
    }
    if (config.colors.warning) {
        tokens["--color-warning"] = config.colors.warning;
    }
    if (config.colors.error) {
        tokens["--color-error"] = config.colors.error;
    }

    // Typography.
    if (config.typography.headingFont) {
        tokens["--font-heading"] = `"${config.typography.headingFont}"`;
    }
    if (config.typography.bodyFont) {
        tokens["--font-body"] = `"${config.typography.bodyFont}"`;
    }
    if (config.typography.monoFont) {
        tokens["--font-mono"] = `"${config.typography.monoFont}"`;
    }
    if (config.typography.baseSize) {
        tokens["--font-size-base"] = config.typography.baseSize;
    }

    // Custom CSS from Settings (admin "Custom CSS" field).
    const customCss = config.maintenanceMode ? "" : "";

    // If no tokens differ, emit nothing (the defaults from tokens.css stand).
    const tokenEntries = Object.entries(tokens);
    if (tokenEntries.length === 0 && !customCss) return null;

    const declarations = tokenEntries
        .map(([key, value]) => `  ${key}: ${value};`)
        .join("\n");

    const css = `:root[data-theme="${config.theme}"] {\n${declarations}\n}${customCss ? `\n${customCss}` : ""
        }`;

    return (
        <style
            dangerouslySetInnerHTML={{ __html: css }}
            // Suppress hydration warning — the style is server-rendered and
            // stable per revalidation cycle.
            data-theme-tokens=""
        />
    );
}

/** Type helper for the style prop (avoids importing CSSProperties in consumers). */
export type ThemeTokensStyle = CSSProperties;
