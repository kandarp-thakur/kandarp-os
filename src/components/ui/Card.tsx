import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Visual treatment of the card surface (ui-system §6.2). */
type CardVariant = "glass" | "glass-strong" | "solid" | "outline";

/** Corner radius preset (ui-system §6.4). */
type CardRadius = "sm" | "md" | "lg" | "xl";

/** Internal padding preset (ui-system §6.3). */
type CardPadding = "compact" | "default" | "comfortable" | "none";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Surface treatment. Defaults to `"glass"`. */
    variant?: CardVariant;
    /** Corner radius. Defaults to `"md"` (16px). */
    radius?: CardRadius;
    /** Internal padding. Defaults to `"default"` (space-5). */
    padding?: CardPadding;
    /** Enable the interactive hover lift (ui-system §6.5). Defaults to false. */
    interactive?: boolean;
    /** Render as a different element tag (e.g. `"article"`, `"section"`). */
    as?: ElementType;
    /** Extra classes (escape hatch). */
    className?: string;
    /** Card content. */
    children?: ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
    glass: "glass-surface",
    "glass-strong": "glass-surface-strong",
    solid: "bg-canvas-elevated border border-border-subtle shadow-sm",
    outline: "bg-transparent border border-border-default",
};

const RADIUS_CLASSES: Record<CardRadius, string> = {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
};

const PADDING_CLASSES: Record<CardPadding, string> = {
    compact: "p-4",
    default: "p-5",
    comfortable: "p-6",
    none: "p-0",
};

/**
 * Card — a generic surface container (ui-system §6).
 *
 * Four variants: `glass` (the signature frosted surface), `glass-strong`
 * (modals/popovers), `solid` (data-dense), and `outline` (inline grouping).
 * The glass variants use the `.glass-surface` utilities which apply the dual
 * inset edge highlight + layered shadow defined in `globals.css`.
 *
 * Compound sub-components (`Card.Header`, `Card.Body`, `Card.Footer`,
 * `Card.Media`) provide optional structured regions with the dividers and
 * padding specified in §6.3. Compose them rather than passing many props.
 *
 * Set `interactive` to opt into the hover lift (`translateY(-4px)` + shadow
 * escalation + accent border) defined in §6.5.
 *
 * A Server Component — it renders no interactive UI of its own.
 *
 * @example
 * <Card variant="glass" interactive>
 *   <Card.Header>Title</Card.Header>
 *   <Card.Body>Content</Card.Body>
 * </Card>
 */
export function Card({
    variant = "glass",
    radius = "md",
    padding = "default",
    interactive = false,
    as: Tag = "div",
    className,
    children,
    ...props
}: CardProps) {
    return (
        <Tag
            className={cn(
                "relative overflow-hidden",
                VARIANT_CLASSES[variant],
                RADIUS_CLASSES[radius],
                PADDING_CLASSES[padding],
                interactive &&
                    "transition-[box-shadow,transform,border-color] duration-normal ease-standard hover:-translate-y-1 hover:shadow-glass-hover hover:border-accent focus-within:border-accent focus-within:shadow-glass-hover",
                className,
            )}
            {...props}
        >
            {children}
        </Tag>
    );
}

Card.displayName = "Card";

interface CardRegionProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

/** Optional header region with a bottom divider (ui-system §6.3). */
function CardHeader({ className, children, ...props }: CardRegionProps) {
    return (
        <div
            className={cn("border-b border-border-subtle pb-5", className)}
            {...props}
        >
            {children}
        </div>
    );
}
CardHeader.displayName = "Card.Header";

/** Optional body region — flexible content area. */
function CardBody({ className, children, ...props }: CardRegionProps) {
    return (
        <div className={cn("flex flex-col", className)} {...props}>
            {children}
        </div>
    );
}
CardBody.displayName = "Card.Body";

/** Optional footer region with a top divider (ui-system §6.3). */
function CardFooter({ className, children, ...props }: CardRegionProps) {
    return (
        <div
            className={cn("mt-5 border-t border-border-subtle pt-5", className)}
            {...props}
        >
            {children}
        </div>
    );
}
CardFooter.displayName = "Card.Footer";

interface CardMediaProps extends HTMLAttributes<HTMLDivElement> {
    /** Aspect ratio of the media region. Defaults to `"16/9"`. */
    aspectRatio?: "16/9" | "4/3" | "1/1" | "21/9";
    children?: ReactNode;
    className?: string;
}

const ASPECT_CLASSES: Record<
    NonNullable<CardMediaProps["aspectRatio"]>,
    string
> = {
    "16/9": "aspect-[16/9]",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "21/9": "aspect-[21/9]",
};

/** Full-bleed media region — inherits the card's top radius (ui-system §6.3). */
function CardMedia({
    aspectRatio = "16/9",
    className,
    children,
    ...props
}: CardMediaProps) {
    return (
        <div
            className={cn(
                "-m-5 mb-5 w-[calc(100%+2.5rem)] overflow-hidden rounded-t-xl",
                ASPECT_CLASSES[aspectRatio],
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
CardMedia.displayName = "Card.Media";

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Media = CardMedia;
