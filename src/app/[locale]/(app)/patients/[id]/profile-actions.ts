"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { textSearchMode } from "@/lib/search";
import {
  allergySchema,
  catalogEntrySchema,
  consentFormSchema,
  diagnosisSchema,
  documentSchema,
  medicalHistorySchema,
  referralSchema,
  vitalSignSchema,
  type AllergyFormValues,
  type CatalogEntryFormValues,
  type ConsentFormValues,
  type DiagnosisFormValues,
  type DocumentFormValues,
  type MedicalHistoryFormValues,
  type ReferralFormValues,
  type VitalSignFormValues,
} from "./profile-schema";

type ActionResult = { ok: true; id: string } | { ok: false; error: string };

function toDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDecimal(value?: string): Prisma.Decimal | null {
  return value ? new Prisma.Decimal(value) : null;
}

function toInt(value?: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : Math.round(n);
}

async function guard() {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return null;
  return { user, clinicId };
}

// ---------------------------------------------------------------------------
// Medical history
// ---------------------------------------------------------------------------

function historyData(parsed: MedicalHistoryFormValues) {
  return {
    category: parsed.category,
    condition: parsed.condition,
    detail: parsed.detail || null,
    medication: parsed.medication || null,
    diagnosis: parsed.diagnosis || null,
    notes: parsed.notes || null,
    startedOn: toDate(parsed.startedOn),
    resolvedOn: toDate(parsed.resolvedOn),
    status: parsed.status,
    verification: parsed.verification,
    source: parsed.source,
    sourceName: parsed.sourceName || null,
    isAlert: Boolean(parsed.isAlert),
    alertNote: parsed.alertNote || null,
  };
}

export async function createMedicalHistory(
  patientId: string,
  values: MedicalHistoryFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("diagnoses:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = medicalHistorySchema.parse(values);
  if (!(await assertPatient(clinicId, patientId))) {
    return { ok: false, error: "not-found" };
  }

  const row = await prisma.medicalHistory.create({
    data: {
      clinicId,
      patientId,
      ...historyData(parsed),
      createdBy: user.id,
    },
    select: { id: true },
  });
  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "MedicalHistory",
    entityId: row.id,
    clinicId,
    metadata: { patientId, category: parsed.category },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id: row.id };
}

export async function updateMedicalHistory(
  patientId: string,
  id: string,
  values: MedicalHistoryFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("diagnoses:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = medicalHistorySchema.parse(values);
  const existing = await prisma.medicalHistory.findFirst({
    where: { id, patientId, clinicId },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.$transaction(async (tx) => {
    await tx.medicalHistoryRevision.create({
      data: {
        historyId: id,
        snapshot: {
          category: existing.category,
          condition: existing.condition,
          detail: existing.detail,
          medication: existing.medication,
          diagnosis: existing.diagnosis,
          notes: existing.notes,
          startedOn: existing.startedOn,
          resolvedOn: existing.resolvedOn,
          status: existing.status,
          verification: existing.verification,
          source: existing.source,
          sourceName: existing.sourceName,
          isAlert: existing.isAlert,
          alertNote: existing.alertNote,
        },
        changeNote: parsed.changeNote || null,
        changedBy: user.id,
      },
    });
    await tx.medicalHistory.update({
      where: { id },
      data: historyData(parsed),
    });
  });
  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "MedicalHistory",
    entityId: id,
    clinicId,
    metadata: { patientId, category: parsed.category },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function reviewMedicalHistory(
  patientId: string,
  id: string,
): Promise<ActionResult> {
  const user = await requirePermission("diagnoses:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const existing = await prisma.medicalHistory.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.medicalHistory.update({
    where: { id },
    data: { reviewedBy: user.id, reviewedAt: new Date() },
  });
  recordAudit({
    actorId: user.id,
    action: "sign",
    entity: "MedicalHistory",
    entityId: id,
    clinicId,
    metadata: { patientId, reviewed: true },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function deleteMedicalHistory(
  patientId: string,
  id: string,
): Promise<ActionResult> {
  const user = await requirePermission("diagnoses:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const existing = await prisma.medicalHistory.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.medicalHistory.delete({ where: { id } });
  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "MedicalHistory",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function createAllergy(
  patientId: string,
  values: AllergyFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = allergySchema.parse(values);
  const row = await prisma.allergy.create({
    data: {
      clinicId,
      patientId,
      allergen: parsed.allergen,
      reaction: parsed.reaction || null,
      severity: parsed.severity,
      notes: parsed.notes || null,
      createdBy: user.id,
    },
    select: { id: true },
  });
  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Allergy",
    entityId: row.id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id: row.id };
}

export async function updateAllergy(
  patientId: string,
  id: string,
  values: AllergyFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = allergySchema.parse(values);
  const existing = await prisma.allergy.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.allergy.update({
    where: { id },
    data: {
      allergen: parsed.allergen,
      reaction: parsed.reaction || null,
      severity: parsed.severity,
      notes: parsed.notes || null,
    },
  });
  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Allergy",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function deleteAllergy(
  patientId: string,
  id: string,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const existing = await prisma.allergy.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.allergy.delete({ where: { id } });
  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "Allergy",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

function vitalData(parsed: VitalSignFormValues) {
  const num = (v?: string) => (v ? new Prisma.Decimal(v) : null);
  const int = (v?: string) => (v ? Math.round(Number(v)) : null);
  return {
    temperature: num(parsed.temperature),
    pulse: int(parsed.pulse),
    respRate: int(parsed.respRate),
    bpSystolic: int(parsed.bpSystolic),
    bpDiastolic: int(parsed.bpDiastolic),
    spO2: int(parsed.spO2),
    height: num(parsed.height),
    weight: num(parsed.weight),
    bmi: num(parsed.bmi),
    notes: parsed.notes || null,
  };
}

export async function createVitalSign(
  patientId: string,
  values: VitalSignFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = vitalSignSchema.parse(values);
  const when = toDate(parsed.measuredAt) ?? new Date();
  const row = await prisma.vitalSign.create({
    data: {
      clinicId,
      patientId,
      measuredAt: when,
      ...vitalData(parsed),
      createdBy: user.id,
    },
    select: { id: true },
  });
  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "VitalSign",
    entityId: row.id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id: row.id };
}

export async function updateVitalSign(
  patientId: string,
  id: string,
  values: VitalSignFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = vitalSignSchema.parse(values);
  const existing = await prisma.vitalSign.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.vitalSign.update({
    where: { id },
    data: {
      measuredAt: toDate(parsed.measuredAt) ?? undefined,
      ...vitalData(parsed),
    },
  });
  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "VitalSign",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function deleteVitalSign(
  patientId: string,
  id: string,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const existing = await prisma.vitalSign.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.vitalSign.delete({ where: { id } });
  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "VitalSign",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function createDocument(
  patientId: string,
  values: DocumentFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = documentSchema.parse(values);
  const row = await prisma.patientDocument.create({
    data: {
      clinicId,
      patientId,
      title: parsed.title,
      category: parsed.category,
      fileName: parsed.fileName || null,
      url: parsed.url || null,
      notes: parsed.notes || null,
      createdBy: user.id,
    },
    select: { id: true },
  });
  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "PatientDocument",
    entityId: row.id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id: row.id };
}

export async function updateDocument(
  patientId: string,
  id: string,
  values: DocumentFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = documentSchema.parse(values);
  const existing = await prisma.patientDocument.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.patientDocument.update({
    where: { id },
    data: {
      title: parsed.title,
      category: parsed.category,
      fileName: parsed.fileName || null,
      url: parsed.url || null,
      notes: parsed.notes || null,
    },
  });
  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "PatientDocument",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function deleteDocument(
  patientId: string,
  id: string,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const existing = await prisma.patientDocument.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.patientDocument.delete({ where: { id } });
  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "PatientDocument",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function createReferral(
  patientId: string,
  values: ReferralFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = referralSchema.parse(values);
  const row = await prisma.referral.create({
    data: {
      clinicId,
      patientId,
      referredTo: parsed.referredTo,
      reason: parsed.reason || null,
      status: parsed.status,
      notes: parsed.notes || null,
      createdBy: user.id,
    },
    select: { id: true },
  });
  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Referral",
    entityId: row.id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id: row.id };
}

export async function updateReferral(
  patientId: string,
  id: string,
  values: ReferralFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = referralSchema.parse(values);
  const existing = await prisma.referral.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.referral.update({
    where: { id },
    data: {
      referredTo: parsed.referredTo,
      reason: parsed.reason || null,
      status: parsed.status,
      notes: parsed.notes || null,
    },
  });
  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Referral",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function deleteReferral(
  patientId: string,
  id: string,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const existing = await prisma.referral.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.referral.delete({ where: { id } });
  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "Referral",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function createConsentForm(
  patientId: string,
  values: ConsentFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = consentFormSchema.parse(values);
  const row = await prisma.consentForm.create({
    data: {
      clinicId,
      patientId,
      title: parsed.title,
      category: parsed.category || null,
      status: parsed.status,
      signedBy: parsed.signedBy || null,
      signedAt: parsed.status === "SIGNED" ? new Date() : null,
      content: parsed.content || null,
      notes: parsed.notes || null,
      createdBy: user.id,
    },
    select: { id: true },
  });
  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "ConsentForm",
    entityId: row.id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id: row.id };
}

export async function updateConsentForm(
  patientId: string,
  id: string,
  values: ConsentFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = consentFormSchema.parse(values);
  const existing = await prisma.consentForm.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true, signedAt: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.consentForm.update({
    where: { id },
    data: {
      title: parsed.title,
      category: parsed.category || null,
      status: parsed.status,
      signedBy: parsed.signedBy || null,
      signedAt:
        parsed.status === "SIGNED" ? (existing.signedAt ?? new Date()) : null,
      content: parsed.content || null,
      notes: parsed.notes || null,
    },
  });
  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "ConsentForm",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function deleteConsentForm(
  patientId: string,
  id: string,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const existing = await prisma.consentForm.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.consentForm.delete({ where: { id } });
  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "ConsentForm",
    entityId: id,
    clinicId,
    metadata: { patientId },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// Diagnoses
// ---------------------------------------------------------------------------

function diagnosisData(parsed: DiagnosisFormValues) {
  return {
    catalogId: parsed.catalogId || null,
    name: parsed.name,
    code: parsed.code || null,
    codeSystem: parsed.codeSystem,
    description: parsed.description || null,
    type: parsed.type,
    status: parsed.status,
    symptoms: parsed.symptoms || null,
    clinicalFindings: parsed.clinicalFindings || null,
    supportiveResults: parsed.supportiveResults || null,
    diagnosedOn: parsed.diagnosedOn ? new Date(parsed.diagnosedOn) : null,
    diagnosedBy: parsed.diagnosedBy || null,
    treatmentPlan: parsed.treatmentPlan || null,
    followUp: parsed.followUp || null,
    notes: parsed.notes || null,
    isChronic: parsed.isChronic ?? parsed.status === "CHRONIC",
    encounterId: parsed.encounterId || null,
  };
}

function diagnosisSnapshot(d: {
  catalogId: string | null;
  name: string;
  code: string | null;
  codeSystem: string;
  description: string | null;
  type: string;
  status: string;
  symptoms: string | null;
  clinicalFindings: string | null;
  supportiveResults: string | null;
  diagnosedOn: Date | null;
  diagnosedBy: string | null;
  treatmentPlan: string | null;
  followUp: string | null;
  notes: string | null;
  isChronic: boolean;
}) {
  return {
    catalogId: d.catalogId,
    name: d.name,
    code: d.code,
    codeSystem: d.codeSystem,
    description: d.description,
    type: d.type,
    status: d.status,
    symptoms: d.symptoms,
    clinicalFindings: d.clinicalFindings,
    supportiveResults: d.supportiveResults,
    diagnosedOn: d.diagnosedOn,
    diagnosedBy: d.diagnosedBy,
    treatmentPlan: d.treatmentPlan,
    followUp: d.followUp,
    notes: d.notes,
    isChronic: d.isChronic,
  };
}

async function assertPatient(clinicId: string, patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    select: { id: true },
  });
  return Boolean(patient);
}

export async function createDiagnosis(
  patientId: string,
  values: DiagnosisFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("diagnoses:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  if (!(await assertPatient(clinicId, patientId))) {
    return { ok: false, error: "not-found" };
  }
  const parsed = diagnosisSchema.parse(values);
  const row = await prisma.diagnosis.create({
    data: {
      clinicId,
      patientId,
      ...diagnosisData(parsed),
      createdBy: user.id,
      updatedBy: user.id,
    },
    select: { id: true },
  });
  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Diagnosis",
    entityId: row.id,
    clinicId,
    metadata: { patientId, status: parsed.status, type: parsed.type },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id: row.id };
}

export async function updateDiagnosis(
  patientId: string,
  id: string,
  values: DiagnosisFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("diagnoses:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = diagnosisSchema.parse(values);
  const existing = await prisma.diagnosis.findFirst({
    where: { id, patientId, clinicId },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.$transaction(async (tx) => {
    await tx.diagnosisRevision.create({
      data: {
        diagnosisId: id,
        snapshot: diagnosisSnapshot(existing),
        changeNote: parsed.changeNote || null,
        changedBy: user.id,
      },
    });
    await tx.diagnosis.update({
      where: { id },
      data: { ...diagnosisData(parsed), updatedBy: user.id },
    });
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Diagnosis",
    entityId: id,
    clinicId,
    metadata: {
      patientId,
      fromStatus: existing.status,
      toStatus: parsed.status,
    },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

export async function deleteDiagnosis(
  patientId: string,
  id: string,
): Promise<ActionResult> {
  const user = await requirePermission("diagnoses:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const existing = await prisma.diagnosis.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true, name: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.diagnosis.delete({ where: { id } });
  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "Diagnosis",
    entityId: id,
    clinicId,
    metadata: { patientId, name: existing.name },
  });
  revalidatePath(`/patients/${patientId}`);
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// Diagnosis catalog
// ---------------------------------------------------------------------------

export type CatalogSearchResult = {
  id: string;
  code: string;
  codeSystem: string;
  nameEn: string;
  nameAr: string | null;
  isStandard: boolean;
  description: string | null;
};

export async function searchDiagnosisCatalog(
  query: string,
): Promise<CatalogSearchResult[]> {
  const user = await requirePermission("diagnoses:read");
  const clinicId = user.currentClinicId ?? "";
  const q = query.trim();
  const mode = q ? textSearchMode(q) : undefined;
  const searchClause: Prisma.DiagnosisCatalogWhereInput[] = q
    ? [
        {
          OR: [
            { code: { contains: q, ...(mode ? { mode } : {}) } },
            { nameEn: { contains: q, ...(mode ? { mode } : {}) } },
            { nameAr: { contains: q } },
          ],
        },
      ]
    : [];
  return prisma.diagnosisCatalog.findMany({
    where: {
      isActive: true,
      OR: [{ clinicId: null }, { clinicId }],
      AND: searchClause,
    },
    orderBy: [{ isStandard: "desc" }, { nameEn: "asc" }],
    take: 20,
    select: {
      id: true,
      code: true,
      codeSystem: true,
      nameEn: true,
      nameAr: true,
      isStandard: true,
      description: true,
    },
  });
}

export type CatalogListRow = {
  id: string;
  code: string;
  codeSystem: string;
  nameEn: string;
  nameAr: string | null;
  category: string | null;
  isStandard: boolean;
  isActive: boolean;
};

export async function listCatalogEntries(
  query?: string,
): Promise<CatalogListRow[]> {
  const user = await requirePermission("diagnoses:manage");
  const clinicId = user.currentClinicId ?? "";
  const q = query?.trim() ?? "";
  const mode = q ? textSearchMode(q) : undefined;
  return prisma.diagnosisCatalog.findMany({
    where: {
      OR: [{ clinicId: null }, { clinicId }],
      AND: q
        ? [
            {
              OR: [
                { code: { contains: q, ...(mode ? { mode } : {}) } },
                { nameEn: { contains: q, ...(mode ? { mode } : {}) } },
                { nameAr: { contains: q } },
              ],
            },
          ]
        : [],
    },
    orderBy: [{ isStandard: "desc" }, { code: "asc" }],
    take: 200,
    select: {
      id: true,
      code: true,
      codeSystem: true,
      nameEn: true,
      nameAr: true,
      category: true,
      isStandard: true,
      isActive: true,
    },
  });
}

export async function createCatalogEntry(
  values: CatalogEntryFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("diagnoses:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = catalogEntrySchema.parse(values);
  const duplicate = await prisma.diagnosisCatalog.findFirst({
    where: {
      codeSystem: parsed.codeSystem,
      code: parsed.code,
      OR: [{ clinicId: null }, { clinicId }],
    },
    select: { id: true },
  });
  if (duplicate) return { ok: false, error: "duplicate" };
  const row = await prisma.diagnosisCatalog.create({
    data: {
      clinicId,
      code: parsed.code,
      codeSystem: parsed.codeSystem,
      nameEn: parsed.nameEn,
      nameAr: parsed.nameAr || null,
      description: parsed.description || null,
      category: parsed.category || null,
      isStandard: false,
      isActive: parsed.isActive ?? true,
      createdBy: user.id,
    },
    select: { id: true },
  });
  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "DiagnosisCatalog",
    entityId: row.id,
    clinicId,
    metadata: { code: parsed.code, codeSystem: parsed.codeSystem },
  });
  return { ok: true, id: row.id };
}

export async function updateCatalogEntry(
  id: string,
  values: CatalogEntryFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("diagnoses:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const parsed = catalogEntrySchema.parse(values);
  const existing = await prisma.diagnosisCatalog.findFirst({
    where: { id, OR: [{ clinicId: null }, { clinicId }] },
  });
  if (!existing) return { ok: false, error: "not-found" };
  if (existing.isStandard) return { ok: false, error: "standard" };
  await prisma.diagnosisCatalog.update({
    where: { id },
    data: {
      code: parsed.code,
      codeSystem: parsed.codeSystem,
      nameEn: parsed.nameEn,
      nameAr: parsed.nameAr || null,
      description: parsed.description || null,
      category: parsed.category || null,
      isActive: parsed.isActive ?? true,
    },
  });
  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "DiagnosisCatalog",
    entityId: id,
    clinicId,
    metadata: { code: parsed.code },
  });
  return { ok: true, id };
}

export async function toggleCatalogEntry(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const user = await requirePermission("diagnoses:manage");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };
  const existing = await prisma.diagnosisCatalog.findFirst({
    where: { id, OR: [{ clinicId: null }, { clinicId }] },
    select: { id: true, isStandard: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  await prisma.diagnosisCatalog.update({
    where: { id },
    data: { isActive },
  });
  recordAudit({
    actorId: user.id,
    action: isActive ? "update" : "delete",
    entity: "DiagnosisCatalog",
    entityId: id,
    clinicId,
    metadata: { isActive },
  });
  return { ok: true, id };
}

export type RevisionEntry = {
  id: string;
  createdAt: Date;
  changeNote: string | null;
  changedByName: string | null;
  snapshot: Record<string, unknown>;
};

export async function listMedicalHistoryRevisions(
  patientId: string,
  id: string,
): Promise<RevisionEntry[]> {
  const user = await requirePermission("diagnoses:read");
  const clinicId = user.currentClinicId ?? "";
  const history = await prisma.medicalHistory.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!history) return [];
  const revisions = await prisma.medicalHistoryRevision.findMany({
    where: { historyId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return attachNames(revisions);
}

export async function listDiagnosisRevisions(
  patientId: string,
  id: string,
): Promise<RevisionEntry[]> {
  const user = await requirePermission("diagnoses:read");
  const clinicId = user.currentClinicId ?? "";
  const dx = await prisma.diagnosis.findFirst({
    where: { id, patientId, clinicId },
    select: { id: true },
  });
  if (!dx) return [];
  const revisions = await prisma.diagnosisRevision.findMany({
    where: { diagnosisId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return attachNames(revisions);
}

async function attachNames(
  revisions: {
    id: string;
    createdAt: Date;
    changeNote: string | null;
    changedBy: string | null;
    snapshot: Prisma.JsonValue;
  }[],
): Promise<RevisionEntry[]> {
  const ids = [
    ...new Set(revisions.map((r) => r.changedBy).filter((v): v is string => Boolean(v))),
  ];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  return revisions.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    changeNote: r.changeNote,
    changedByName: r.changedBy ? nameById.get(r.changedBy) ?? null : null,
    snapshot: (r.snapshot ?? {}) as Record<string, unknown>,
  }));
}
