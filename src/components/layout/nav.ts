import type { PermissionCode } from "@/core/rbac/catalog";

export type IconKey =
  | "dashboard"
  | "patients"
  | "appointments"
  | "scheduling"
  | "reception"
  | "encounters"
  | "nursing"
  | "lab"
  | "pharmacy"
  | "imaging"
  | "inventory"
  | "billing"
  | "users"
  | "reports"
  | "audit"
  | "settings";

export type NavItem = {
  key: string;
  href: string;
  iconKey: IconKey;
  permission?: PermissionCode;
};

export type NavGroup = {
  key: "main" | "clinical" | "operations" | "financial" | "admin";
  items: NavItem[];
};

/**
 * Sidebar navigation. Items are added here as modules ship; every item
 * must resolve to a functional, permission-protected page. Icon components
 * are NOT allowed here — icons are resolved client-side from `iconKey` so
 * nav data can cross the server→client boundary (see nav-icons.ts).
 */
export const navGroups: NavGroup[] = [
  {
    key: "main",
    items: [
      { key: "dashboard", href: "/", iconKey: "dashboard" },
      {
        key: "patients",
        href: "/patients",
        iconKey: "patients",
        permission: "patients:read",
      },
      { key: "reports", href: "/reports", iconKey: "reports", permission: "reports:read" },
    ],
  },
  {
    key: "clinical",
    items: [
      {
        key: "appointments",
        href: "/appointments",
        iconKey: "appointments",
        permission: "appointments:read",
      },
      {
        key: "scheduling",
        href: "/scheduling",
        iconKey: "scheduling",
        permission: "scheduling:read",
      },
      {
        key: "reception",
        href: "/reception",
        iconKey: "reception",
        permission: "reception:read",
      },
      {
        key: "encounters",
        href: "/encounters",
        iconKey: "encounters",
        permission: "encounters:read",
      },
      {
        key: "nursing",
        href: "/nursing",
        iconKey: "nursing",
        permission: "nursing:read",
      },
    ],
  },
  {
    key: "operations",
    items: [
      { key: "lab", href: "/lab", iconKey: "lab", permission: "laboratory:read" },
      { key: "pharmacy", href: "/pharmacy", iconKey: "pharmacy", permission: "pharmacy:read" },
      { key: "imaging", href: "/imaging", iconKey: "imaging", permission: "laboratory:read" },
      { key: "inventory", href: "/inventory", iconKey: "inventory", permission: "inventory:read" },
    ],
  },
  {
    key: "financial",
    items: [
      { key: "billing", href: "/billing", iconKey: "billing", permission: "billing:read" },
    ],
  },
  {
    key: "admin",
    items: [
      { key: "users", href: "/users", iconKey: "users", permission: "users:manage" },
      { key: "audit", href: "/audit", iconKey: "audit", permission: "audit:read" },
      { key: "settings", href: "/settings", iconKey: "settings", permission: "settings:read" },
    ],
  },
];

export function findNavHref(pathname: string): string | undefined {
  const normalized = pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  let best: string | undefined;
  let bestLen = 0;
  for (const group of navGroups) {
    for (const item of group.items) {
      if (normalized === item.href) return item.href;
      if (normalized.startsWith(item.href) && item.href.length > bestLen) {
        best = item.href;
        bestLen = item.href.length;
      }
    }
  }
  return best;
}