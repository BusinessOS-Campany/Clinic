import { cache } from "react";
import { prisma } from "@/lib/db";
import type { PermissionCode } from "./catalog";

type AuthUser = {
  id: string;
  roleId?: string;
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

/**
 * Server-side authorization check. Super administrators bypass module checks.
 */
export async function can(
  user: AuthUser,
  permission: PermissionCode,
): Promise<boolean> {
  if (!user.roleId) return false;
  const { code, permissions } = await loadRole(user.roleId);
  if (!code) return false;
  if (code === "super_admin") return true;
  return permissions.has(permission);
}