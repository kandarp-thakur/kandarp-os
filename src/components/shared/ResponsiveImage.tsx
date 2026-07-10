"use client";

/**
 * ResponsiveImage — the public-site image renderer for any Media Library
 * asset resolved via `resolveMediaAsset` (the `PublicImage` contract).
 *
 * This is the reusable rendering layer for the entire site: the hero portrait,
 * blog covers, project thumbnails, logos, awards, certificates, hero
 * backgrounds, and gallery all consume it. No entity renders media any other
 * way (component-rules §"Future Ready").
 *
 * Capabilities (per the Dynamic Profile Image spec):
 *  - **Responsive srcset** — serves thumbnail/medium/large variants per device
 *    via `srcset` + `sizes` (no full-size on mobile).
 *  - **Format negotiation** — `<picture>` with AVIF → WebP → original
 *    `<source>`s so modern browsers get the smallest bytes.
 *  - **Blur placeholder** — the inline `blurDataUrl` shows while the real image
 *    loads, then cross-fades.
 *  - **Smooth fade-in** — opacity 0 → 1 on `onLoad`.
 *  - **Focal point** — drives `object-position` so cover-fit keeps the subject
 *    in frame (set via the admin focal-point editor).
 *  - **Lazy / preload** — `priority` eager-loads + high fetch priority (hero
 *    only); everything else is `loading="lazy"`.
 *  - **Fallback** — the parent passes `null` when there's no image; this
 *    component is only rendered when an image exists.
 */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { cn } from "@/utils/cn";
import type { PublicImage } from "@/lib/admin/public-data";

interface ResponsiveImageProps {
    /** The resolved media descriptor (from `resolveMediaAsset`). */
    image: PublicImage;
    /** Alt text override. Defaults to the asset's alt. */
    alt?: string;
    /** `sizes` attribute for srcset selection (e.g. "(max-width: 768px) 200px, 320px"). */
    sizes?: string;
    /** Classes on the outer wrapper. */
    className?: string;
    /** Classes on the `<img>` itself. */
    imgClassName?: string;
    /** Eager-load + high fetch priority (hero / above-the-fold only). Defaults to false (lazy). */
    priority?: boolean;
    /** Object-fit. Defaults to `"cover"`. */
    objectFit?: "cover" | "contain";
    /** Optional inline style on the outer wrapper. */
    style?: CSSProperties;
}

/**
 * Build a `srcset` string from the variants for a given format key.
 * Returns `null` if no variants have that format.
 */
function buildSrcset(
    variants: PublicImage["variants"],
    format: "path" | "webp" | "avif",
): string | null {
    const entries = variants
        .map((v) => {
            const src = v[format];
            if (!src) return null;
            return `${src} ${v.width}w`;
        })
        .filter((s): s is string => s !== null);
    return entries.length > 0 ? entries.join(", ") : null;
}

export function ResponsiveImage({
    image,
    alt,
    sizes,
    className,
    imgClassName,
    priority = false,
    objectFit = "cover",
    style,
}: ResponsiveImageProps) {
    const [loaded, setLoaded] = useState(false);

    // Reset load state if the image source changes (e.g. admin swaps the asset).
    useEffect(() => {
        setLoaded(false);
    }, [image.id]);

    const avifSrcset = buildSrcset(image.variants, "avif");
    const webpSrcset = buildSrcset(image.variants, "webp");
    const originalSrcset = buildSrcset(image.variants, "path");

    // Fallback src: largest variant's original-format path, else the first
    // variant, else empty (browser shows alt text).
    const sortedVariants = [...image.variants].sort(
        (a, b) => b.width - a.width,
    );
    const fallbackSrc =
        sortedVariants[0]?.path ?? image.variants[0]?.path ?? "";

    const objectPosition = image.focalPoint
        ? `${image.focalPoint.x * 100}% ${image.focalPoint.y * 100}%`
        : "center center";

    return (
        <div
            className={cn("relative overflow-hidden", className)}
            style={{
                backgroundColor: image.blurDataUrl
                    ? undefined
                    : "var(--canvas-sunken)",
                backgroundImage: image.blurDataUrl
                    ? `url("${image.blurDataUrl}")`
                    : undefined,
                backgroundSize: "cover",
                backgroundPosition: objectPosition,
                ...style,
            }}
        >
            <picture>
                {avifSrcset ? (
                    <source
                        type="image/avif"
                        srcSet={avifSrcset}
                        sizes={sizes}
                    />
                ) : null}
                {webpSrcset ? (
                    <source
                        type="image/webp"
                        srcSet={webpSrcset}
                        sizes={sizes}
                    />
                ) : null}
                {originalSrcset ? (
                    <source
                        type={image.mimeType}
                        srcSet={originalSrcset}
                        sizes={sizes}
                    />
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={fallbackSrc}
                    alt={alt ?? image.alt}
                    sizes={sizes}
                    loading={priority ? "eager" : "lazy"}
                    // @ts-expect-error — fetchPriority is valid HTML, React types lag.
                    fetchpriority={priority ? "high" : "auto"}
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                    className={cn(
                        "h-full w-full transition-opacity duration-500 ease-standard",
                        objectFit === "cover"
                            ? "object-cover"
                            : "object-contain",
                        loaded ? "opacity-100" : "opacity-0",
                        imgClassName,
                    )}
                    style={{ objectPosition }}
                />
            </picture>
        </div>
    );
}

ResponsiveImage.displayName = "ResponsiveImage";
