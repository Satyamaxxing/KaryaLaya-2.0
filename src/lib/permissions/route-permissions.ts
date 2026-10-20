/**
 * KaryaLaya 2.0 — Canonical Route Permission Map
 * Location: src/lib/permissions/route-permissions.ts
 *
 * Single source of truth for:
 * 1. Server-side route permissions (403 guard)
 * 2. Role-based navigation items in the sidebar
 * 3. Role-based post-login redirection targets
 */

export type PrincipalRole = "OWNER" | "MANAGER" | "MEMBER" | "CLIENT";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export interface RoleRouteConfig {
  allowedPrefixes: string[];
  deniedPrefixes: string[];
  sidebarNav: NavItem[];
  defaultRedirect: string;
}

export const ROLE_ROUTE_MAP: Record<PrincipalRole, RoleRouteConfig> = {
  OWNER: {
    allowedPrefixes: [
      "/app/dashboard",
      "/app/clients",
      "/app/projects",
      "/app/calendar",
      "/app/social",
      "/app/team",
      "/app/analytics",
      "/app/settings",
      "/app/documents",
      "/app/activity",
      "/app/ai",
      "/app/automations",
      "/app/my-work",
    ],
    deniedPrefixes: ["/client"],
    sidebarNav: [
      { label: "Dashboard", href: "/app/dashboard", icon: "📊" },
      { label: "Clients", href: "/app/clients", icon: "🏢" },
      { label: "Projects", href: "/app/projects", icon: "📁" },
      { label: "Calendar", href: "/app/calendar", icon: "📅" },
      { label: "Social", href: "/app/social", icon: "📱" },
      { label: "Team", href: "/app/team", icon: "👥" },
      { label: "Analytics", href: "/app/analytics", icon: "📈" },
      { label: "Settings", href: "/app/settings", icon: "⚙️" },
    ],
    defaultRedirect: "/app/dashboard",
  },
  MANAGER: {
    allowedPrefixes: [
      "/app/dashboard",
      "/app/my-work",
      "/app/clients",
      "/app/projects",
      "/app/calendar",
      "/app/social",
      "/app/team",
      "/app/documents",
      "/app/activity",
      "/app/ai",
    ],
    deniedPrefixes: [
      "/app/analytics",
      "/app/automations",
      "/app/settings",
      "/client",
    ],
    sidebarNav: [
      { label: "Dashboard", href: "/app/dashboard", icon: "📊" },
      { label: "My Work", href: "/app/my-work", icon: "⚡" },
      { label: "Clients", href: "/app/clients", icon: "🏢" },
      { label: "Projects", href: "/app/projects", icon: "📁" },
      { label: "Calendar", href: "/app/calendar", icon: "📅" },
      { label: "Social", href: "/app/social", icon: "📱" },
      { label: "Team", href: "/app/team", icon: "👥" },
    ],
    defaultRedirect: "/app/dashboard",
  },
  MEMBER: {
    allowedPrefixes: [
      "/app/dashboard",
      "/app/my-work",
      "/app/projects",
      "/app/calendar",
      "/app/social",
      "/app/documents",
      "/app/activity",
    ],
    deniedPrefixes: [
      "/app/clients",
      "/app/team",
      "/app/analytics",
      "/app/automations",
      "/app/settings",
      "/client",
    ],
    sidebarNav: [
      { label: "Dashboard", href: "/app/dashboard", icon: "📊" },
      { label: "My Work", href: "/app/my-work", icon: "⚡" },
      { label: "Projects", href: "/app/projects", icon: "📁" },
      { label: "Calendar", href: "/app/calendar", icon: "📅" },
      { label: "Social", href: "/app/social", icon: "📱" },
    ],
    defaultRedirect: "/app/dashboard",
  },
  CLIENT: {
    allowedPrefixes: [
      "/client",
    ],
    deniedPrefixes: [
      "/app",
    ],
    sidebarNav: [],
    defaultRedirect: "/client",
  },
};

/**
 * Checks whether a given role is allowed to access a specific route pathname.
 */
export function canAccessRoute(role: string, pathname: string): boolean {
  const config = ROLE_ROUTE_MAP[role as PrincipalRole];
  if (!config) return false;

  // Check explicit denied prefixes first
  for (const denied of config.deniedPrefixes) {
    if (pathname === denied || pathname.startsWith(denied + "/") || pathname.startsWith(denied + "?")) {
      return false;
    }
  }

  // Check allowed prefixes
  for (const allowed of config.allowedPrefixes) {
    if (pathname === allowed || pathname.startsWith(allowed + "/") || pathname.startsWith(allowed + "?")) {
      return true;
    }
  }

  return false;
}

/**
 * Retrieves the canonical sidebar navigation list for a given role.
 */
export function getSidebarNavForRole(role: string): NavItem[] {
  return ROLE_ROUTE_MAP[role as PrincipalRole]?.sidebarNav || [];
}

/**
 * Retrieves the post-login destination URL for a role.
 */
export function getDefaultRedirectForRole(role: string): string {
  return ROLE_ROUTE_MAP[role as PrincipalRole]?.defaultRedirect || "/app/dashboard";
}
