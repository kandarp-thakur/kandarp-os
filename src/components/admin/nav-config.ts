/**
 * Admin navigation config — the sidebar structure.
 *
 * Grouped into sections (Main, Content, Site, Media, Insights, System,
 * Account). Each item has an icon (lucide-react), a label, and an href.
 * The sidebar component maps over this to render the nav tree.
 */

import {
    Award,
    BadgeCheck,
    Bell,
    Briefcase,
    ClipboardList,
    Database,
    FileText,
    FolderKanban,
    FolderTree,
    Globe,
    GraduationCap,
    HeartPulse,
    Image,
    KeyRound,
    LayoutDashboard,
    LayoutTemplate,
    type LucideIcon,
    Lock,
    Menu,
    MonitorSmartphone,
    Navigation,
    Network,
    Palette,
    PanelBottom,
    Plug,
    ScrollText,
    Search,
    Settings,
    ShieldCheck,
    SlidersHorizontal,
    User,
    Users,
    Wrench,
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
    items: NavItem[];
}

export const ADMIN_NAV: NavSection[] = [
    {
        label: "Main",
        items: [
            { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
            {
                label: "Search",
                href: "/admin/search",
                icon: Search,
                permission: "content:read",
            },
        ],
    },
    {
        label: "Content",
        items: [
            {
                label: "Projects",
                href: "/admin/projects",
                icon: FolderKanban,
                permission: "content:read",
            },
            {
                label: "Blog",
                href: "/admin/blog",
                icon: FileText,
                permission: "content:read",
            },
            {
                label: "Experience",
                href: "/admin/experience",
                icon: Briefcase,
                permission: "content:read",
            },
            {
                label: "Skills",
                href: "/admin/skills",
                icon: Network,
                permission: "content:read",
            },
            {
                label: "Infrastructure",
                href: "/admin/infrastructure",
                icon: Database,
                permission: "content:read",
            },
            {
                label: "Awards",
                href: "/admin/awards",
                icon: Award,
                permission: "content:read",
            },
            {
                label: "Education",
                href: "/admin/education",
                icon: GraduationCap,
                permission: "content:read",
            },
            {
                label: "Certificates",
                href: "/admin/certificates",
                icon: BadgeCheck,
                permission: "content:read",
            },
            {
                label: "Services",
                href: "/admin/services",
                icon: Wrench,
                permission: "content:read",
            },
            {
                label: "Resume",
                href: "/admin/resumes",
                icon: FileText,
                permission: "content:read",
            },
        ],
    },
    {
        label: "Site",
        items: [
            {
                label: "Website Builder",
                href: "/admin/website-builder",
                icon: LayoutTemplate,
                permission: "settings:read",
            },
            {
                label: "Navigation",
                href: "/admin/navigation",
                icon: Navigation,
                permission: "settings:read",
            },
            {
                label: "Theme & Branding",
                href: "/admin/theme",
                icon: Palette,
                permission: "settings:read",
            },
            {
                label: "SEO",
                href: "/admin/seo",
                icon: Globe,
                permission: "settings:read",
            },
            {
                label: "Forms",
                href: "/admin/forms",
                icon: ClipboardList,
                permission: "analytics:read",
            },
            {
                label: "Menus",
                href: "/admin/menus",
                icon: Menu,
                permission: "settings:read",
            },
            {
                label: "Footer",
                href: "/admin/footer",
                icon: PanelBottom,
                permission: "settings:read",
            },
        ],
    },
    {
        label: "Media",
        items: [
            {
                label: "Media Library",
                href: "/admin/media",
                icon: Image,
                permission: "media:read",
            },
            {
                label: "Asset Manager",
                href: "/admin/asset-manager",
                icon: FolderTree,
                permission: "media:read",
            },
        ],
    },
    {
        label: "Insights",
        items: [
            {
                label: "Analytics",
                href: "/admin/analytics",
                icon: Globe,
                permission: "analytics:read",
            },
            {
                label: "Activity Logs",
                href: "/admin/activity-logs",
                icon: ScrollText,
                permission: "audit:read",
            },
        ],
    },
    {
        label: "System",
        items: [
            {
                label: "Users",
                href: "/admin/users",
                icon: Users,
                permission: "users:read",
            },
            {
                label: "Roles & Permissions",
                href: "/admin/roles",
                icon: ShieldCheck,
                permission: "users:read",
            },
            {
                label: "Settings",
                href: "/admin/settings",
                icon: Settings,
                permission: "settings:read",
            },
            {
                label: "Backup & Restore",
                href: "/admin/backup",
                icon: Database,
                permission: "backup:read",
            },
            {
                label: "Notifications",
                href: "/admin/notifications",
                icon: Bell,
                permission: "settings:read",
            },
            {
                label: "Integrations",
                href: "/admin/integrations",
                icon: Plug,
                permission: "settings:read",
            },
            {
                label: "API Keys",
                href: "/admin/api-keys",
                icon: KeyRound,
                permission: "settings:read",
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
        label: "Account",
        items: [
            { label: "Profile", href: "/admin/profile", icon: User },
            { label: "Security", href: "/admin/security", icon: Lock },
            {
                label: "Sessions",
                href: "/admin/sessions",
                icon: MonitorSmartphone,
            },
            {
                label: "Preferences",
                href: "/admin/preferences",
                icon: SlidersHorizontal,
            },
        ],
    },
];

/** Flatten all nav items for the command palette. */
export const ALL_NAV_ITEMS: NavItem[] = ADMIN_NAV.flatMap((s) => s.items);
