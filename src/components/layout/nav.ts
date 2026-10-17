import type { PermissionCode } from "@/core/rbac/catalog";

export type IconKey =
  | "dashboard"
  | "patients"
  | "tasks"
  | "appointments"
  | "reception"
  | "queue"
  | "encounters"
  | "returns"
  | "nursing"
  | "lab"
  | "pharmacy"
  | "imaging"
  | "inventory"
  | "drugs"
  | "coverages"
  | "billing"
  | "website"
  | "subscribers"
  | "wallet-transfers"
  | "advances"
  | "expenses"
  | "employees"
  | "users"
  | "notifications"
  | "reports"
  | "audit"
  | "settings";

export type NavItem = {
  key: string;
  href?: string;
  iconKey?: IconKey;
  permission?: PermissionCode;
  permissions?: PermissionCode[];
  children?: NavItem[];
};

export type NavGroup = {
  key: "main" | "doctor" | "clinical" | "operations" | "financial" | "admin";
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
      { key: "patients", href: "/patients", iconKey: "patients", permission: "patients:read" },
      { key: "tasks", href: "/tasks", iconKey: "tasks", permissions: ["patients:write", "reception:write", "encounters:write"] },
      { key: "subscribers", href: "/subscribers", iconKey: "subscribers", permission: "patients:read" },
      { key: "notifications", href: "/notifications", iconKey: "notifications", permission: "notifications:read" },
    ],
  },
  {
    key: "doctor",
    items: [
      { key: "queue", href: "/queue", iconKey: "queue", permission: "queue:read" },
      { key: "encounters", href: "/encounters", iconKey: "encounters", permission: "encounters:read" },
      { key: "returns", href: "/returns", iconKey: "returns", permission: "encounters:read" },
    ],
  },
  {
    key: "clinical",
    items: [
      { key: "appointments", href: "/appointments", iconKey: "appointments", permission: "appointments:read" },
    ],
  },
  {
    key: "operations",
    items: [
      { key: "inventory", href: "/inventory", iconKey: "inventory", permission: "inventory:read" },
      { key: "drugs", href: "/drugs/catalog", iconKey: "drugs", permission: "drug:read" },
      { key: "website", href: "/website", iconKey: "website", permission: "settings:read" },
    ],
  },
  {
    key: "financial",
    items: [
      { key: "billing", href: "/billing", iconKey: "billing", permission: "billing:read" },
      { key: "coverages", href: "/coverages", iconKey: "coverages", permission: "insurance:read" },
      { key: "wallet-transfers", href: "/wallet-transfers", iconKey: "wallet-transfers", permission: "financial:read" },
      { key: "advances", href: "/advances", iconKey: "advances", permission: "accounting:read" },
      { key: "expenses", href: "/expenses", iconKey: "expenses", permission: "accounting:read" },
      {
        key: "reports",
        iconKey: "reports",
        permission: "reports:read",
        children: [
          { key: "reportsDaily", href: "/reports/daily", permission: "reports:read" },
          { key: "reportsWeekly", href: "/reports/weekly", permission: "reports:read" },
          { key: "reportsMonthly", href: "/reports/monthly", permission: "reports:read" },
        ],
      },
    ],
  },
  {
    key: "admin",
    items: [
      { key: "employees", href: "/employees", iconKey: "employees", permission: "staff:read" },
      { key: "users", href: "/users", iconKey: "users", permission: "users:manage" },
      { key: "audit", href: "/audit", iconKey: "audit", permission: "audit:read" },
      { key: "settings", href: "/settings", iconKey: "settings", permission: "settings:read" },
    ],
  },
];

export function findNavKey(pathname: string): string | undefined {
  const normalized = pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  let best: string | undefined;
  let bestLen = 0;
  const visit = (item: NavItem) => {
    if (item.href) {
      if (normalized === item.href) {
        best = item.key;
        bestLen = Number.POSITIVE_INFINITY;
      } else if (
        normalized.startsWith(item.href) &&
        item.href.length > bestLen
      ) {
        best = item.key;
        bestLen = item.href.length;
      }
    }
    item.children?.forEach(visit);
  };
  for (const group of navGroups) {
    for (const item of group.items) visit(item);
  }
  return best;
}