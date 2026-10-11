"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { auth } from "@/core/auth/server";
import { z } from "zod";

type Result = { ok: true; id: string } | { ok: false; error: "no-clinic" | "invalid" | "exists" | "failed" };

const schema = z.object({
  name: z.string().trim().min(1),
  nameAr: z.string().trim().optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().trim().email(),
  password: z.string().min(5),
  roleId: z.string().min(1),
  clinicId: z.string().optional(),
});

export async function createUser(values: unknown): Promise<Result> {
  const user = await requirePermission("users:manage");
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;
  if (!user.roleId) return { ok: false, error: "failed" };

  const [byUsername, byEmail] = await Promise.all([
    prisma.user.findUnique({ where: { username: v.username }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: v.email }, select: { id: true } }),
  ]);
  if (byUsername || byEmail) return { ok: false, error: "exists" };

  try {
    const clinicId = user.currentClinicId ?? v.clinicId ?? null;
    const created = await auth.api.signUpEmail({
      body: {
        email: v.email,
        password: v.password,
        name: v.name,
        username: v.username,
        nameAr: v.nameAr || null,
        roleId: v.roleId,
        clinicId,
        currentClinicId: clinicId,
      },
    });
    const id = typeof created.user?.id === "string" ? created.user.id : "";
    recordAudit({
      actorId: user.id,
      action: "create",
      entity: "User",
      entityId: id,
      clinicId: user.currentClinicId ?? "",
      metadata: { username: v.username, email: v.email, roleId: v.roleId },
    });
    revalidatePath("/users");
    return { ok: true, id };
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function toggleActive(id: string, active: boolean): Promise<Result> {
  const user = await requirePermission("users:manage");
  const where = user.currentClinicId ? { id, clinicId: user.currentClinicId } : { id };
  const target = await prisma.user.findFirst({ where, select: { id: true } });
  if (!target) return { ok: false, error: "failed" };

  await prisma.user.update({ where: { id }, data: { isActive: active } });
  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "User",
    entityId: id,
    clinicId: user.currentClinicId ?? "",
    metadata: { isActive: active },
  });
  revalidatePath("/users");
  return { ok: true, id };
}

export async function assignRole(id: string, roleId: string): Promise<Result> {
  const user = await requirePermission("users:manage");
  const where = user.currentClinicId ? { id, clinicId: user.currentClinicId } : { id };
  const [role, target] = await Promise.all([
    prisma.role.findUnique({ where: { id: roleId }, select: { id: true, code: true } }),
    prisma.user.findFirst({ where, select: { id: true } }),
  ]);
  if (!role || !target) return { ok: false, error: "failed" };

  await prisma.user.update({ where: { id }, data: { roleId } });
  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "User",
    entityId: id,
    clinicId: user.currentClinicId ?? "",
    metadata: { roleId, roleCode: role.code },
  });
  revalidatePath("/users");
  return { ok: true, id };
}