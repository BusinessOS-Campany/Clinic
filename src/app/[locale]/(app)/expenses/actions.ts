"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";

const schema = z.object({
  category: z.string().optional(),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

export async function createExpense(formData: FormData) {
  const user = await requirePermission("accounting:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) throw new Error("no clinic");

  const parsed = schema.safeParse({
    category: formData.get("category") || undefined,
    description: formData.get("description") || undefined,
    amount: formData.get("amount") || undefined,
    paidAt: formData.get("paidAt") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) throw new Error("invalid");

  await prisma.expense.create({
    data: {
      clinicId,
      category: parsed.data.category || null,
      description: parsed.data.description,
      amount: parsed.data.amount,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : new Date(),
      paidById: user.id,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/expenses");
}

export async function deleteExpense(id: string) {
  await requirePermission("accounting:write");
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
}
