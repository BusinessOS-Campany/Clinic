"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { interactionSchema, type InteractionValues } from "./schema";

type Result =
  | { ok: true; id: string }
  | { ok: false; error: "no-clinic" | "not-found" | "invalid" | "conflict" };

export type InteractionRow = {
  id: string;
  drugA: string;
  drugB: string;
  severity: string;
  description: string | null;
};

export async function listInteractions(): Promise<InteractionRow[]> {
  const user = await requirePermission("pharmacy:read");
  const clinicId = user.currentClinicId ?? "";
  const rows = await prisma.medicationInteraction.findMany({
    where: { clinicId },
    orderBy: [{ drugA: "asc" }, { drugB: "asc" }],
    take: 1000,
  });
  return rows.map((r) => ({
    id: r.id,
    drugA: r.drugA,
    drugB: r.drugB,
    severity: r.severity,
    description: r.description,
  }));
}

async function pairExists(
  clinicId: string,
  drugA: string,
  drugB: string,
  ignoreId?: string,
) {
  return prisma.medicationInteraction.findFirst({
    where: {
      clinicId,
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
      OR: [
        { drugA, drugB },
        { drugA: drugB, drugB: drugA },
      ],
    },
    select: { id: true },
  });
}

export async function createInteraction(
  values: InteractionValues,
): Promise<Result> {
  const user = await requirePermission("pharmacy:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = interactionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  if (await pairExists(clinicId, v.drugA, v.drugB)) {
    return { ok: false, error: "conflict" };
  }

  const created = await prisma.medicationInteraction.create({
    data: {
      clinicId,
      drugA: v.drugA,
      drugB: v.drugB,
      severity: v.severity,
      description: v.description ?? null,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "MedicationInteraction",
    entityId: created.id,
    clinicId,
    metadata: { drugA: v.drugA, drugB: v.drugB, severity: v.severity },
  });
  revalidatePath("/pharmacy/interactions");
  return { ok: true, id: created.id };
}

export async function updateInteraction(
  id: string,
  values: InteractionValues,
): Promise<Result> {
  const user = await requirePermission("pharmacy:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = interactionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.medicationInteraction.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  if (await pairExists(clinicId, v.drugA, v.drugB, id)) {
    return { ok: false, error: "conflict" };
  }

  await prisma.medicationInteraction.update({
    where: { id },
    data: {
      drugA: v.drugA,
      drugB: v.drugB,
      severity: v.severity,
      description: v.description ?? null,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "MedicationInteraction",
    entityId: id,
    clinicId,
    metadata: { drugA: v.drugA, drugB: v.drugB, severity: v.severity },
  });
  revalidatePath("/pharmacy/interactions");
  return { ok: true, id };
}

export async function deleteInteraction(id: string): Promise<Result> {
  const user = await requirePermission("pharmacy:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await prisma.medicationInteraction.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.medicationInteraction.delete({ where: { id } });

  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "MedicationInteraction",
    entityId: id,
    clinicId,
  });
  revalidatePath("/pharmacy/interactions");
  return { ok: true, id };
}
