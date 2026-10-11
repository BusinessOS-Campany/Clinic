import { cache } from "react";
import { prisma } from "@/lib/db";
import type { PermissionCode } from "./catalog";

type AuthUser = {
  id: string;
  roleId?: string;
  currentClinicId?: string | null;
  departmentId?: string | null;
};

/** Scoping options for permission checks. */
export type ScopeOptions = {
  /** If provided, user must belong to this clinic. */
  clinicId?: string | null;
  /** If provided, user must belong to this department. */
  departmentId?: string | null;
  /** If true, allow access when user's clinic/department is null (global access). */
  allowGlobal?: boolean;
};

const loadRole = cache(async (roleId: string) => {
  if (!roleId) return { code: null, permissions: new Set<string>() };
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      code: true,
      permissions: {
        select: { permission: { select: { code: true } } },
      },
    },
  });
  return {
    code: role?.code ?? null,
    permissions: new Set(
      (role?.permissions ?? []).map((p) => p.permission.code),
    ),
  };
});

const loadUserScope = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentClinicId: true,
      departmentId: true,
      clinicId: true,
    },
  });
  return {
    currentClinicId: user?.currentClinicId ?? null,
    departmentId: user?.departmentId ?? null,
    clinicId: user?.clinicId ?? null,
  };
});

/**
 * Server-side authorization check with optional clinic/department scoping.
 * Super administrators bypass all checks.
 *
 * @param user - The authenticated user (from session)
 * @param permission - The permission code to check
 * @param scope - Optional clinic/department scoping
 */
export async function can(
  user: AuthUser,
  permission: PermissionCode,
  scope: ScopeOptions = {},
): Promise<boolean> {
  if (!user.roleId) return false;

  const { code, permissions } = await loadRole(user.roleId);
  if (!code) return false;

  // Super admin bypasses all checks
  if (code === "super_admin") return true;

  // Check permission
  if (!permissions.has(permission)) return false;

  // If no scoping requested, permission check is sufficient
  if (!scope.clinicId && !scope.departmentId) return true;

  // Load user's clinic/department
  const userScope = await loadUserScope(user.id);

  // Clinic scoping
  if (scope.clinicId) {
    const allowedClinics = [userScope.currentClinicId, userScope.clinicId].filter(Boolean);
    if (!allowedClinics.includes(scope.clinicId)) {
      if (!(scope.allowGlobal && allowedClinics.length === 0)) {
        return false;
      }
    }
  }

  // Department scoping
  if (scope.departmentId) {
    if (userScope.departmentId !== scope.departmentId) {
      if (!(scope.allowGlobal && !userScope.departmentId)) {
        return false;
      }
    }
  }

  return true;
}

/** Check multiple permissions (all must pass). */
export async function canAll(
  user: AuthUser,
  permissions: PermissionCode[],
  scope: ScopeOptions = {},
): Promise<boolean> {
  for (const perm of permissions) {
    if (!(await can(user, perm, scope))) return false;
  }
  return true;
}

/** Check if user has any of the given permissions (at least one must pass). */
export async function canAny(
  user: AuthUser,
  permissions: PermissionCode[],
  scope: ScopeOptions = {},
): Promise<boolean> {
  for (const perm of permissions) {
    if (await can(user, perm, scope)) return true;
  }
  return false;
}

/** Get user's accessible clinic IDs. */
export async function getUserClinicIds(userId: string): Promise<string[]> {
  const scope = await loadUserScope(userId);
  return [scope.currentClinicId, scope.clinicId].filter(Boolean) as string[];
}

/** Get user's department ID. */
export async function getUserDepartmentId(userId: string): Promise<string | null> {
  const scope = await loadUserScope(userId);
  return scope.departmentId;
}