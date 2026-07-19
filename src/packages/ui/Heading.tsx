import {
    createElement,
    type ElementType,
    type HTMLAttributes,
    type ReactNode,
} from "react";

import { cn } from "@utils/cn";

/** Semantic heading level — maps to the type scale (ui-system §2.3). */
type HeadingLevel =
    "display-2xl" | "display-xl" | "display-lg" | "h1" | "h2" | "h3" | "h4";

/** Text alignment. */
type Align = "left" | "center" | "right";

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
    /** Type-scale level. Defaults to `"h2"`. */
    level?: HeadingLevel;
    /** Render as a different element tag (e.g. `"div"` when not a landmark). */
    as?: ElementType;
    /** Apply the accent gradient text treatment (ui-system §2.5). */
    gradient?: boolean;
    /** Render an uppercase eyebrow overline above the heading (ui-system §2.5). */
    eyebrow?: ReactNode;
    /** Text alignment. Defaults to `"left"`. */
    align?: Align;
    /** Apply `text-wrap: balance` to prevent orphan words (ui-system §2.5). */
    balance?: boolean;
    /** Extra classes (escape hatch). */
    className?: string;
    /** Heading content. */
    children?: ReactNode;
}

const LEVEL_CLASSES: Record<HeadingLevel, string> = {
    "display-2xl":
        "text-display-2xl font-extrabold leading-[1.05] tracking-[-0.04em]",
    "display-xl":
        "text-display-xl font-extrabold leading-[1.05] tracking-[-0.035em]",
    "display-lg": "text-display-lg font-bold leading-[1.10] tracking-[-0.03em]",
    h1: "text-h1 font-bold leading-[1.15] tracking-[-0.025em]",
    h2: "text-h2 font-bold leading-[1.20] tracking-[-0.02em]",
    h3: "text-h3 font-semibold leading-[1.25] tracking-[-0.015em]",
    h4: "text-h4 font-semibold leading-[1.30] tracking-[-0.01em]",
};

/** Default element tag for each level (overridable via `as`). */
const DEFAULT_TAG: Record<HeadingLevel, ElementType> = {
    "display-2xl": "h1",
    "display-xl": "h1",
    "display-lg": "h2",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
};

const ALIGN_CLASSES: Record<Align, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
};

/**
 * Heading — a typed heading primitive mapped to the fluid type scale
 * (ui-system §2.3, §2.5).
 *
 * Seven levels map to the modular scale: `display-2xl` (hero headline) down to
 * `h4`. Each carries its own weight, line-height, and tracking per the spec.
 * Sizes are fluid via `clamp()` (defined in `tailwind.config.ts`).
 *
 * Two special treatments: `gradient` applies the accent gradient text clip
 * (the signature highlight — use sparingly, one accent word per viewport),
 * and `eyebrow` renders an uppercase overline label above the heading.
 *
 * Renders the semantically correct `<h1>`–`<h4>` tag by default; override with
 * `as` when the visual level should not affect document outline (e.g. a
 * card title that is visually an `h3` but should be an `h4` in context).
 *
 * A Server Component — it renders no interactive UI of its own.
 *
 * @example
 * <Heading level="h1" gradient eyebrow="About">Kandarp Khandwala</Heading>
 */
export function Heading({
    level = "h2",
    as,
    gradient = false,
    eyebrow,
    align = "left",
    balance = true,
    className,
    children,
    ...props
}: HeadingProps) {
    const Tag = as ?? DEFAULT_TAG[level];

    return (
        <div className={cn("flex flex-col", ALIGN_CLASSES[align])}>
            {eyebrow ? (
                <span
                    className={cn(
                        "mb-3 font-sans text-2xs font-semibold uppercase tracking-[0.15em] text-text-tertiary",
                    )}
                >
                    {eyebrow}
                </span>
            ) : null}
            {createElement(
                Tag,
                {
                    ...props,
                    className: cn(
                        "font-sans text-text-primary",
                        LEVEL_CLASSES[level],
                        gradient && "text-gradient",
                        balance && "text-balance",
                        className,
                    ),
                },
                children,
            )}
        </div>
    );
}

Heading.displayName = "Heading";
