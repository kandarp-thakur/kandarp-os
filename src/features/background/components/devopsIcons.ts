/**
 * DevOps icon silhouettes — monochrome SVG path data.
 *
 * Per docs/devops-background.md §1.3 "Color Discipline": icons are monochrome
 * glass — brand recognition comes from silhouette, not color. Each entry is a
 * single SVG path (or compact path set) drawn on a 24×24 grid, designed to be
 * embossed into a glass medallion and inherit the scene's accent tint.
 *
 * These are intentionally simplified, single-color marks — not full brand
 * logos — so they read as etched glass rather than advertisements.
 *
 * The nine concept families requested for the constellation:
 *  - Infrastructure: a server rack (stacked units + status LEDs).
 *  - Docker: the whale + container stack silhouette.
 *  - AWS: the hexagonal "cube" service mark.
 *  - Linux: the Tux penguin silhouette.
 *  - Networking: connected nodes (graph).
 *  - Cloud: the cloud silhouette.
 *  - Git: a branch graph (commits + diverging branch).
 *  - Python: the two interlocking snake bodies.
 *  - Packets: a data-packet frame with a header + binary dots.
 */

export type DevOpsIconId =
    | "infrastructure"
    | "docker"
    | "aws"
    | "linux"
    | "networking"
    | "cloud"
    | "git"
    | "python"
    | "packets"
    | "firewall"
    | "nas";

export interface DevOpsIcon {
    /** Stable identifier used for instancing + tooltips. */
    id: DevOpsIconId;
    /** Human label for the hover tooltip (DOM overlay, per §6.3). */
    label: string;
    /**
     * SVG path data on a 24×24 viewBox. Strokes are avoided where possible so
     * the silhouette fills cleanly at small sizes; where a stroke is used it
     * is drawn with `currentColor` and a consistent width.
     */
    path: string;
    /** Whether the path is a fill silhouette (true) or a stroke glyph (false). */
    fill: boolean;
}

/**
 * The nine icon families requested for the constellation.
 */
export const DEVOPS_ICONS: readonly DevOpsIcon[] = [
    {
        id: "infrastructure",
        label: "Infrastructure",
        // Server rack: three stacked units with a status LED on each.
        path: "M3 3.5h18a1 1 0 0 1 1 1V8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z M3 10h18a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1Z M3 16.5h18a1 1 0 0 1 1 1V21a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3.5a1 1 0 0 1 1-1Z M4.8 5.75a0.7 0.7 0 1 0 1.4 0a0.7 0.7 0 1 0-1.4 0Z M4.8 12.25a0.7 0.7 0 1 0 1.4 0a0.7 0.7 0 1 0-1.4 0Z M4.8 18.75a0.7 0.7 0 1 0 1.4 0a0.7 0.7 0 1 0-1.4 0Z",
        fill: true,
    },
    {
        id: "docker",
        label: "Docker",
        // Whale body + raised container stack on top.
        path: "M3 11.5h17.2c.5 0 .9.4.9.9 0 3.2-2.6 5.6-5.8 5.6H7.4C4.2 18 1.6 15.6 1.6 12.4c0-.5.4-.9.9-.9H3Zm2.2-1.4c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm2.4 0c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm2.4 0c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm2.4 0c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm2.4 0c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm-9.6-2.2c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm2.4 0c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm2.4 0c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm2.4 0c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm2.4 0c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm-7.2-2.2c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm2.4 0c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Zm2.4 0c-.4 0-.7-.3-.7-.7 0-.4.3-.7.7-.7.4 0 .7.3.7.7 0 .4-.3.7-.7.7Z",
        fill: true,
    },
    {
        id: "aws",
        label: "AWS",
        // Hexagonal service-cube silhouette (the AWS "cube" mark, simplified).
        path: "M12 2.2 21.5 7.6v8.8L12 21.8 2.5 16.4V7.6L12 2.2Zm0 2.4L4.9 8.7l7.1 4.1 7.1-4.1L12 4.6Zm-6.4 5.6v5.9L11 19v-5.9L5.6 10.2Zm12.8 0L13 13.1V19l5.4-2.9v-5.9Z",
        fill: true,
    },
    {
        id: "linux",
        label: "Linux",
        // Tux penguin silhouette (simplified): head, body, feet, beak.
        path: "M12 2.2c2.1 0 3.6 1.8 3.6 4.2 0 1.3-.4 2.2-.9 3.2-.4.8-.8 1.6-.8 2.6 0 .6.2 1 .4 1.5.2.5.5 1 .5 1.8 0 1-.4 1.7-.9 2.3-.4.5-.8 1-.8 1.7 0 .5.3.9.6 1.3.2.3.4.6.4 1 0 .7-.7 1.2-1.6 1.2s-1.6-.5-1.6-1.2c0-.4.2-.7.4-1 .3-.4.6-.8.6-1.3 0-.7-.4-1.2-.8-1.7-.5-.6-.9-1.3-.9-2.3 0-.8.3-1.3.5-1.8.2-.5.4-.9.4-1.5 0-1-.4-1.8-.8-2.6-.5-1-.9-1.9-.9-3.2 0-2.4 1.5-4.2 3.6-4.2Zm-1.6 2.6c-.3 0-.5.4-.5.9s.2.9.5.9.5-.4.5-.9-.2-.9-.5-.9Zm3.2 0c-.3 0-.5.4-.5.9s.2.9.5.9.5-.4.5-.9-.2-.9-.5-.9Z",
        fill: true,
    },
    {
        id: "networking",
        label: "Networking",
        // Connected nodes: a central hub ring + three satellite rings + edges.
        // Drawn as a stroke glyph so the graph reads clearly at small sizes.
        path: "M9.2,12 a2.8,2.8 0 1,0 5.6,0 a2.8,2.8 0 1,0 -5.6,0 M4.5,6 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M16.5,6 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M10.5,19.5 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M9.9,9.9 L6.6,6.6 M14.1,9.9 L17.4,6.6 M12,14.8 L12,18",
        fill: false,
    },
    {
        id: "cloud",
        label: "Cloud",
        // Cloud silhouette — also represents the "cloud nodes" family.
        path: "M7 18a4 4 0 0 1-.6-7.95 5 5 0 0 1 9.6-1.18A3.75 3.75 0 0 1 18 18H7Z",
        fill: true,
    },
    {
        id: "git",
        label: "Git",
        // Branch graph: a main line of two commits with a commit diverging off
        // to the side. Drawn as a stroke glyph so the nodes + edges read clearly.
        path: "M7.4,6 a1.6,1.6 0 1,0 3.2,0 a1.6,1.6 0 1,0 -3.2,0 M7.4,18 a1.6,1.6 0 1,0 3.2,0 a1.6,1.6 0 1,0 -3.2,0 M14.4,9 a1.6,1.6 0 1,0 3.2,0 a1.6,1.6 0 1,0 -3.2,0 M9,7.6 L9,16.4 M9,12 C9,9 12,9 14.4,9",
        fill: false,
    },
    {
        id: "python",
        label: "Python",
        // Two interlocking snake bodies — the Python two-snake mark, monochrome.
        // Each body is an L-bend; they weave through each other at the center.
        path: "M6 3 h6 c1.7 0 3 1.3 3 3 v3 h-3 c-1.7 0-3 1.3-3 3 v3 H6 c-1.7 0-3-1.3-3-3 V6 c0-1.7 1.3-3 3-3 Z M18 21 h-6 c-1.7 0-3-1.3-3-3 v-3 h3 c1.7 0 3-1.3 3-3 v-3 h3 c1.7 0 3 1.3 3 3 v6 c0 1.7-1.3 3-3 3 Z",
        fill: true,
    },
    {
        id: "packets",
        label: "Data Packets",
        // A network packet: a framed envelope with a header bar and two rows of
        // binary dots. Drawn as a stroke glyph so the frame + payload read clearly.
        path: "M5 5 h14 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 V7 a2 2 0 0 1 2 -2 Z M3.5 9.5 h17 M5.65,13 a0.85,0.85 0 1,0 1.7,0 a0.85,0.85 0 1,0 -1.7,0 M9.15,13 a0.85,0.85 0 1,0 1.7,0 a0.85,0.85 0 1,0 -1.7,0 M12.65,13 a0.85,0.85 0 1,0 1.7,0 a0.85,0.85 0 1,0 -1.7,0 M5.65,16.5 a0.85,0.85 0 1,0 1.7,0 a0.85,0.85 0 1,0 -1.7,0 M9.15,16.5 a0.85,0.85 0 1,0 1.7,0 a0.85,0.85 0 1,0 -1.7,0",
        fill: false,
    },
    {
        id: "firewall",
        label: "Firewall",
        // A shield containing a brick-wall pattern — the canonical firewall mark.
        // Drawn as a stroke glyph so the mortar lines + shield edge read clearly.
        path: "M12 2.5 L20.5 5.5 V11 C20.5 15.5 17 19.5 12 21.5 C7 19.5 3.5 15.5 3.5 11 V5.5 Z M4 9 H20 M6 13 H18 M8 5.5 V9 M16 5.5 V9 M12 9 V13",
        fill: false,
    },
    {
        id: "nas",
        label: "NAS",
        // A network-attached storage enclosure: a rack box with three drive bays
        // and status LEDs. Drawn as a stroke glyph so the bays + LEDs read clearly.
        path: "M4 5 H20 a1 1 0 0 1 1 1 V18 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1 -1 V6 a1 1 0 0 1 1 -1 Z M6.5 9 H17.5 M6.5 13 H17.5 M6.5 17 H17.5 M8 10.2 a0.5 0.5 0 1 0 1 0 a0.5 0.5 0 1 0 -1 0 M8 14.2 a0.5 0.5 0 1 0 1 0 a0.5 0.5 0 1 0 -1 0 M8 18.2 a0.5 0.5 0 1 0 1 0 a0.5 0.5 0 1 0 -1 0",
        fill: false,
    },
] as const;

/** Quick lookup by id (used by the preview/tooltip layer). */
export const DEVOPS_ICON_MAP: Record<DevOpsIconId, DevOpsIcon> =
    DEVOPS_ICONS.reduce(
        (acc, icon) => {
            acc[icon.id] = icon;
            return acc;
        },
        {} as Record<DevOpsIconId, DevOpsIcon>,
    );
