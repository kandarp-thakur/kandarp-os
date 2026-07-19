import {
    deploymentSchema,
    deploymentStatSchema,
    type Deployment,
    type DeploymentStat,
} from "@packages/types/experience";

/**
 * Experience deployment history (experience-page-design §7).
 *
 * Each role is a versioned "deployment" — versioned, statused, and
 * expandable. The array is ordered newest-first (v3.0 → v1.0) so the
 * timeline reads top-to-bottom chronologically descending, matching the
 * design doc's layout. Kept in the data layer so the page + components
 * stay thin.
 */

const rawDeployments = [
    {
        id: "v1-0",
        version: "v1.0",
        role: "DevOps Engineer",
        company: "KumaSoft",
        companyUrl: "https://kumasoft.com",
        startDate: "2025-01",
        endDate: null,
        status: "active",
        image: "kandarp:v1.0",
        replicas: "1/1",
        uptime: "1y 6m",
        summary:
            "Cloud computing, DevOps, cloud security, Python automation, and enterprise NAS systems.",
        changelog: [
            "Deployed a self-hosted server using Docker to run CasaOS, firewall, and NAS",
            "Managed virtual environments for hosting open-source applications",
            "Built a real-time chat platform using WebSockets with encrypted communication",
            "Implemented user authentication and message encryption for privacy",
            "Operated enterprise NAS systems (TrueNAS) and VLAN networking",
            "Managed server infrastructure and cloud security hardening",
        ],
        stack: [
            "AWS (EC2)",
            "Docker",
            "CasaOS",
            "TrueNAS",
            "Python",
            "Bash",
            "WebSockets",
            "VLAN",
            "Firewall",
        ],
        links: [{ label: "Company", url: "https://kumasoft.com" }],
    },
];

/**
 * Validated deployments. Parsing guarantees shape at runtime; a malformed
 * entry fails fast in dev rather than rendering a broken timeline.
 */
export const DEPLOYMENTS: Deployment[] = rawDeployments.map((d) =>
    deploymentSchema.parse(d),
);

/**
 * Deployment summary stats (experience-page-design §2.3).
 * Rendered as glass pills below the page header.
 */
const rawStats = [
    { label: "Deployments", value: "1" },
    { label: "Uptime", value: "1y 6m" },
    { label: "Current", value: "1 active" },
    { label: "Focus", value: "Cloud + Security" },
];

export const DEPLOYMENT_STATS: DeploymentStat[] = rawStats.map((s) =>
    deploymentStatSchema.parse(s),
);
