import { redirect } from "next/navigation";
import { requirePermission, requireAnyPermission, requireAllPermissions } from "@/core/auth/session";
import type { PermissionCode } from "@/core/rbac/catalog";

/**
 * Server component guard - use at the top of a page or layout component
 * to enforce permissions before rendering.
 *
 * @example
 * ```tsx
 * import { guard } from "@/core/auth/guard";
 * import type { PermissionCode } from "@/core/rbac/catalog";
 *
 * export default async function MyPage() {
 *   await guard("patients:write");
 *   // ... rest of page
 * }
 * ```
 */
export async function guard(
  permission: PermissionCode,
  options: { scope?: { clinicId?: string; departmentId?: string } } = {},
): Promise<void> {
  await requirePermission(permission, options.scope);
}

/**
 * Guard requiring any of the given permissions.
 */
export async function guardAny(
  permissions: PermissionCode[],
  options: { scope?: { clinicId?: string; departmentId?: string } } = {},
): Promise<void> {
  await requireAnyPermission(permissions, options.scope);
}

/**
 * Guard requiring all of the given permissions.
 */
export async function guardAll(
  permissions: PermissionCode[],
  options: { scope?: { clinicId?: string; departmentId?: string } } = {},
): Promise<void> {
  await requireAllPermissions(permissions, options.scope);
}

/**
 * Get current user in a server component with optional permission check.
 */
export async function getUserOrRedirect(
  permission?: string,
  scope?: { clinicId?: string; departmentId?: string },
): Promise<{
  id: string;
  name: string;
  email: string;
  username: string;
  roleId: string;
  roleCode?: string;
  currentClinicId?: string | null;
  departmentId?: string | null;
}> {
  if (permission) {
    await guard(permission as any, { scope });
    return await import("@/core/auth/session").then((m) => m.requirePermission(permission as any));
  }
  return await import("@/core/auth/session").then((m) => m.requireUser());
}