/**
 * UI primitives barrel — Kandarp OS.
 *
 * Re-exports the design-system-level building blocks (folder-structure §4.2
 * `ui/`). Importing from the barrel keeps consumer imports stable as the UI
 * module grows:
 *
 *   import { Button, Card, GlassCard, Input } from "@/components/ui";
 *
 * @see [`Button`](./Button.tsx) — the primary action trigger.
 * @see [`Card`](./Card.tsx) — the generic surface container.
 * @see [`GlassCard`](./GlassCard.tsx) — the signature glassmorphism surface.
 * @see [`Heading`](./Heading.tsx) — the typed heading primitive.
 * @see [`Badge`](./Badge.tsx) — the small status/label indicator.
 * @see [`Input`](./Input.tsx) — the standard text input.
 * @see [`Textarea`](./Textarea.tsx) — the multiline text input.
 * @see [`Modal`](./Modal.tsx) — the centered dialog.
 * @see [`Tooltip`](./Tooltip.tsx) — the hover/focus contextual label.
 * @see [`Popover`](./Popover.tsx) — the floating content panel.
 */
export { Avatar } from "./Avatar";
export { Badge } from "./Badge";
export { Button } from "./Button";
export { Card } from "./Card";
export { GlassCard } from "./GlassCard";
export { Heading } from "./Heading";
export { Input } from "./Input";
export { Modal } from "./Modal";
export { Popover } from "./Popover";
export { Textarea } from "./Textarea";
export { Tooltip } from "./Tooltip";
