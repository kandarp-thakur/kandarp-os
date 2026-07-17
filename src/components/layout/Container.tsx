import {
    createElement,
    type ElementType,
    type HTMLAttributes,
    type ReactNode,
} from "react";

import { cn } from "@/utils/cn";

/** Max-width preset mapped to the container tokens (ui-system §4.1). */
type ContainerWidth = "prose" | "default" | "wide" | "full";

interface ContainerProps extends HTMLAttributes<HTMLElement> {
    /** Max-width preset. Defaults to `"default"` (1152px). */
    maxWidth?: ContainerWidth;
    /** Render as a different element tag. Defaults to `"div"`. */
    as?: ElementType;
    /** Extra classes (escape hatch). */
    className?: string;
    /** Container content. */
    children?: ReactNode;
}

const MAX_WIDTHS: Record<ContainerWidth, string> = {
    prose: "max-w-[680px]",
    default: "max-w-[1152px]",
    wide: "max-w-[1440px]",
    full: "max-w-full",
};

/**
 * Container — a max-width + horizontal-padding content wrapper
 * (ui-system §4.1, component-inventory Layout #1).
 *
 * Centers its children and applies responsive horizontal padding
 * (`1rem` mobile → `2rem` desktop) so every page shares one consistent content
 * measure. Four width presets map to the container tokens: `prose` (680px,
 * long-form), `default` (1152px, standard pages), `wide` (1440px, full-bleed
 * sections), and `full` (100%, edge-to-edge heroes/3D).
 *
 * Content never touches edges — always container padding (ui-system §4.5).
 * Full-bleed is intentional and reserved for heroes, 3D, and dividers.
 *
 * A Server Component — it owns no semantics. Drop any content inside.
 *
 * @example
 * <Container maxWidth="default">...</Container>
 */
export function Container({
    maxWidth = "default",
    as: Tag = "div",
    className,
    children,
    ...props
}: ContainerProps) {
    return createElement(
        Tag,
        {
            ...props,
            className: cn(
                "mx-auto w-full px-4 sm:px-6 lg:px-8",
                MAX_WIDTHS[maxWidth],
                className,
            ),
        },
        children,
    );
}

Container.displayName = "Container";
