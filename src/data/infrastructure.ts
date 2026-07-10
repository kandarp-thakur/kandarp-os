import {
    infraEdgeSchema,
    infraNodeSchema,
    infraStatSchema,
    type InfraEdge,
    type InfraNode,
    type InfraStat,
} from "@/types/infrastructure";

/**
 * Infrastructure topology data.
 *
 * The DevOps stack rendered as an **interactive topology graph** — nodes
 * positioned on a 0–100 grid and connected by labelled edges. Clicking a node
 * opens a `node inspect` panel with its role, specs, metrics, and operational
 * notes.
 *
 * Nodes reflect Kandarp's real stack: AWS cloud compute, Docker container
 * runtime, Linux host OS, GitHub source control + CI/CD, VLAN networking,
 * firewall security, TrueNAS enterprise storage, and Python automation.
 * Kept in the data layer so the page + components stay thin. Mirrors the
 * experience/projects data pattern.
 */

const rawNodes = [
    {
        id: "aws",
        name: "AWS",
        icon: "aws" as const,
        role: "Cloud infrastructure",
        status: "active" as const,
        statusDetail: "Up 1y",
        x: 80,
        y: 20,
        description:
            "The cloud substrate — EC2 compute instances provisioned for workloads that need elastic scale. Everything that leaves the home lab runs on, routes through, or is delivered from here.",
        stack: ["EC2", "IAM", "Security Groups", "EBS", "CloudWatch"],
        specs: [
            { label: "Service", value: "EC2" },
            { label: "Region", value: "ap-south-1" },
            { label: "IaC", value: "Manual + Scripts" },
            { label: "Cost", value: "Free tier" },
        ],
        metrics: [
            { label: "Uptime", value: "99.9%" },
            { label: "Instances", value: "3" },
            { label: "Regions", value: "1" },
            { label: "SLO", value: "99.5%" },
        ],
        notes: [
            "EC2 instances for cloud-hosted services and testing",
            "Least-privilege IAM roles, no shared access keys",
            "Security groups default-deny, explicit allow only",
        ],
        links: [
            {
                label: "Console",
                url: "https://console.aws.amazon.com",
                variant: "primary" as const,
            },
            {
                label: "Docs",
                url: "https://docs.aws.amazon.com",
                variant: "secondary" as const,
            },
        ],
    },
    {
        id: "docker",
        name: "Docker",
        icon: "docker" as const,
        role: "Container runtime",
        status: "active" as const,
        statusDetail: "Up 1y",
        x: 44,
        y: 12,
        description:
            "The packaging boundary — every self-hosted service is built into an immutable image and shipped as a container. Powers CasaOS, the chat platform, and the open-source app fleet with reproducible builds.",
        stack: ["Docker", "Compose", "CasaOS", "BuildKit"],
        specs: [
            { label: "Engine", value: "containerd" },
            { label: "Runtime", value: "runc" },
            { label: "Images", value: "20+" },
            { label: "Base", value: "alpine" },
        ],
        metrics: [
            { label: "Containers", value: "12" },
            { label: "Images", value: "20+" },
            { label: "Networks", value: "4" },
            { label: "Volumes", value: "8" },
        ],
        notes: [
            "CasaOS runs as a Docker-managed application dashboard",
            "Compose stacks for multi-service deployments",
            "Isolated networks per service group for segmentation",
        ],
        links: [
            {
                label: "Docs",
                url: "https://docs.docker.com",
                variant: "primary" as const,
            },
            {
                label: "Hub",
                url: "https://hub.docker.com",
                variant: "secondary" as const,
            },
        ],
    },
    {
        id: "linux",
        name: "Linux",
        icon: "linux" as const,
        role: "Host operating system",
        status: "active" as const,
        statusDetail: "Up 1y",
        x: 50,
        y: 48,
        description:
            "The kernel everything stands on — the host OS for the self-hosted server. Tuned for throughput, hardened by default, and the foundation for Docker, CasaOS, and the NAS stack.",
        stack: ["Debian", "systemd", "iptables", "cgroups", "bash"],
        specs: [
            { label: "Distro", value: "Debian 12" },
            { label: "Init", value: "systemd" },
            { label: "Shell", value: "bash 5.2" },
            { label: "Hardening", value: "Firewall + fail2ban" },
        ],
        metrics: [
            { label: "Hosts", value: "2" },
            { label: "Load", value: "0.6" },
            { label: "Uptime", value: "1y" },
            { label: "Services", value: "18" },
        ],
        notes: [
            "Hosts the self-hosted server stack and virtual environments",
            "Firewall + fail2ban for brute-force protection",
            "Bash scripts automate backups and maintenance tasks",
        ],
        links: [
            {
                label: "Kernel Docs",
                url: "https://www.kernel.org/doc/html/latest",
                variant: "primary" as const,
            },
            {
                label: "Debian",
                url: "https://www.debian.org",
                variant: "secondary" as const,
            },
        ],
    },
    {
        id: "github",
        name: "GitHub",
        icon: "git" as const,
        role: "Source control + CI",
        status: "active" as const,
        statusDetail: "Up 3y",
        x: 18,
        y: 22,
        description:
            "The origin — every commit, branch, and release lives here. GitHub Actions turns each push into a build and a test run, closing the loop from source to deploy across all projects.",
        stack: ["Git", "GitHub", "Actions", "Pages"],
        specs: [
            { label: "Host", value: "github.com" },
            { label: "User", value: "@kktha" },
            { label: "Repos", value: "10+" },
            { label: "Branch", value: "main" },
        ],
        metrics: [
            { label: "Commits", value: "1.2k+" },
            { label: "Repos", value: "10+" },
            { label: "Releases", value: "8" },
            { label: "Pipeline", value: "CI/CD" },
        ],
        notes: [
            "GitHub Actions for CI/CD — build, test, deploy on push",
            "All project source version-controlled and backed up",
            "Public profile hosts open-source experiments and tools",
        ],
        links: [
            {
                label: "GitHub",
                url: "https://github.com/kktha",
                variant: "primary" as const,
            },
            {
                label: "Actions",
                url: "https://docs.github.com/actions",
                variant: "secondary" as const,
            },
        ],
    },
    {
        id: "networking",
        name: "VLAN Networking",
        icon: "networking" as const,
        role: "Connectivity fabric",
        status: "active" as const,
        statusDetail: "Up 1y",
        x: 50,
        y: 84,
        description:
            "The fabric that connects and segments every node — VLANs isolate traffic between the server fleet, the NAS, and client networks. Traffic flows through here on its way to and from the firewall.",
        stack: ["VLAN", "Subnets", "DHCP", "DNS", "Switching"],
        specs: [
            { label: "Topology", value: "VLAN-segmented" },
            { label: "VLANs", value: "4" },
            { label: "DNS", value: "local" },
            { label: "Mesh", value: "L2" },
        ],
        metrics: [
            { label: "Latency", value: "<2ms" },
            { label: "Throughput", value: "1 Gbps" },
            { label: "VLANs", value: "4" },
            { label: "Hosts", value: "15+" },
        ],
        notes: [
            "VLAN segmentation isolates server, storage, and client traffic",
            "Separate subnets per VLAN for clean broadcast domains",
            "Inter-VLAN routing controlled by the firewall",
        ],
        links: [
            {
                label: "VLAN Docs",
                url: "https://en.wikipedia.org/wiki/Virtual_LAN",
                variant: "primary" as const,
            },
            {
                label: "Networking",
                url: "https://www.cisco.com/c/en/us/support/docs/lan-switching",
                variant: "secondary" as const,
            },
        ],
    },
    {
        id: "firewall",
        name: "Firewall",
        icon: "firewall" as const,
        role: "Network security",
        status: "active" as const,
        statusDetail: "Up 1y",
        x: 82,
        y: 58,
        description:
            "The perimeter and segmentation layer — stateful rules and rate limiting that gate every inbound and outbound packet. Cloud security enforced as code, defending the self-hosted server and the NAS.",
        stack: ["iptables", "fail2ban", "Security Groups", "NAT"],
        specs: [
            { label: "Mode", value: "stateful" },
            { label: "Rules", value: "40+" },
            { label: "Default", value: "deny" },
            { label: "Policy", value: "IaC + manual" },
        ],
        metrics: [
            { label: "Blocked", value: "5k/d" },
            { label: "Rules", value: "40+" },
            { label: "Alerts", value: "2/d" },
            { label: "Bans", value: "120+" },
        ],
        notes: [
            "Default-deny posture — every rule is an explicit allow",
            "fail2ban auto-bans repeated brute-force attempts",
            "Inter-VLAN routing filtered through firewall rules",
        ],
        links: [
            {
                label: "OWASP",
                url: "https://owasp.org/www-community/controls",
                variant: "primary" as const,
            },
            {
                label: "iptables",
                url: "https://wiki.nftables.org",
                variant: "secondary" as const,
            },
        ],
    },
    {
        id: "nas",
        name: "TrueNAS",
        icon: "nas" as const,
        role: "Network-attached storage",
        status: "active" as const,
        statusDetail: "Up 1y",
        x: 80,
        y: 86,
        description:
            "The persistent layer — enterprise NAS running TrueNAS for backups, media, and shared datasets served over the network. Snapshotted and scrubbed on a schedule so data survives any single failure.",
        stack: ["TrueNAS", "ZFS", "NFS", "SMB", "Snapshots"],
        specs: [
            { label: "Platform", value: "TrueNAS" },
            { label: "Filesystem", value: "ZFS" },
            { label: "Raw", value: "8 TB" },
            { label: "RAID", value: "RAID-Z1" },
        ],
        metrics: [
            { label: "Capacity", value: "8 TB" },
            { label: "Used", value: "3.2 TB" },
            { label: "Snapshots", value: "90" },
            { label: "Scrub", value: "0 errors" },
        ],
        notes: [
            "TrueNAS enterprise NAS with ZFS filesystem",
            "RAID-Z1 — tolerates one disk failure with no data loss",
            "Scheduled snapshots protect against accidental deletion",
        ],
        links: [
            {
                label: "TrueNAS",
                url: "https://www.truenas.com",
                variant: "primary" as const,
            },
            {
                label: "OpenZFS",
                url: "https://openzfs.org",
                variant: "secondary" as const,
            },
        ],
    },
    {
        id: "python",
        name: "Python",
        icon: "python" as const,
        role: "Automation + security tooling",
        status: "active" as const,
        statusDetail: "Up 3y",
        x: 16,
        y: 60,
        description:
            "The automation layer — scripts that provision, scan, and report across the whole topology. Powers the wireless pentest framework (Scapy), the chat platform backend, and the glue between CLI, APIs, and infrastructure.",
        stack: ["Python 3", "Scapy", "Django", "WebSockets", "Boto3"],
        specs: [
            { label: "Version", value: "3.12" },
            { label: "Runtime", value: "venv" },
            { label: "Framework", value: "Django" },
            { label: "Security", value: "Scapy" },
        ],
        metrics: [
            { label: "Scripts", value: "30+" },
            { label: "Projects", value: "3" },
            { label: "Modules", value: "12" },
            { label: "Runs/d", value: "50+" },
        ],
        notes: [
            "Scapy-based wireless penetration testing framework",
            "Django backend for the encrypted real-time chat platform",
            "Automation scripts for NAS backups and server maintenance",
        ],
        links: [
            {
                label: "Python",
                url: "https://docs.python.org/3",
                variant: "primary" as const,
            },
            {
                label: "Scapy",
                url: "https://scapy.net",
                variant: "secondary" as const,
            },
        ],
    },
];

/**
 * Validated nodes. Parsing guarantees shape at runtime; a malformed entry
 * fails fast in dev rather than rendering a broken topology.
 */
export const INFRA_NODES: InfraNode[] = rawNodes.map((n) =>
    infraNodeSchema.parse(n),
);

const rawEdges = [
    { from: "github", to: "docker", label: "builds" },
    { from: "docker", to: "linux", label: "runs on" },
    { from: "linux", to: "aws", label: "extends to" },
    { from: "aws", to: "firewall", label: "protected by" },
    { from: "firewall", to: "networking", label: "filters" },
    { from: "networking", to: "nas", label: "mounts" },
    { from: "networking", to: "linux", label: "connects" },
    { from: "python", to: "github", label: "automates" },
    { from: "python", to: "docker", label: "orchestrates" },
    { from: "python", to: "aws", label: "provisions" },
];

/**
 * Validated edges. A second pass asserts every `from`/`to` references a real
 * node id — a dangling edge would render a line to nothing.
 */
export const INFRA_EDGES: InfraEdge[] = rawEdges.map((e) =>
    infraEdgeSchema.parse(e),
);

// Guard: every edge endpoint must reference a defined node. Runs at module load
// so a broken reference fails in dev rather than at runtime in the browser.
const nodeIds = new Set(INFRA_NODES.map((n) => n.id));
for (const edge of INFRA_EDGES) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        throw new Error(
            `Infrastructure edge references unknown node: ${edge.from} → ${edge.to}`,
        );
    }
}

const rawStats = [
    { key: "nodes" as const, label: "Nodes", value: "8" },
    { key: "active" as const, label: "Active", value: "8" },
    { key: "edges" as const, label: "Links", value: "10" },
    { key: "uptime" as const, label: "Uptime", value: "99.9%" },
];

export const INFRA_STATS: InfraStat[] = rawStats.map((s) =>
    infraStatSchema.parse(s),
);
