"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";

const schema = z.object({
  employeeId: z.string().min(1),
  amount: z.coerce.number().positive(),
  reason: z.string().optional(),
  givenAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function createAdvance(formData: FormData) {
  const user = await requirePermission("accounting:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) throw new Error("no clinic");

  const parsed = schema.safeParse({
    employeeId: formData.get("employeeId") || undefined,
    amount: formData.get("amount") || undefined,
    reason: formData.get("reason") || undefined,
    givenAt: formData.get("givenAt") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) throw new Error("invalid");

  await prisma.advance.create({
    data: {
      clinicId,
      employeeId: parsed.data.employeeId,
      amount: parsed.data.amount,
      reason: parsed.data.reason || null,
      givenAt: parsed.data.givenAt ? new Date(parsed.data.givenAt) : new Date(),
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/advances");
}

export async function updateAdvanceStatus(id: string, status: string) {
  await requirePermission("accounting:write");
  const data: { status: string; repaidAt?: Date } = { status };
  if (status === "REPAID") data.repaidAt = new Date();
  await prisma.advance.update({ where: { id }, data });
  revalidatePath("/advances");
}

export async function deleteAdvance(id: string) {
  await requirePermission("accounting:write");
  await prisma.advance.delete({ where: { id } });
  revalidatePath("/advances");
}
