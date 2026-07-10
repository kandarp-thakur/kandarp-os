import {
    containerSchema,
    fleetStatSchema,
    type Container,
    type FleetStat,
} from "@/types/projects";

/**
 * Projects container fleet (projects-page-design §8).
 *
 * Each project is a "running container" — statused, ported, and inspectable.
 * The array is ordered by recency (running first, then exited, then created)
 * so the fleet reads like `docker ps` output: live containers on top. Kept in
 * the data layer so the page + components stay thin.
 */

const rawContainers = [
    {
        id: "self-hosted-server",
        name: "Self-Hosted Server",
        status: "running",
        statusDetail: "Up 1y",
        image: "selfhost:casaos-latest",
        created: "2025-02-01",
        description:
            "Dockerized self-hosting stack — CasaOS, firewall, and NAS",
        longDescription:
            "A self-hosted server deployed using Docker to run CasaOS as the application dashboard, a hardened firewall, and a NAS for persistent storage. Managed virtual environments for hosting open-source applications — a complete home-lab cloud platform built from commodity hardware.",
        stack: [
            "Docker",
            "CasaOS",
            "TrueNAS",
            "Firewall",
            "Linux",
            "Virtual Environments",
        ],
        ports: [
            {
                port: ":8080",
                label: "CasaOS Dashboard",
                url: "https://casaos.io",
            },
            {
                port: "repo",
                label: "GitHub",
                url: "https://github.com/kktha",
            },
        ],
        metrics: [
            { label: "Services", value: "12" },
            { label: "Uptime", value: "99.9%" },
            { label: "Storage", value: "8 TB" },
            { label: "Apps", value: "20+" },
        ],
        changelog: [
            { version: "v1.2", text: "Added VLAN segmentation for isolation" },
            { version: "v1.1", text: "Hardened firewall rules + fail2ban" },
            {
                version: "v1.0",
                text: "Initial deployment — CasaOS + NAS stack",
            },
        ],
        links: [
            {
                label: "CasaOS",
                url: "https://casaos.io",
                variant: "primary",
            },
            {
                label: "View Source",
                url: "https://github.com/kktha",
                variant: "secondary",
            },
        ],
        exitCode: null,
    },
    {
        id: "encrypted-chat",
        name: "Encrypted Chat Platform",
        status: "running",
        statusDetail: "Up 8m",
        image: "chat:websocket-v2",
        created: "2025-04-15",
        description: "Real-time anonymous encrypted chat over WebSockets",
        longDescription:
            "A real-time chat platform built using WebSockets for anonymous, encrypted communication. Implemented user authentication and end-to-end message encryption for privacy — no messages stored in plaintext, no identity required to connect.",
        stack: [
            "WebSockets",
            "Django",
            "Python",
            "Encryption",
            "Authentication",
        ],
        ports: [
            {
                port: ":3000",
                label: "Live demo",
                url: "https://github.com/kktha",
            },
            {
                port: "repo",
                label: "GitHub",
                url: "https://github.com/kktha",
            },
        ],
        metrics: [
            { label: "Latency", value: "<50ms" },
            { label: "Encryption", value: "E2E" },
            { label: "Auth", value: "Token" },
            { label: "Anon", value: "Yes" },
        ],
        changelog: [
            { version: "v2.0", text: "End-to-end message encryption" },
            { version: "v1.2", text: "User authentication + session tokens" },
            { version: "v1.1", text: "WebSocket real-time delivery" },
            { version: "v1.0", text: "Initial prototype — anonymous rooms" },
        ],
        links: [
            {
                label: "View Source",
                url: "https://github.com/kktha",
                variant: "secondary",
            },
        ],
        exitCode: null,
    },
    {
        id: "wifi-pentest",
        name: "Wireless Pentest Framework",
        status: "running",
        statusDetail: "Up 3m",
        image: "pentest:scapy-v1",
        created: "2025-05-20",
        description: "Wi-Fi packet analysis + vulnerability detection tool",
        longDescription:
            "A wireless penetration testing framework developed using Python and Scapy for Wi-Fi packet analysis and vulnerability detection. Automated network scanning, de-authentication attacks, and report generation — a complete offensive-security toolkit for assessing wireless posture.",
        stack: ["Python", "Scapy", "Bash", "Wireless", "Automation"],
        ports: [
            {
                port: "repo",
                label: "GitHub",
                url: "https://github.com/kktha",
            },
        ],
        metrics: [
            { label: "Modules", value: "6" },
            { label: "Scans", value: "Auto" },
            { label: "Reports", value: "PDF" },
            { label: "Attacks", value: "De-auth" },
        ],
        changelog: [
            { version: "v1.2", text: "Automated report generation (PDF)" },
            { version: "v1.1", text: "De-authentication attack module" },
            { version: "v1.0", text: "Packet capture + analysis core" },
        ],
        links: [
            {
                label: "View Source",
                url: "https://github.com/kktha",
                variant: "secondary",
            },
        ],
        exitCode: null,
    },
];

/**
 * Validated containers. Parsing guarantees shape at runtime; a malformed
 * entry fails fast in dev rather than rendering a broken fleet.
 */
export const CONTAINERS: Container[] = rawContainers.map((c) =>
    containerSchema.parse(c),
);

/**
 * Fleet summary stats (projects-page-design §2.3).
 * Rendered as glass pills below the page header — the `docker ps` summary.
 */
const rawStats = [
    { key: "total", label: "Containers", value: "3" },
    { key: "running", label: "Running", value: "3" },
    { key: "exited", label: "Exited", value: "0" },
    { key: "created", label: "Created", value: "0" },
];

export const FLEET_STATS: FleetStat[] = rawStats.map((s) =>
    fleetStatSchema.parse(s),
);
