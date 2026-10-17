import { navGroups, type NavGroup, type NavItem } from "@/components/layout/nav";
import { can } from "@/core/rbac";
import type { SessionUser } from "@/core/auth/session";

async function isAllowed(user: SessionUser, item: NavItem): Promise<boolean> {
  if (item.permissions?.length) {
    for (const permission of item.permissions) {
      if (await can(user, permission)) return true;
    }
    return false;
  }
  if (item.permission) return can(user, item.permission);
  return true;
}

/** Filters navigation to what the user is actually permitted to open. */
export async function filterNav(user: SessionUser): Promise<NavGroup[]> {
  const out: NavGroup[] = [];
  for (const group of navGroups) {
    const items: NavGroup["items"] = [];
    for (const item of group.items) {
      if (item.children?.length) {
        const children: NavItem[] = [];
        for (const child of item.children) {
          if (await isAllowed(user, child)) children.push(child);
        }
        if (children.length) items.push({ ...item, children });
      } else if (await isAllowed(user, item)) {
        items.push(item);
      }
    }
    if (items.length) out.push({ ...group, items });
  }
  return out;
}
