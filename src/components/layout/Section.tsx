import {
    createElement,
    type ElementType,
    type HTMLAttributes,
    type ReactNode,
} from "react";

import { cn } from "@/utils/cn";

/** Vertical padding rhythm preset (ui-system §3.3, design-system §5.3). */
type SectionSpacing = "tight" | "default" | "comfortable" | "hero" | "none";

interface SectionProps extends HTMLAttributes<HTMLElement> {
    /** Vertical padding rhythm. Defaults to `"default"`. */
    spacing?: SectionSpacing;
    /** Render as a different element tag. Defaults to `"section"`. */
    as?: ElementType;
    /** Accessible label — recommended when the section is a landmark. */
    "aria-label"?: string;
    /** Accessible labelledby id — use when a heading titles the section. */
    "aria-labelledby"?: string;
    /** Extra classes (escape hatch). */
    className?: string;
    /** Section content. */
    children?: ReactNode;
}

const SPACING_CLASSES: Record<SectionSpacing, string> = {
    // Tight — minor blocks within a section (space-8 / space-10).
    tight: "py-8 sm:py-10",
    // Default — standard section rhythm (space-20 mobile → space-24 desktop).
    default: "py-20 sm:py-24",
    // Comfortable — major section breaks (space-24 → space-32).
    comfortable: "py-24 sm:py-32",
    // Hero — hero vertical spacing (space-32).
    hero: "py-32",
    none: "",
};

/**
 * Section — a vertical page section with consistent rhythm
 * (ui-system §3.3, design-system §5.3, component-inventory Layout #2).
 *
 * Applies the section vertical padding scale so every page shares one
 * consistent vertical rhythm. The default (`space-20` mobile → `space-24`
 * desktop) is the standard section gap; `comfortable` and `hero` escalate for
 * major section breaks and hero regions.
 *
 * Renders a semantic `<section>` landmark by default — pass `aria-label` or
 * `aria-labelledby` so screen-reader users can navigate to it. Override the
 * tag with `as` when a different element is more appropriate.
 *
 * Owns vertical padding only; horizontal measure is the page's responsibility
 * — compose a [`Container`](./Container.tsx) inside for a centered measure.
 *
 * A Server Component — it owns no semantics beyond the landmark.
 *
 * @example
 * <Section aria-label="Projects">
 *   <Container>...</Container>
 * </Section>
 */
export function Section({
    spacing = "default",
    as: Tag = "section",
    className,
    children,
    ...props
}: SectionProps) {
    return createElement(
        Tag,
        {
            ...props,
            className: cn(SPACING_CLASSES[spacing], className),
        },
        children,
    );
}

Section.displayName = "Section";
