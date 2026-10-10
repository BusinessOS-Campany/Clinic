"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { textSearchMode } from "@/lib/search";
import { medicationSchema, type MedicationFormValues } from "./schema";

type Result =
  | { ok: true; id: string }
  | { ok: false; error: "no-clinic" | "not-found" | "invalid" | "conflict" };

export type MedicationRow = {
  id: string;
  code: string;
  genericName: string;
  brandName: string | null;
  strength: string | null;
  strengthUnit: string | null;
  form: string;
  route: string;
  category: string | null;
  atcCode: string | null;
  isControlled: boolean;
  isActive: boolean;
};

function serialize(m: {
  id: string;
  code: string;
  genericName: string;
  brandName: string | null;
  strength: string | null;
  strengthUnit: string | null;
  form: string;
  route: string;
  category: string | null;
  atcCode: string | null;
  isControlled: boolean;
  isActive: boolean;
}): MedicationRow {
  return {
    id: m.id,
    code: m.code,
    genericName: m.genericName,
    brandName: m.brandName,
    strength: m.strength,
    strengthUnit: m.strengthUnit,
    form: m.form,
    route: m.route,
    category: m.category,
    atcCode: m.atcCode,
    isControlled: m.isControlled,
    isActive: m.isActive,
  };
}

export async function listMedications(search?: string): Promise<MedicationRow[]> {
  const user = await requirePermission("pharmacy:read");
  const clinicId = user.currentClinicId ?? "";
  const term = search?.trim();
  const mode = term ? textSearchMode(term) : undefined;
  const rows = await prisma.medication.findMany({
    where: {
      clinicId,
      ...(term
        ? {
            OR: [
              { code: { contains: term, ...(mode ? { mode } : {}) } },
              { genericName: { contains: term, ...(mode ? { mode } : {}) } },
              { brandName: { contains: term, ...(mode ? { mode } : {}) } },
              { category: { contains: term, ...(mode ? { mode } : {}) } },
            ],
          }
        : {}),
    },
    orderBy: [{ genericName: "asc" }],
    take: 500,
  });
  return rows.map(serialize);
}

export async function createMedication(
  values: MedicationFormValues,
): Promise<Result> {
  const user = await requirePermission("pharmacy:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = medicationSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.medication.findFirst({
    where: { clinicId, code: v.code },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "conflict" };

  const created = await prisma.medication.create({
    data: {
      clinicId,
      code: v.code,
      genericName: v.genericName,
      brandName: v.brandName || null,
      strength: v.strength || null,
      strengthUnit: v.strengthUnit || null,
      form: v.form,
      route: v.route,
      atcCode: v.atcCode || null,
      category: v.category || null,
      isControlled: v.isControlled ?? false,
      isActive: v.isActive ?? true,
      notes: v.notes || null,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Medication",
    entityId: created.id,
    clinicId,
    metadata: { code: v.code, genericName: v.genericName },
  });
  revalidatePath("/pharmacy/medications");
  return { ok: true, id: created.id };
}

export async function updateMedication(
  id: string,
  values: MedicationFormValues,
): Promise<Result> {
  const user = await requirePermission("pharmacy:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = medicationSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.medication.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  const clash = await prisma.medication.findFirst({
    where: { clinicId, code: v.code, id: { not: id } },
    select: { id: true },
  });
  if (clash) return { ok: false, error: "conflict" };

  await prisma.medication.update({
    where: { id },
    data: {
      code: v.code,
      genericName: v.genericName,
      brandName: v.brandName || null,
      strength: v.strength || null,
      strengthUnit: v.strengthUnit || null,
      form: v.form,
      route: v.route,
      atcCode: v.atcCode || null,
      category: v.category || null,
      isControlled: v.isControlled ?? false,
      isActive: v.isActive ?? true,
      notes: v.notes || null,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Medication",
    entityId: id,
    clinicId,
    metadata: { code: v.code },
  });
  revalidatePath("/pharmacy/medications");
  return { ok: true, id };
}

export async function toggleMedicationActive(id: string): Promise<Result> {
  const user = await requirePermission("pharmacy:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const med = await prisma.medication.findFirst({
    where: { id, clinicId },
    select: { id: true, isActive: true },
  });
  if (!med) return { ok: false, error: "not-found" };

  await prisma.medication.update({
    where: { id },
    data: { isActive: !med.isActive },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Medication",
    entityId: id,
    clinicId,
    metadata: { isActive: !med.isActive },
  });
  revalidatePath("/pharmacy/medications");
  return { ok: true, id };
}
