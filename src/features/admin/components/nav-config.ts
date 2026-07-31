/**
 * Engineering Console navigation.
 *
 * The information architecture mirrors the operational areas exposed by the
 * console. Related sub-surfaces share an existing editor through the reserved
 * `view` query parameter until they require a dedicated page.
 */

import {
    Activity,
    Award,
    BarChart3,
    Bell,
    Blocks,
    BookOpen,
    Box,
    Boxes,
    Briefcase,
    Brush,
    Component,
    Contact,
    Database,
    Download,
    FileClock,
    FileDown,
    FileImage,
    FileText,
    FolderKanban,
    Gauge,
    Github,
    Globe,
    HardDrive,
    HeartPulse,
    Image,
    Infinity as InfinityIcon,
    KeyRound,
    LayoutDashboard,
    Lock,
    MessageSquare,
    MonitorCog,
    MousePointerClick,
    Navigation,
    Network,
    Palette,
    PanelBottom,
    Play,
    RefreshCcw,
    Rocket,
    ScrollText,
    SearchCode,
    Settings,
    ShieldCheck,
    Sparkles,
    Table2,
    TerminalSquare,
    TrafficCone,
    Type,
    User,
    UserCog,
    Users,
    Variable,
    Waves,
    Workflow,
    type LucideIcon,
} from "lucide-react";

export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    /** Permission required to see this item. Omit = always visible. */
    permission?: string;
}

export interface NavSection {
    label: string;
    marker: string;
    items: NavItem[];
}

export const ADMIN_NAV: NavSection[] = [
    {
        label: "Dashboard",
        marker: "📊",
        items: [
            { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
            {
                label: "Analytics",
                href: "/admin/analytics",
                icon: BarChart3,
                permission: "analytics:read",
            },
            {
                label: "Activity",
                href: "/admin/activity-logs",
                icon: Activity,
                permission: "audit:read",
            },
            {
                label: "System Health",
                href: "/admin/system-health",
                icon: HeartPulse,
                permission: "settings:read",
            },
        ],
    },
    {
        label: "Website",
        marker: "🌐",
        items: [
            {
                label: "Hero",
                href: "/admin/hero",
                icon: Play,
                permission: "settings:read",
            },
            {
                label: "About",
                href: "/admin/about",
                icon: User,
                permission: "settings:read",
            },
            {
                label: "Experience",
                href: "/admin/experience",
                icon: Briefcase,
                permission: "content:read",
            },
            {
                label: "Projects",
                href: "/admin/projects",
                icon: FolderKanban,
                permission: "content:read",
            },
            {
                label: "Toolkit",
                href: "/admin/skills",
                icon: Blocks,
                permission: "content:read",
            },
            {
                label: "Infrastructure",
                href: "/admin/infrastructure",
                icon: Network,
                permission: "content:read",
            },
            {
                label: "Achievements",
                href: "/admin/awards",
                icon: Award,
                permission: "content:read",
            },
            {
                label: "Blog",
                href: "/admin/blog",
                icon: BookOpen,
                permission: "content:read",
            },
            {
                label: "Contact",
                href: "/admin/contact",
                icon: Contact,
                permission: "settings:read",
            },
            {
                label: "Footer",
                href: "/admin/footer",
                icon: PanelBottom,
                permission: "settings:read",
            },
            {
                label: "Navigation",
                href: "/admin/navigation",
                icon: Navigation,
                permission: "settings:read",
            },
            {
                label: "SEO",
                href: "/admin/seo",
                icon: Globe,
                permission: "settings:read",
            },
        ],
    },
    {
        label: "Content",
        marker: "🖼",
        items: [
            {
                label: "Media Library",
                href: "/admin/media",
                icon: Image,
                permission: "media:read",
            },
            {
                label: "Images",
                href: "/admin/asset-manager?view=images",
                icon: FileImage,
                permission: "media:read",
            },
            {
                label: "Resume",
                href: "/admin/resumes",
                icon: FileText,
                permission: "content:read",
            },
            {
                label: "Documents",
                href: "/admin/asset-manager?view=documents",
                icon: FileText,
                permission: "media:read",
            },
            {
                label: "Downloads",
                href: "/admin/resumes?view=downloads",
                icon: Download,
                permission: "content:read",
            },
        ],
    },
    {
        label: "Appearance",
        marker: "🎨",
        items: [
            {
                label: "Theme",
                href: "/admin/theme",
                icon: Palette,
                permission: "settings:read",
            },
            {
                label: "Colors",
                href: "/admin/theme?view=colors",
                icon: Brush,
                permission: "settings:read",
            },
            {
                label: "Typography",
                href: "/admin/theme?view=typography",
                icon: Type,
                permission: "settings:read",
            },
            {
                label: "Animations",
                href: "/admin/theme?view=animations",
                icon: Sparkles,
                permission: "settings:read",
            },
            {
                label: "Three.js Background",
                href: "/admin/theme?view=threejs-background",
                icon: Waves,
                permission: "settings:read",
            },
            {
                label: "DevOps Infinity Loop",
                href: "/admin/theme?view=devops-infinity-loop",
                icon: InfinityIcon,
                permission: "settings:read",
            },
            {
                label: "Terminal",
                href: "/admin/theme?view=terminal",
                icon: TerminalSquare,
                permission: "settings:read",
            },
            {
                label: "Components",
                href: "/admin/website-builder?view=components",
                icon: Component,
                permission: "settings:read",
            },
        ],
    },
    {
        label: "Admin",
        marker: "⚙",
        items: [
            {
                label: "Users",
                href: "/admin/users",
                icon: Users,
                permission: "users:read",
            },
            {
                label: "Roles",
                href: "/admin/roles",
                icon: UserCog,
                permission: "users:read",
            },
            {
                label: "Permissions",
                href: "/admin/roles?view=permissions",
                icon: ShieldCheck,
                permission: "users:read",
            },
            {
                label: "Activity Logs",
                href: "/admin/activity-logs?view=admin",
                icon: ScrollText,
                permission: "audit:read",
            },
            {
                label: "Notifications",
                href: "/admin/notifications",
                icon: Bell,
                permission: "settings:read",
            },
            {
                label: "Settings",
                href: "/admin/settings",
                icon: Settings,
                permission: "settings:read",
            },
        ],
    },
    {
        label: "Database",
        marker: "🗄",
        items: [
            {
                label: "PostgreSQL",
                href: "/admin/system-health?view=postgresql",
                icon: Database,
                permission: "settings:read",
            },
            {
                label: "Prisma Studio",
                href: "/admin/system-health?view=prisma-studio",
                icon: SearchCode,
                permission: "settings:read",
            },
            {
                label: "Tables",
                href: "/admin/system-health?view=tables",
                icon: Table2,
                permission: "settings:read",
            },
            {
                label: "Migrations",
                href: "/admin/system-health?view=migrations",
                icon: Workflow,
                permission: "settings:read",
            },
            {
                label: "Seed Data",
                href: "/admin/system-health?view=seed-data",
                icon: Sparkles,
                permission: "settings:read",
            },
            {
                label: "Query Console",
                href: "/admin/system-health?view=query-console",
                icon: TerminalSquare,
                permission: "settings:read",
            },
            {
                label: "Backups",
                href: "/admin/backup",
                icon: HardDrive,
                permission: "backup:read",
            },
            {
                label: "Restore",
                href: "/admin/backup?view=restore",
                icon: RefreshCcw,
                permission: "backup:read",
            },
        ],
    },
    {
        label: "DevOps",
        marker: "🐳",
        items: [
            {
                label: "Docker",
                href: "/admin/system-health?view=docker",
                icon: Box,
                permission: "settings:read",
            },
            {
                label: "Containers",
                href: "/admin/system-health?view=containers",
                icon: Boxes,
                permission: "settings:read",
            },
            {
                label: "Deployments",
                href: "/admin/integrations?view=deployments",
                icon: Rocket,
                permission: "integrations:read",
            },
            {
                label: "Environment Variables",
                href: "/admin/settings?view=environment-variables",
                icon: Variable,
                permission: "settings:read",
            },
            {
                label: "Storage",
                href: "/admin/system-health?view=storage",
                icon: HardDrive,
                permission: "settings:read",
            },
            {
                label: "Cache",
                href: "/admin/settings?view=cache",
                icon: Database,
                permission: "settings:read",
            },
            {
                label: "Monitoring",
                href: "/admin/system-health?view=monitoring",
                icon: MonitorCog,
                permission: "settings:read",
            },
        ],
    },
    {
        label: "Analytics",
        marker: "📈",
        items: [
            {
                label: "Visitors",
                href: "/admin/analytics?view=visitors",
                icon: Users,
                permission: "analytics:read",
            },
            {
                label: "Resume Downloads",
                href: "/admin/analytics?view=resume-downloads",
                icon: FileDown,
                permission: "analytics:read",
            },
            {
                label: "GitHub Clicks",
                href: "/admin/analytics?view=github-clicks",
                icon: Github,
                permission: "analytics:read",
            },
            {
                label: "Contact Messages",
                href: "/admin/forms",
                icon: MessageSquare,
                permission: "inbox:read",
            },
            {
                label: "Popular Pages",
                href: "/admin/analytics?view=popular-pages",
                icon: MousePointerClick,
                permission: "analytics:read",
            },
            {
                label: "Traffic",
                href: "/admin/analytics?view=traffic",
                icon: TrafficCone,
                permission: "analytics:read",
            },
        ],
    },
    {
        label: "Security",
        marker: "🔐",
        items: [
            { label: "Security", href: "/admin/security", icon: Lock },
            { label: "Sessions", href: "/admin/sessions", icon: MonitorCog },
            {
                label: "API Keys",
                href: "/admin/api-keys",
                icon: KeyRound,
                permission: "api-keys:read",
            },
            {
                label: "Login History",
                href: "/admin/sessions?view=login-history",
                icon: FileClock,
            },
            {
                label: "Audit Logs",
                href: "/admin/activity-logs?view=audit",
                icon: ScrollText,
                permission: "audit:read",
            },
            {
                label: "Rate Limits",
                href: "/admin/security?view=rate-limits",
                icon: Gauge,
            },
        ],
    },
    {
        label: "Account",
        marker: "👤",
        items: [
            { label: "Profile", href: "/admin/profile", icon: User },
            {
                label: "Preferences",
                href: "/admin/preferences",
                icon: Settings,
            },
        ],
    },
];

/** Flatten all nav items for the command palette. */
export const ALL_NAV_ITEMS: NavItem[] = ADMIN_NAV.flatMap(
    (section) => section.items,
);
