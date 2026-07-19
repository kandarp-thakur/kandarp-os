import { aboutCommandSchema, type AboutCommand } from "@packages/types/about";
import { SITE } from "@utils/constants";

/**
 * About terminal content + motion config.
 *
 * Single source of truth for the About session commands and the typing
 * cadence consumed by `useAboutTerminal`. Mirrors about-page-design.md
 * (§4 whoami, §5 neofetch, §6 hostnamectl, §7 education, §9 motd/mission,
 * §10 goals). Kept in the data layer so the section component stays thin.
 */

/** Typing cadence in ms (about-page-design §3.4, animation-design §3.8).
 *
 * Tuned for a snappy, smooth feel: faster per-character typing + shorter
 * pauses so the session reveals quickly without feeling sluggish. The block
 * + output views are memoized, so the faster tick rate stays jank-free.
 *
 * Organic variation: a perfectly flat per-char delay reads as mechanical.
 * Real typing breathes — a micro-lift at word boundaries, a fractional
 * pause on path punctuation (`/`, `.`), and gentle jitter so no two
 * keystrokes land on the exact same beat. The variation is additive on top
 * of `char` and floored by `charMin`, so the overall reveal pace is
 * preserved while the cadence feels human (animation-design §3.8). */
export const ABOUT_TYPING = {
    /** Per-character command typing speed (base, before organic variation). */
    char: 38,
    /** Maximum per-keystroke jitter (±ms) for a human cadence. */
    jitter: 12,
    /** Extra pause (ms) after a space — the finger repositions to the next word. */
    wordGap: 40,
    /** Extra pause (ms) after path punctuation (`/`, `.`) — a fractional lift. */
    punctGap: 30,
    /** Floor (ms) so jitter never stalls a keystroke. */
    charMin: 24,
    /** Pause after a command types before its output appears. */
    pause: 180,
    /** Read pause after an output before the next command. */
    read: 520,
    /** Delay after the terminal enters view before the first command. */
    start: 240,
} as const;

/**
 * Today's date as the system "boot id" (about-page-design §6.2). Evaluated
 * at module load; only rendered after mount (post-hydration), so it never
 * causes a server/client mismatch.
 */
const BOOT_DATE = new Date().toISOString().slice(0, 10);

const rawCommands = [
    {
        id: "whoami",
        command: "whoami",
        section: "Identity",
        output: { kind: "plain", lines: [SITE.shortName] },
    },
    {
        id: "neofetch",
        command: "neofetch",
        section: "System",
        output: {
            kind: "neofetch",
            title: SITE.userAtHost,
            rule: "─".repeat(24),
            art: [
                "       ▟█▙",
                "      ▟███▙",
                "     ▟█████▙",
                "    ▟███████▙",
                "   ▟█████████▙",
                "  ▟███████████▙",
                " ▟█████████████▙",
                "▟███████████████▙",
                " ▟█████████████▙",
                "  ▟███████████▙",
                "   ▟█████████▙",
                "    ▟███████▙",
                "     ▟█████▙",
                "      ▟███▙",
                "       ▟█▙",
            ],
            info: [
                { label: "OS", value: `${SITE.name} v1.0` },
                { label: "Host", value: "Portfolio Platform" },
                { label: "Kernel", value: "TypeScript 5.4" },
                { label: "Uptime", value: "3 years, 6 months" },
                { label: "Shell", value: "bash 5.2" },
                { label: "Resolution", value: "1920x1080" },
                { label: "Terminal", value: "kandarp-term" },
                { label: "CPU", value: "Curiosity (8 cores) @ 3.2GHz" },
                { label: "Memory", value: "8192MiB / ∞MiB" },
                { label: "Disk", value: "3 projects, 1.2k commits" },
                { label: "Network", value: "Always online" },
                { label: "Theme", value: "Glassmorphism [Light]" },
                { label: "Icons", value: "Lucide" },
                { label: "Font", value: "Inter / JetBrains Mono" },
            ],
        },
    },
    {
        id: "hostnamectl",
        command: "hostnamectl",
        section: "Identity",
        output: {
            kind: "hostnamectl",
            fields: [
                { label: "Static hostname", value: "kandarp-os" },
                { label: "Pretty hostname", value: SITE.owner },
                { label: "Icon name", value: "devops-engineer" },
                { label: "Chassis", value: "☁ cloud-native" },
                { label: "Machine ID", value: "0xK4ND4RP" },
                { label: "Boot ID", value: BOOT_DATE },
                {
                    label: "Operating System",
                    value: `Earth (${SITE.timezone})`,
                },
                { label: "Kernel Version", value: "Human v22" },
                { label: "Architecture", value: "x86_64 + curiosity" },
            ],
        },
    },
    {
        id: "education",
        command: "cat /etc/education.conf",
        section: "Education",
        output: {
            kind: "education",
            blocks: [
                {
                    section: "postgrad",
                    entries: [
                        {
                            label: "name",
                            value: "Guru Gobind Singh Indraprastha University",
                        },
                        {
                            label: "degree",
                            value: "Master of Computer Applications (MCA)",
                        },
                        { label: "status", value: "pursuing" },
                        { label: "years", value: "2023-2025" },
                        { label: "score", value: "80%" },
                        {
                            label: "highlights",
                            value: "Networking, Cloud Computing, Python Automation",
                        },
                    ],
                },
                {
                    section: "undergrad",
                    entries: [
                        {
                            label: "name",
                            value: "Guru Gobind Singh Indraprastha University",
                        },
                        {
                            label: "degree",
                            value: "Bachelor of Computer Applications (BCA)",
                        },
                        { label: "status", value: "completed" },
                        { label: "years", value: "2020-2023" },
                        { label: "score", value: "80%" },
                        {
                            label: "highlights",
                            value: "Student of the Year, Coding Club Secretary",
                        },
                    ],
                },
                {
                    section: "schooling",
                    entries: [
                        { label: "name", value: "Rsms" },
                        {
                            label: "degree",
                            value: "Senior Secondary (Class 12)",
                        },
                        { label: "status", value: "completed" },
                        { label: "year", value: "2020" },
                        { label: "score", value: "60%" },
                    ],
                },
            ],
        },
    },
    {
        id: "mission",
        command: "cat /etc/motd",
        section: "Mission",
        output: {
            kind: "motd",
            quote: [
                "To engineer resilient cloud infrastructure,",
                "automate the repetitive, and secure the",
                "perimeter — treating every server as a craft",
                "and every packet as a guest worth respecting.",
            ],
            attribution: `— ${SITE.userAtHost}`,
        },
    },
    {
        id: "goals",
        command: "cat /etc/goals.list",
        section: "Current Status",
        output: {
            kind: "goals",
            items: [
                {
                    text: "Ship Kandarp OS v1.0 (portfolio platform)",
                    done: true,
                },
                {
                    text: "Complete MCA with distinction (80%+)",
                    done: true,
                },
                {
                    text: "Win Code-A-Zone coding contest (GeeksForGeeks)",
                    done: true,
                },
                {
                    text: "Build a self-hosted server stack (Docker + CasaOS + NAS)",
                    done: true,
                },
                {
                    text: "Deploy a real-time encrypted chat platform",
                    done: true,
                },
                {
                    text: "Develop a wireless penetration testing framework",
                    done: true,
                },
                {
                    text: "Grow the code.thakur YouTube channel to 10k+ subs",
                    done: false,
                },
                {
                    text: "Architect enterprise cloud infrastructure at scale",
                    done: false,
                },
                {
                    text: "Earn AWS + Kubernetes professional certifications",
                    done: false,
                },
                {
                    text: "Mentor 10+ aspiring DevOps engineers",
                    done: false,
                },
            ],
        },
    },
];

/**
 * Validated About commands. Parsing guarantees shape at runtime; a malformed
 * entry fails fast in dev rather than rendering broken terminal output.
 */
export const ABOUT_COMMANDS: AboutCommand[] = rawCommands.map((c) =>
    aboutCommandSchema.parse(c),
);
