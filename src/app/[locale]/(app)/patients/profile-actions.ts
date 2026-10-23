"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import type { PermissionCode } from "@/core/rbac/catalog";
import {
  RECORD_CONFIGS,
  isProfileEntity,
  type ProfileActionResult,
  type ProfileEntity,
  type RecordValues,
} from "@/lib/patient-profile/entities";
import { currentMedicationSchema } from "@/app/[locale]/(app)/encounters/schema";
import { deleteDocumentFile } from "@/lib/documents/storage";

const MODEL_BY_ENTITY = {
  history: "medicalHistory",
  allergies: "allergy",
  procedures: "procedure",
  documents: "patientDocument",
  referrals: "referral",
} as const satisfies Record<ProfileEntity, string>;

const PERMISSION_BY_ENTITY = {
  history: "encounters:write",
  allergies: "encounters:write",
  procedures: "encounters:write",
  documents: "patients:write",
  referrals: "patients:write",
} as const satisfies Record<ProfileEntity, PermissionCode>;

type RowDelegate = {
  findFirst: (args: {
    where: Record<string, unknown>;
    select: { id: true; patientId: true };
  }) => Promise<{ id: string; patientId: string } | null>;
  create: (args: {
    data: Record<string, unknown>;
    select: { id: true };
  }) => Promise<{ id: string }>;
  update: (args: {
    where: { id: string };
    data: Record<string, unknown>;
    select: { id: true };
  }) => Promise<{ id: string }>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
};

function delegate(entity: ProfileEntity): RowDelegate {
  return prisma[MODEL_BY_ENTITY[entity]] as unknown as RowDelegate;
}

function refresh(patientId: string) {
  revalidatePath(`/patients/${patientId}`);
}

export async function createProfileRecord(
  entity: string,
  patientId: string,
  values: RecordValues,
): Promise<ProfileActionResult> {
  if (!isProfileEntity(entity)) return { ok: false, error: "unknown-entity" };

  const user = await requirePermission(PERMISSION_BY_ENTITY[entity]);
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    select: { id: true, mrn: true },
  });
  if (!patient) return { ok: false, error: "not-found" };

  const config = RECORD_CONFIGS[entity];
  const parsed = config.schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const data = config.toData(
    parsed.data as RecordValues,
    { clinicId, patientId, actorId: user.id },
    "create",
  );
  const row = await delegate(entity).create({ data, select: { id: true } });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: config.entityName,
    entityId: row.id,
    clinicId,
    metadata: { patientId, mrn: patient.mrn },
  });
  refresh(patientId);
  return { ok: true, id: row.id };
}

export async function updateProfileRecord(
  entity: string,
  id: string,
  values: RecordValues,
): Promise<ProfileActionResult> {
  if (!isProfileEntity(entity)) return { ok: false, error: "unknown-entity" };

  const user = await requirePermission(PERMISSION_BY_ENTITY[entity]);
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await delegate(entity).findFirst({
    where: { id, clinicId },
    select: { id: true, patientId: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  const config = RECORD_CONFIGS[entity];
  const parsed = config.schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const data = config.toData(
    parsed.data as RecordValues,
    { clinicId, patientId: existing.patientId, actorId: user.id },
    "update",
  );
  await delegate(entity).update({ where: { id }, data, select: { id: true } });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: config.entityName,
    entityId: id,
    clinicId,
    metadata: { patientId: existing.patientId },
  });
  refresh(existing.patientId);
  return { ok: true, id };
}

export async function addCurrentMedication(
  patientId: string,
  values: unknown,
): Promise<ProfileActionResult> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = currentMedicationSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const encounter = await prisma.encounter.findFirst({
    where: { id: v.encounterId, clinicId, patientId },
    select: { id: true, patientId: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };

  const isPrevious = v.listType === "previous";

  const order = await prisma.medicalOrder.create({
    data: {
      clinicId,
      encounterId: encounter.id,
      patientId: encounter.patientId,
      kind: "MEDICATION",
      name: v.name,
      instructions: v.instructions || null,
      frequency: v.frequency || null,
      durationDays: v.durationDays ?? null,
      quantity: v.quantity || null,
      unit: v.unit || null,
      status: isPrevious ? "COMPLETED" : "ACTIVE",
      prescriptionStatus: isPrevious ? "COMPLETED" : "ACTIVE",
      genericName: v.genericName || null,
      brandName: v.brandName || null,
      strength: v.strength || null,
      dosageForm: v.dosageForm || null,
      route: v.route || null,
      dose: v.dose ?? null,
      doseUnit: v.doseUnit || null,
      startDate: new Date(),
      refills: v.refills ?? 0,
      clinicalIndication: v.clinicalIndication || null,
      createdBy: user.id,
      prescribedBy: user.id,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "MedicalOrder",
    entityId: order.id,
    clinicId,
    metadata: { patientId, encounterId: encounter.id, kind: "MEDICATION" },
  });
  revalidatePath(`/patients/${patientId}`);
  revalidatePath(`/encounters/${encounter.id}`);
  return { ok: true, id: order.id };
}

export async function deleteProfileRecord(
  entity: string,
  id: string,
): Promise<ProfileActionResult> {
  if (!isProfileEntity(entity)) return { ok: false, error: "unknown-entity" };

  const user = await requirePermission(PERMISSION_BY_ENTITY[entity]);
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await delegate(entity).findFirst({
    where: { id, clinicId },
    select: { id: true, patientId: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  let storageKey: string | null = null;
  if (entity === "documents") {
    const doc = await prisma.patientDocument.findFirst({
      where: { id, clinicId },
      select: { storageKey: true },
    });
    storageKey = doc?.storageKey ?? null;
  }

  const config = RECORD_CONFIGS[entity];
  await delegate(entity).delete({ where: { id } });
  if (storageKey) deleteDocumentFile(storageKey);

  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: config.entityName,
    entityId: id,
    clinicId,
    metadata: { patientId: existing.patientId },
  });
  refresh(existing.patientId);
  return { ok: true, id };
}

export async function deleteClinicalNote(
  patientId: string,
  encounterId: string,
): Promise<ProfileActionResult> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const encounter = await prisma.encounter.findFirst({
    where: { id: encounterId, clinicId, patientId },
    select: { id: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };

  await prisma.encounter.update({
    where: { id: encounterId },
    data: {
      chiefComplaint: null,
      subjective: null,
      objective: null,
      assessment: null,
      plan: null,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Encounter",
    entityId: encounterId,
    clinicId,
    metadata: { patientId, cleared: "clinical-notes" },
  });
  revalidatePath(`/patients/${patientId}`);
  revalidatePath(`/encounters/${encounterId}`);
  return { ok: true, id: encounterId };
}