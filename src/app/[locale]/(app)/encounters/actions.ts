"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  diagnosisSchema,
  diagnosisStatusSchema,
  diagnosisAmendmentSchema,
  encounterFormSchema,
  orderSchema,
  historyFormSchema,
  examFormSchema,
  planFormSchema,
  type OrderValues,
} from "./schema";

type Result =
  | { ok: true; id: string; awaiting?: boolean }
  | { ok: false; error: "no-clinic" | "not-found" | "invalid" | "not-allowed" | "conflict" };

async function canOrder(user: { id: string; roleId: string }, kind: OrderValues["kind"]) {
  if (await can(user, "encounters:write")) return true;
  if (kind === "MEDICATION") return can(user, "pharmacy:prescribe");
  if (kind === "LABORATORY") return can(user, "laboratory:order");
  return false;
}

export async function startEncounter(
  appointmentId: string,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await prisma.encounter.findFirst({
    where: { appointmentId, clinicId },
    select: { id: true },
  });
  if (existing) return { ok: true, id: existing.id };

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId },
    select: { id: true, patientId: true, type: true, status: true },
  });
  if (!appointment) return { ok: false, error: "not-found" };

  const encounter = await prisma.encounter.create({
    data: {
      clinicId,
      patientId: appointment.patientId,
      appointmentId,
      doctorId: user.id,
      type: appointment.type,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      createdBy: user.id,
      updatedBy: user.id,
    },
    select: { id: true },
  });

  if (appointment.status === "ARRIVED" || appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "IN_SERVICE", updatedBy: user.id },
    });
  }

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Encounter",
    entityId: encounter.id,
    clinicId,
    metadata: { patientId: appointment.patientId, appointmentId },
  });
  revalidatePath("/encounters");
  revalidatePath("/reception");
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointment.id}`);
  revalidatePath(`/patients/${appointment.patientId}/chart`);
  return { ok: true, id: encounter.id };
}

export async function createEncounter(
  patientId: string,
  type: string,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    select: { id: true },
  });
  if (!patient) return { ok: false, error: "not-found" };

  const encounter = await prisma.encounter.create({
    data: {
      clinicId,
      patientId,
      doctorId: user.id,
      type: type as never,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      createdBy: user.id,
      updatedBy: user.id,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Encounter",
    entityId: encounter.id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath("/encounters");
  revalidatePath(`/patients/${patientId}/chart`);
  return { ok: true, id: encounter.id };
}

export async function updateEncounter(
  id: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = encounterFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.encounter.update({
    where: { id },
    data: {
      type: v.type,
      chiefComplaint: v.chiefComplaint || null,
      symptomOnset: v.symptomOnset ? new Date(v.symptomOnset) : null,
      symptomDurationValue: v.symptomDurationValue,
      symptomDurationUnit: v.symptomDurationUnit || null,
      severity: v.severity || null,
      symptoms: v.symptoms ?? [],
      subjective: v.subjective || null,
      objective: v.objective || null,
      physicalExamination: v.physicalExamination || null,
      assessment: v.assessment || null,
      plan: v.plan || null,
      symptomsText: v.symptomsText || null,
      diagnosisText: v.diagnosisText || null,
      labsText: v.labsText || null,
      imagingText: v.imagingText || null,
      treatmentsText: v.treatmentsText || null,
      temperature: v.temperature,
      pulse: v.pulse,
      respRate: v.respRate,
      bpSystolic: v.bpSystolic,
      bpDiastolic: v.bpDiastolic,
      spO2: v.spO2,
      height: v.height,
      weight: v.weight,
      updatedBy: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { fields: Object.keys(parsed.data) },
  });
  revalidatePath("/encounters");
  revalidatePath(`/encounters/${id}`);
  return { ok: true, id };
}

export async function saveEncounterDraft(
  id: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = encounterFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true, status: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  const data: Prisma.EncounterUpdateInput = {
    type: v.type,
    chiefComplaint: v.chiefComplaint || null,
    symptomOnset: v.symptomOnset ? new Date(v.symptomOnset) : null,
    symptomDurationValue: v.symptomDurationValue,
    symptomDurationUnit: v.symptomDurationUnit || null,
    severity: v.severity || null,
    symptoms: v.symptoms ?? [],
    subjective: v.subjective || null,
    objective: v.objective || null,
    physicalExamination: v.physicalExamination || null,
    assessment: v.assessment || null,
    plan: v.plan || null,
    symptomsText: v.symptomsText || null,
    diagnosisText: v.diagnosisText || null,
    labsText: v.labsText || null,
    imagingText: v.imagingText || null,
    treatmentsText: v.treatmentsText || null,
    temperature: v.temperature,
    pulse: v.pulse,
    respRate: v.respRate,
    bpSystolic: v.bpSystolic,
    bpDiastolic: v.bpDiastolic,
    spO2: v.spO2,
    height: v.height,
    weight: v.weight,
    updatedBy: user.id,
  };

  if (existing.status === "IN_PROGRESS") data.status = "DRAFT";

  await prisma.encounter.update({ where: { id }, data });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { draft: true, fields: Object.keys(parsed.data) },
  });
  revalidatePath("/encounters");
  revalidatePath(`/encounters/${id}`);
  return { ok: true, id };
}

export async function completeEncounter(id: string): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const encounter = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true, appointmentId: true, patientId: true, status: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };
  if (encounter.status === "COMPLETED") return { ok: true, id };

  await prisma.$transaction([
    prisma.encounter.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date(), updatedBy: user.id },
    }),
    ...(encounter.appointmentId
      ? [
          prisma.appointment.update({
            where: { id: encounter.appointmentId },
            data: { status: "COMPLETED", updatedBy: user.id },
          }),
        ]
      : []),
  ]);

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { status: "COMPLETED" },
  });
  revalidatePath("/encounters");
  revalidatePath(`/encounters/${id}`);
  revalidatePath("/reception");
  revalidatePath("/appointments");
  revalidatePath(`/patients/${encounter.patientId}/chart`);
  return { ok: true, id };
}

export async function addDiagnosis(
  encounterId: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = diagnosisSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const encounter = await prisma.encounter.findFirst({
    where: { id: encounterId, clinicId },
    select: { id: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };

  const dx = await prisma.encounterDiagnosis.create({
    data: {
      clinicId,
      encounterId,
      code: v.code || null,
      name: v.name,
      description: v.description || null,
      classification: v.classification || "ICD10",
      codeSystem: v.codeSystem || null,
      status: v.status || "PROVISIONAL",
      confidence: v.confidence || null,
      course: v.course || "ACUTE",
      laterality: v.laterality || "NOT_APPLICABLE",
      onsetDate: v.onsetDate ? new Date(v.onsetDate) : null,
      isPrimary: Boolean(v.isPrimary),
      isDifferential: Boolean(v.isDifferential),
      diagnosedBy: v.diagnosedBy || user.id,
      diagnosedAt: v.diagnosedAt ? new Date(v.diagnosedAt) : new Date(),
      clinicalFindings: v.clinicalFindings || null,
      supportingLabResultIds: v.supportingLabResultIds ? JSON.stringify(v.supportingLabResultIds) : null,
      supportingImagingIds: v.supportingImagingIds ? JSON.stringify(v.supportingImagingIds) : null,
      treatmentPlan: v.treatmentPlan || null,
      followUp: v.followUp || null,
      notes: v.notes || null,
      createdBy: user.id,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "EncounterDiagnosis",
    entityId: dx.id,
    clinicId,
    metadata: { encounterId },
  });
  revalidatePath(`/encounters/${encounterId}`);
  return { ok: true, id: dx.id };
}

export async function removeDiagnosis(id: string): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const dx = await prisma.encounterDiagnosis.findFirst({
    where: { id },
    select: { id: true, encounterId: true, clinicId: true },
  });
  if (!dx) return { ok: false, error: "not-found" };
  if (dx.clinicId !== (user.currentClinicId ?? "")) return { ok: false, error: "not-found" };

  await prisma.encounterDiagnosis.delete({ where: { id } });
  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "EncounterDiagnosis",
    entityId: id,
    clinicId: dx.clinicId,
    metadata: { encounterId: dx.encounterId },
  });
  revalidatePath(`/encounters/${dx.encounterId}`);
  return { ok: true, id };
}

export async function addOrder(
  encounterId: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:read");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = orderSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  if (!(await canOrder(user, v.kind))) return { ok: false, error: "not-allowed" };

  const encounter = await prisma.encounter.findFirst({
    where: { id: encounterId, clinicId },
    select: { id: true, patientId: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };

  const order = await prisma.medicalOrder.create({
    data: {
      clinicId,
      encounterId,
      patientId: encounter.patientId,
      kind: v.kind,
      name: v.name,
      instructions: v.instructions || null,
      dosage: v.dosage || null,
      frequency: v.frequency || null,
      durationDays: v.durationDays,
      quantity: v.quantity || null,
      unit: v.unit || null,
      priority: v.priority ?? "ROUTINE",
      status: v.kind === "LABORATORY" || v.kind === "IMAGING" ? "ACTIVE" : "PENDING",
      createdBy: user.id,
    },
    select: { id: true },
  });

  if (v.kind === "LABORATORY") {
    const tests = await prisma.labTest.findMany({
      where: { id: { in: v.labTestIds ?? [] }, clinicId },
      select: { id: true, nameAr: true, nameEn: true, unit: true, referenceRange: true },
    });
    if (tests.length > 0) {
      await prisma.labRequest.create({
        data: {
          clinicId,
          orderId: order.id,
          patientId: encounter.patientId,
          requestedBy: user.id,
          status: "PENDING",
          tests: {
            create: tests.map((t) => ({
              clinicId,
              testId: t.id,
              testName: t.nameAr || t.nameEn,
              unit: t.unit,
              referenceRange: t.referenceRange,
              status: "PENDING",
            })),
          },
        },
      });
    }
  } else if (v.kind === "IMAGING") {
    await prisma.imagingRequest.create({
      data: {
        clinicId,
        orderId: order.id,
        patientId: encounter.patientId,
        modality: v.modality || null,
        status: "PENDING",
        requestedBy: user.id,
      },
    });
  }

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "MedicalOrder",
    entityId: order.id,
    clinicId,
    metadata: { encounterId, kind: v.kind },
  });
  revalidatePath(`/encounters/${encounterId}`);
  revalidatePath("/lab");
  revalidatePath("/pharmacy");
  revalidatePath("/imaging");
  return { ok: true, id: order.id };
}

export async function cancelOrder(id: string): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const order = await prisma.medicalOrder.findFirst({
    where: { id, clinicId: user.currentClinicId ?? "" },
    select: { id: true, encounterId: true, clinicId: true },
  });
  if (!order) return { ok: false, error: "not-found" };

  await prisma.medicalOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "MedicalOrder",
    entityId: id,
    clinicId: order.clinicId,
    metadata: { status: "CANCELLED" },
  });
  revalidatePath(`/encounters/${order.encounterId}`);
  return { ok: true, id };
}

export async function encounterAction(action: "cancel" | "complete", id: string): Promise<Result> {
  if (action === "cancel") {
    const user = await requirePermission("encounters:write");
    const e = await prisma.encounter.findFirst({
      where: { id, clinicId: user.currentClinicId ?? "" },
      select: { id: true, clinicId: true, patientId: true },
    });
    if (!e) return { ok: false, error: "not-found" };
    await prisma.encounter.update({
      where: { id },
      data: { status: "CANCELLED", updatedBy: user.id },
    });
    recordAudit({
      actorId: user.id,
      action: "update",
      entity: "Encounter",
      entityId: id,
      clinicId: e.clinicId,
      metadata: { status: "CANCELLED" },
    });
    revalidatePath("/encounters");
    revalidatePath(`/encounters/${id}`);
    return { ok: true, id };
  }
  return completeEncounter(id);
}

export async function updateDiagnosis(
  id: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = diagnosisSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.encounterDiagnosis.findFirst({
    where: { id, clinicId },
    select: { id: true, encounterId: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  // Track changes for amendment record
  const oldValues = await prisma.encounterDiagnosis.findFirst({
    where: { id },
    select: {
      code: true,
      name: true,
      description: true,
      classification: true,
      codeSystem: true,
      status: true,
      confidence: true,
      course: true,
      laterality: true,
      onsetDate: true,
      isPrimary: true,
      isDifferential: true,
      parentDiagnosisId: true,
      diagnosedBy: true,
      diagnosedAt: true,
      clinicalFindings: true,
      supportingLabResultIds: true,
      supportingImagingIds: true,
      treatmentPlan: true,
      followUp: true,
      notes: true,
    },
  });

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  // Map schema fields to database fields
  if (v.code !== undefined) updateData.code = v.code || null;
  if (v.name !== undefined) updateData.name = v.name;
  if (v.description !== undefined) updateData.description = v.description || null;
  if (v.classification !== undefined) updateData.classification = v.classification || "ICD10";
  if (v.codeSystem !== undefined) updateData.codeSystem = v.codeSystem || null;
  if (v.status !== undefined) updateData.status = v.status || "PROVISIONAL";
  if (v.confidence !== undefined) updateData.confidence = v.confidence || null;
  if (v.course !== undefined) updateData.course = v.course || "ACUTE";
  if (v.laterality !== undefined) updateData.laterality = v.laterality || "NOT_APPLICABLE";
  if (v.onsetDate !== undefined) updateData.onsetDate = v.onsetDate ? new Date(v.onsetDate) : null;
  if (v.isPrimary !== undefined) updateData.isPrimary = Boolean(v.isPrimary);
  if (v.isDifferential !== undefined) updateData.isDifferential = Boolean(v.isDifferential);
  if (v.parentDiagnosisId !== undefined) updateData.parentDiagnosisId = v.parentDiagnosisId || null;
  if (v.diagnosedBy !== undefined) updateData.diagnosedBy = v.diagnosedBy || null;
  if (v.diagnosedAt !== undefined) updateData.diagnosedAt = v.diagnosedAt ? new Date(v.diagnosedAt) : null;
  if (v.clinicalFindings !== undefined) updateData.clinicalFindings = v.clinicalFindings || null;
  if (v.supportingLabResultIds !== undefined) updateData.supportingLabResultIds = v.supportingLabResultIds ? JSON.stringify(v.supportingLabResultIds) : null;
  if (v.supportingImagingIds !== undefined) updateData.supportingImagingIds = v.supportingImagingIds ? JSON.stringify(v.supportingImagingIds) : null;
  if (v.treatmentPlan !== undefined) updateData.treatmentPlan = v.treatmentPlan || null;
  if (v.followUp !== undefined) updateData.followUp = v.followUp || null;
  if (v.notes !== undefined) updateData.notes = v.notes || null;

  // If status changed to RESOLVED, set resolvedAt and resolvedBy
  if (v.status === "RESOLVED" && oldValues?.status !== "RESOLVED") {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = user.id;
  }

  await prisma.encounterDiagnosis.update({
    where: { id },
    data: updateData,
  });

  // Create amendment record for each changed field
  if (oldValues) {
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, newVal] of Object.entries(updateData)) {
      const oldVal = oldValues[key as keyof typeof oldValues];
      if (oldVal !== newVal && key !== "updatedAt") {
        changes[key] = { old: oldVal, new: newVal };
      }
    }

    if (Object.keys(changes).length > 0) {
      await prisma.diagnosisAmendment.createMany({
        data: Object.entries(changes).map(([fieldName, { old, new: newVal }]) => ({
          clinicId,
          diagnosisId: id,
          fieldName,
          oldValue: old == null ? null : String(old),
          newValue: newVal == null ? null : String(newVal),
          reason: "Updated via encounter chart",
          amendedBy: user.id,
        })),
      });
    }
  }

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "EncounterDiagnosis",
    entityId: id,
    clinicId,
    metadata: { encounterId: existing.encounterId, fields: Object.keys(updateData) },
  });
  revalidatePath(`/encounters/${existing.encounterId}`);
  return { ok: true, id };
}

export async function updateDiagnosisStatus(
  id: string,
  status: "SUSPECTED" | "PROVISIONAL" | "CONFIRMED" | "RULED_OUT" | "RESOLVED" | "CHRONIC",
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await prisma.encounterDiagnosis.findFirst({
    where: { id, clinicId },
    select: { id: true, encounterId: true, status: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "RESOLVED" && existing.status !== "RESOLVED") {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = user.id;
  }

  await prisma.encounterDiagnosis.update({
    where: { id },
    data: updateData,
  });

  // Create amendment record
  await prisma.diagnosisAmendment.create({
    data: {
      clinicId,
      diagnosisId: id,
      fieldName: "status",
      oldValue: existing.status,
      newValue: status,
      reason: "Status updated via encounter chart",
      amendedBy: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "EncounterDiagnosis",
    entityId: id,
    clinicId,
    metadata: { encounterId: existing.encounterId, status },
  });
  revalidatePath(`/encounters/${existing.encounterId}`);
  return { ok: true, id };
}

export async function addDiagnosisAmendment(
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = diagnosisAmendmentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const dx = await prisma.encounterDiagnosis.findFirst({
    where: { id: v.diagnosisId, clinicId },
    select: { id: true, encounterId: true },
  });
  if (!dx) return { ok: false, error: "not-found" };

  await prisma.diagnosisAmendment.create({
    data: {
      clinicId,
      diagnosisId: v.diagnosisId,
      fieldName: v.fieldName,
      oldValue: v.oldValue || null,
      newValue: v.newValue || null,
      reason: v.reason,
      amendedBy: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "amend",
    entity: "DiagnosisAmendment",
    entityId: v.diagnosisId,
    clinicId,
    metadata: { diagnosisId: v.diagnosisId, fieldName: v.fieldName },
  });
  revalidatePath(`/encounters/${dx.encounterId}`);
  return { ok: true, id: v.diagnosisId };
}

export async function signEncounter(id: string): Promise<Result> {
  const user = await requirePermission("encounters:sign");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const encounter = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true, patientId: true, status: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };
  if (encounter.status === "SIGNED" || encounter.status === "AMENDED") return { ok: true, id };

  // Create signature hash from current content
  const content = await prisma.encounter.findFirst({
    where: { id },
    select: {
      chiefComplaint: true,
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
      temperature: true,
      pulse: true,
      respRate: true,
      bpSystolic: true,
      bpDiastolic: true,
      spO2: true,
      height: true,
      weight: true,
    },
  });

  const contentString = JSON.stringify(content);
  const crypto = await import("crypto");
  const signatureHash = crypto.createHash("sha256").update(contentString).digest("hex");

  await prisma.$transaction([
    prisma.encounter.update({
      where: { id },
      data: { status: "SIGNED", updatedBy: user.id },
    }),
    prisma.encounterSignature.create({
      data: {
        clinicId,
        encounterId: id,
        signedBy: user.id,
        signatureHash,
      },
    }),
  ]);

  recordAudit({
    actorId: user.id,
    action: "sign",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { status: "SIGNED" },
  });
  revalidatePath("/encounters");
  revalidatePath(`/encounters/${id}`);
  revalidatePath(`/patients/${encounter.patientId}/chart`);
  return { ok: true, id };
}

export async function amendEncounter(
  id: string,
  values: unknown,
  reason: string,
): Promise<Result> {
  const user = await requirePermission("encounters:amend");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const encounter = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true, patientId: true, status: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };
  if (encounter.status !== "SIGNED" && encounter.status !== "AMENDED") {
    return { ok: false, error: "conflict" };
  }

  const parsed = encounterFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  // Capture previous content for amendment record
  const previous = await prisma.encounter.findFirst({
    where: { id },
    select: {
      chiefComplaint: true,
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
      temperature: true,
      pulse: true,
      respRate: true,
      bpSystolic: true,
      bpDiastolic: true,
      spO2: true,
      height: true,
      weight: true,
    },
  });

  const newContent = {
    chiefComplaint: v.chiefComplaint || null,
    subjective: v.subjective || null,
    objective: v.objective || null,
    assessment: v.assessment || null,
    plan: v.plan || null,
    symptomsText: v.symptomsText || null,
    diagnosisText: v.diagnosisText || null,
    labsText: v.labsText || null,
    imagingText: v.imagingText || null,
    treatmentsText: v.treatmentsText || null,
    temperature: v.temperature,
    pulse: v.pulse,
    respRate: v.respRate,
    bpSystolic: v.bpSystolic,
    bpDiastolic: v.bpDiastolic,
    spO2: v.spO2,
    height: v.height,
    weight: v.weight,
  };

  await prisma.$transaction([
    prisma.encounter.update({
      where: { id },
      data: {
        ...newContent,
        status: "AMENDED",
        updatedBy: user.id,
      },
    }),
    prisma.encounterAmendment.create({
      data: {
        clinicId,
        encounterId: id,
        amendedBy: user.id,
        reason,
        previousContent: previous as unknown as Prisma.InputJsonValue,
        newContent: newContent as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  recordAudit({
    actorId: user.id,
    action: "amend",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { status: "AMENDED", reason },
  });
  revalidatePath("/encounters");
  revalidatePath(`/encounters/${id}`);
  revalidatePath(`/patients/${encounter.patientId}/chart`);
  return { ok: true, id };
}

// Diagnosis Catalog Actions
export async function createDiagnosisCatalogEntry(
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("diagnosis:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const schema = z.object({
    code: z.string().trim().min(1),
    nameAr: z.string().trim().min(1),
    nameEn: z.string().trim().min(1),
    classification: z.enum(["ICD10", "ICD11", "SNOMED_CT", "LOCAL"]).optional(),
    category: z.string().optional(),
    parentId: z.string().optional(),
    isStandard: z.boolean().optional(),
  });

  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.diagnosisCatalog.findUnique({
    where: { clinicId_code: { clinicId, code: v.code } },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "conflict" };

  const entry = await prisma.diagnosisCatalog.create({
    data: {
      clinicId,
      code: v.code,
      nameAr: v.nameAr,
      nameEn: v.nameEn,
      classification: v.classification || "ICD10",
      category: v.category || null,
      parentId: v.parentId || null,
      isStandard: v.isStandard ?? true,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "DiagnosisCatalog",
    entityId: entry.id,
    clinicId,
    metadata: { code: v.code },
  });
  revalidatePath("/diagnoses/catalog");
  return { ok: true, id: entry.id };
}

export async function updateDiagnosisCatalogEntry(
  id: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("diagnosis:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const schema = z.object({
    nameAr: z.string().trim().optional(),
    nameEn: z.string().trim().optional(),
    classification: z.enum(["ICD10", "ICD11", "SNOMED_CT", "LOCAL"]).optional(),
    category: z.string().optional(),
    parentId: z.string().optional(),
    isActive: z.boolean().optional(),
    isStandard: z.boolean().optional(),
  });

  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const existing = await prisma.diagnosisCatalog.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.diagnosisCatalog.update({
    where: { id },
    data: parsed.data,
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "DiagnosisCatalog",
    entityId: id,
    clinicId,
  });
  revalidatePath("/diagnoses/catalog");
  return { ok: true, id };
}

export async function deleteDiagnosisCatalogEntry(id: string): Promise<Result> {
  const user = await requirePermission("diagnosis:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await prisma.diagnosisCatalog.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.diagnosisCatalog.delete({ where: { id } });

  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "DiagnosisCatalog",
    entityId: id,
    clinicId,
  });
  revalidatePath("/diagnoses/catalog");
  return { ok: true, id };
}

export async function searchDiagnosisCatalog(
  query: string,
): Promise<
  | {
      ok: true;
      items: {
        id: string;
        code: string;
        nameAr: string;
        nameEn: string;
        classification: string;
      }[];
    }
  | { ok: false; error: "no-clinic" | "not-allowed" }
> {
  let user;
  try {
    user = await requirePermission("encounters:read");
  } catch {
    return { ok: false, error: "not-allowed" };
  }
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const q = query.trim();
  const items = await prisma.diagnosisCatalog.findMany({
    where: {
      clinicId,
      isActive: true,
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" as const } },
              { nameEn: { contains: q, mode: "insensitive" as const } },
              { nameAr: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      code: true,
      nameAr: true,
      nameEn: true,
      classification: true,
    },
    orderBy: [{ isStandard: "desc" }, { code: "asc" }],
    take: 25,
  });

  return { ok: true, items };
}

export async function saveEncounterHistory(
  id: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = historyFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.encounter.update({
    where: { id },
    data: {
      painLocation: v.painLocation || null,
      symptomNature: v.symptomNature || null,
      aggravatingFactors: v.aggravatingFactors || null,
      alleviatingFactors: v.alleviatingFactors || null,
      history: v,
      updatedBy: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { section: "history", fields: Object.keys(parsed.data) },
  });
  revalidatePath(`/encounters/${id}`);
  return { ok: true, id };
}

export async function saveEncounterExamination(
  id: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = examFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.encounter.update({
    where: { id },
    data: { examination: v, updatedBy: user.id },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { section: "examination", fields: Object.keys(parsed.data) },
  });
  revalidatePath(`/encounters/${id}`);
  return { ok: true, id };
}

export async function saveEncounterTreatmentPlan(
  id: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = planFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.encounter.update({
    where: { id },
    data: { treatmentPlan: v, plan: v.plan || null, updatedBy: user.id },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { section: "treatmentPlan", fields: Object.keys(parsed.data) },
  });
  revalidatePath(`/encounters/${id}`);
  return { ok: true, id };
}

export async function closeEncounter(id: string): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const encounter = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true, appointmentId: true, patientId: true, status: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };
  if (encounter.status === "COMPLETED" || encounter.status === "SIGNED") {
    return { ok: true, id };
  }

  const pendingOrders = await prisma.medicalOrder.count({
    where: {
      encounterId: id,
      kind: { in: ["LABORATORY", "IMAGING"] },
      status: { in: ["PENDING", "ACTIVE"] },
    },
  });

  const visit = await prisma.visit.findFirst({
    where: { encounterId: id, clinicId },
    select: { id: true },
  });
  const now = new Date();
  const awaiting = pendingOrders > 0;

  await prisma.$transaction([
    prisma.encounter.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: now, updatedBy: user.id },
    }),
    ...(visit
      ? [
          prisma.visit.update({
            where: { id: visit.id },
            data: {
              status: awaiting ? "AWAITING_RESULTS" : "COMPLETED",
              completedAt: awaiting ? null : now,
              updatedBy: user.id,
            },
          }),
        ]
      : []),
    ...(encounter.appointmentId
      ? [
          prisma.appointment.update({
            where: { id: encounter.appointmentId },
            data: { status: "COMPLETED", updatedBy: user.id },
          }),
        ]
      : []),
    ...(visit
      ? [
          prisma.queueEntry.updateMany({
            where: {
              visitId: visit.id,
              status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] },
            },
            data: { status: "DONE", completedAt: now },
          }),
        ]
      : []),
  ]);

  recordAudit({
    actorId: user.id,
    action: "sign",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { status: "COMPLETED", awaitingResults: awaiting },
  });
  revalidatePath("/encounters");
  revalidatePath(`/encounters/${id}`);
  revalidatePath("/reception");
  revalidatePath("/appointments");
  revalidatePath("/queue");
  revalidatePath(`/patients/${encounter.patientId}/chart`);
  return { ok: true, id, awaiting };
}

export async function markResultsReviewed(id: string): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const visit = await prisma.visit.findFirst({
    where: { encounterId: id, clinicId },
    select: { id: true, status: true },
  });
  if (!visit) return { ok: true, id };
  if (visit.status !== "AWAITING_RESULTS" && visit.status !== "AWAITING_REVIEW") {
    return { ok: true, id };
  }

  await prisma.visit.update({
    where: { id: visit.id },
    data: { status: "COMPLETED", completedAt: new Date(), updatedBy: user.id },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Visit",
    entityId: visit.id,
    clinicId,
    metadata: { encounterId: id, status: "COMPLETED" },
  });
  revalidatePath(`/encounters/${id}`);
  revalidatePath("/queue");
  return { ok: true, id };
}