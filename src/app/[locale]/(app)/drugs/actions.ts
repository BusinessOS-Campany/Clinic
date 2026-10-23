"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { drugCatalogSchema, drugInteractionSchema, type DrugCatalogValues, type DrugInteractionValues } from "./schema";

type Result =
  | { ok: true; id: string }
  | { ok: false; error: "no-clinic" | "not-found" | "invalid" | "conflict" };

export async function createDrugCatalogEntry(values: unknown): Promise<Result> {
  const user = await requirePermission("drug:catalog");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = drugCatalogSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.drugCatalog.findUnique({
    where: { clinicId_genericName_strength_dosageForm: { clinicId, genericName: v.genericName, strength: v.strength, dosageForm: v.dosageForm } },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "conflict" };

  const entry = await prisma.drugCatalog.create({
    data: {
      clinicId,
      genericName: v.genericName,
      genericNameAr: v.genericNameAr || null,
      brandNames: v.brandNames || null,
      strength: v.strength,
      dosageForm: v.dosageForm,
      route: v.route,
      atcCode: v.atcCode || null,
      category: v.category || null,
      manufacturer: v.manufacturer || null,
      productId: v.productId || null,
      isControlled: v.isControlled ?? false,
      schedule: v.schedule || null,
      maxDailyDose: v.maxDailyDose,
      maxSingleDose: v.maxSingleDose,
      minAge: v.minAge,
      maxAge: v.maxAge,
      pregnancyCategory: v.pregnancyCategory || null,
      renalAdjustment: v.renalAdjustment ?? false,
      hepaticAdjustment: v.hepaticAdjustment ?? false,
      contraindications: v.contraindications || null,
      monitoringRequired: v.monitoringRequired || null,
      isActive: v.isActive ?? true,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "DrugCatalog",
    entityId: entry.id,
    clinicId,
    metadata: { genericName: v.genericName, strength: v.strength, dosageForm: v.dosageForm },
  });
  revalidatePath("/drugs/catalog");
  return { ok: true, id: entry.id };
}

export async function updateDrugCatalogEntry(id: string, values: unknown): Promise<Result> {
  const user = await requirePermission("drug:catalog");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = drugCatalogSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const existing = await prisma.drugCatalog.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.drugCatalog.update({
    where: { id },
    data: parsed.data,
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "DrugCatalog",
    entityId: id,
    clinicId,
  });
  revalidatePath("/drugs/catalog");
  return { ok: true, id };
}

export async function deleteDrugCatalogEntry(id: string): Promise<Result> {
  const user = await requirePermission("drug:catalog");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await prisma.drugCatalog.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.drugCatalog.delete({ where: { id } });

  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "DrugCatalog",
    entityId: id,
    clinicId,
  });
  revalidatePath("/drugs/catalog");
  return { ok: true, id };
}

export async function createDrugInteraction(values: unknown): Promise<Result> {
  const user = await requirePermission("drug:catalog");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = drugInteractionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  if (v.drugId1 === v.drugId2) return { ok: false, error: "invalid" };

  // Ensure consistent ordering for unique constraint
  const [drugId1, drugId2] = v.drugId1 < v.drugId2 ? [v.drugId1, v.drugId2] : [v.drugId2, v.drugId1];

  const existing = await prisma.drugInteraction.findUnique({
    where: { clinicId_drugId1_drugId2: { clinicId, drugId1, drugId2 } },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "conflict" };

  const interaction = await prisma.drugInteraction.create({
    data: {
      clinicId,
      drugId1,
      drugId2,
      severity: v.severity,
      mechanism: v.mechanism || null,
      management: v.management || null,
      evidenceLevel: v.evidenceLevel || null,
      onset: v.onset || null,
      isActive: v.isActive ?? true,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "DrugInteraction",
    entityId: interaction.id,
    clinicId,
    metadata: { drugId1, drugId2, severity: v.severity },
  });
  revalidatePath("/drugs/catalog");
  return { ok: true, id: interaction.id };
}

export async function updateDrugInteraction(id: string, values: unknown): Promise<Result> {
  const user = await requirePermission("drug:catalog");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = drugInteractionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const existing = await prisma.drugInteraction.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  const v = parsed.data;
  const [drugId1, drugId2] = v.drugId1 < v.drugId2 ? [v.drugId1, v.drugId2] : [v.drugId2, v.drugId1];

  await prisma.drugInteraction.update({
    where: { id },
    data: {
      drugId1,
      drugId2,
      severity: v.severity,
      mechanism: v.mechanism || null,
      management: v.management || null,
      evidenceLevel: v.evidenceLevel || null,
      onset: v.onset || null,
      isActive: v.isActive ?? true,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "DrugInteraction",
    entityId: id,
    clinicId,
  });
  revalidatePath("/drugs/catalog");
  return { ok: true, id };
}

export async function deleteDrugInteraction(id: string): Promise<Result> {
  const user = await requirePermission("drug:catalog");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await prisma.drugInteraction.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.drugInteraction.delete({ where: { id } });

  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "DrugInteraction",
    entityId: id,
    clinicId,
  });
  revalidatePath("/drugs/catalog");
  return { ok: true, id };
}