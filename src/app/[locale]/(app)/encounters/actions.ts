"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/sequence";
import {
  amendmentSchema,
  attachmentSchema,
  diagnosisSchema,
  encounterFormSchema,
  encounterRegistrationSchema,
  ENCOUNTER_STATUS_TRANSITIONS,
  orderSchema,
  type OrderValues,
} from "./schema";

type Result =
  | { ok: true; id: string }
  | { ok: false; error: "no-clinic" | "not-found" | "invalid" | "not-allowed" | "conflict" };

const APPOINTMENT_TO_VISIT: Record<string, string> = {
  INITIAL: "NEW_CONSULTATION",
  FOLLOW_UP: "FOLLOW_UP",
  CONSULTATION: "NEW_CONSULTATION",
  VACCINATION: "PREVENTIVE_EXAMINATION",
  PROCEDURE: "PROCEDURE",
  RE_EVALUATION: "POST_TREATMENT_REVIEW",
};

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
    where: { appointmentId },
    select: { id: true },
  });
  if (existing) return { ok: true, id: existing.id };

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId },
    select: { id: true, patientId: true, type: true, status: true, departmentId: true },
  });
  if (!appointment) return { ok: false, error: "not-found" };

  const encounterNo = await nextNumber(clinicId, "ENCOUNTER");
  const encounter = await prisma.encounter.create({
    data: {
      clinicId,
      encounterNo,
      patientId: appointment.patientId,
      appointmentId,
      doctorId: user.id,
      departmentId: appointment.departmentId,
      visitType: (APPOINTMENT_TO_VISIT[appointment.type] ?? "NEW_CONSULTATION") as never,
      status: "CHECKED_IN",
      checkedInAt: new Date(),
      noteStatus: "DRAFT",
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
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = encounterRegistrationSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const patient = await prisma.patient.findFirst({
    where: { id: v.patientId, clinicId },
    select: { id: true },
  });
  if (!patient) return { ok: false, error: "not-found" };

  const encounterNo = await nextNumber(clinicId, "ENCOUNTER");
  const encounter = await prisma.encounter.create({
    data: {
      clinicId,
      encounterNo,
      patientId: v.patientId,
      appointmentId: v.appointmentId || null,
      doctorId: v.doctorId || user.id,
      departmentId: v.departmentId || null,
      visitType: v.visitType,
      status: "CHECKED_IN",
      checkedInAt: new Date(),
      chiefComplaint: v.chiefComplaint || null,
      referralSource: v.referralSource || null,
      referralNotes: v.referralNotes || null,
      noteStatus: "DRAFT",
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
    metadata: { patientId: v.patientId, encounterNo, visitType: v.visitType },
  });
  revalidatePath("/encounters");
  revalidatePath(`/patients/${v.patientId}/chart`);
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
    select: { id: true, noteStatus: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  if (existing.noteStatus === "SIGNED") return { ok: false, error: "not-allowed" };

  await prisma.encounter.update({
    where: { id },
    data: {
      visitType: v.visitType,
      chiefComplaint: v.chiefComplaint || null,
      hpi: v.hpi || null,
      reviewOfSystems: v.reviewOfSystems || null,
      physicalExamination: v.physicalExamination || null,
      examTemplateCode: v.examTemplateCode || null,
      subjective: v.subjective || null,
      objective: v.objective || null,
      assessment: v.assessment || null,
      plan: v.plan || null,
      patientInstructions: v.patientInstructions || null,
      followUpPlan: v.followUpPlan || null,
      followUpDate: v.followUpDate ? new Date(v.followUpDate) : null,
      referralSource: v.referralSource || null,
      referralNotes: v.referralNotes || null,
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

type NoteSource = {
  chiefComplaint: string | null;
  hpi: string | null;
  reviewOfSystems: string | null;
  physicalExamination: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  patientInstructions: string | null;
  followUpPlan: string | null;
  followUpDate: Date | null;
  referralSource: string | null;
  referralNotes: string | null;
  temperature: unknown;
  pulse: number | null;
  respRate: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  spO2: number | null;
  height: unknown;
  weight: unknown;
};

function noteSnapshot(
  e: NoteSource,
  diagnoses: { code: string | null; name: string; isPrimary: boolean }[],
) {
  return {
    chiefComplaint: e.chiefComplaint,
    hpi: e.hpi,
    reviewOfSystems: e.reviewOfSystems,
    physicalExamination: e.physicalExamination,
    subjective: e.subjective,
    objective: e.objective,
    assessment: e.assessment,
    plan: e.plan,
    patientInstructions: e.patientInstructions,
    followUpPlan: e.followUpPlan,
    referralSource: e.referralSource,
    referralNotes: e.referralNotes,
    followUpDate: e.followUpDate ? e.followUpDate.toISOString() : null,
    temperature: e.temperature === null ? null : Number(e.temperature),
    pulse: e.pulse,
    respRate: e.respRate,
    bpSystolic: e.bpSystolic,
    bpDiastolic: e.bpDiastolic,
    spO2: e.spO2,
    height: e.height === null ? null : Number(e.height),
    weight: e.weight === null ? null : Number(e.weight),
    diagnoses: diagnoses.map((d) => ({
      code: d.code,
      name: d.name,
      isPrimary: d.isPrimary,
    })),
  };
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
      isPrimary: Boolean(v.isPrimary),
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
      status: v.kind === "LABORATORY" || v.kind === "IMAGING" ? "ACTIVE" : "PENDING",
      createdBy: user.id,
    },
    select: { id: true },
  });

  if (v.kind === "LABORATORY") {
    const tests = await prisma.labTest.findMany({
      where: { id: { in: v.labTestIds ?? [] }, clinicId },
      select: { id: true, nameAr: true, nameEn: true, unit: true, referenceRange: true, specimenType: true },
    });
    if (tests.length > 0) {
      const requestNo = await nextNumber(clinicId, "REQ_LAB");
      await prisma.labRequest.create({
        data: {
          clinicId,
          requestNo,
          orderId: order.id,
          patientId: encounter.patientId,
          requestedBy: user.name,
          status: "PENDING",
          priority: v.labPriority ?? "ROUTINE",
          clinicalIndication: v.labIndication || null,
          specimenType: tests[0]!.specimenType,
          tests: {
            create: tests.map((t) => ({
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
const NOTE_SELECT = {
  chiefComplaint: true,
  hpi: true,
  reviewOfSystems: true,
  physicalExamination: true,
  subjective: true,
  objective: true,
  assessment: true,
  plan: true,
  patientInstructions: true,
  followUpPlan: true,
  followUpDate: true,
  referralSource: true,
  referralNotes: true,
  temperature: true,
  pulse: true,
  respRate: true,
  bpSystolic: true,
  bpDiastolic: true,
  spO2: true,
  height: true,
  weight: true,
} as const;

export async function setEncounterStatus(
  id: string,
  status: string,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true, status: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  const allowed = ENCOUNTER_STATUS_TRANSITIONS[existing.status];
  if (!allowed.includes(status as never)) return { ok: false, error: "invalid" };

  await prisma.encounter.update({
    where: { id },
    data: {
      status: status as never,
      ...(status === "IN_CONSULTATION" ? { startedAt: new Date() } : {}),
      updatedBy: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { status, from: existing.status },
  });
  revalidatePath("/encounters");
  revalidatePath(`/encounters/${id}`);
  return { ok: true, id };
}

export async function signEncounter(id: string): Promise<Result> {
  const user = await requirePermission("encounters:sign");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const encounter = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true, noteStatus: true, patientId: true, ...NOTE_SELECT },
  });
  if (!encounter) return { ok: false, error: "not-found" };
  if (encounter.noteStatus === "SIGNED") return { ok: true, id };

  const diagnoses = await prisma.encounterDiagnosis.findMany({
    where: { encounterId: id },
    select: { code: true, name: true, isPrimary: true },
  });
  const version =
    (await prisma.encounterNoteRevision.count({ where: { encounterId: id } })) + 1;
  const now = new Date();

  await prisma.$transaction([
    prisma.encounterNoteRevision.create({
      data: {
        clinicId,
        encounterId: id,
        version,
        status: "SIGNED",
        snapshot: noteSnapshot(encounter, diagnoses),
        amendedById: user.id,
      },
    }),
    prisma.encounter.update({
      where: { id },
      data: {
        noteStatus: "SIGNED",
        signedBy: user.id,
        signedAt: now,
        status: "SIGNED",
        completedAt: now,
        updatedBy: user.id,
      },
    }),
  ]);

  recordAudit({
    actorId: user.id,
    action: "sign",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { patientId: encounter.patientId, version },
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
  const user = await requirePermission("encounters:sign");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = encounterFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const reasonParsed = amendmentSchema.safeParse({ reason });
  if (!reasonParsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true, noteStatus: true, patientId: true },
  });
  if (!existing) return { ok: false, error: "not-found" };
  if (existing.noteStatus === "DRAFT") return { ok: false, error: "not-allowed" };

  const version =
    (await prisma.encounterNoteRevision.count({ where: { encounterId: id } })) + 1;
  const now = new Date();
  const diagnoses = await prisma.encounterDiagnosis.findMany({
    where: { encounterId: id },
    select: { code: true, name: true, isPrimary: true },
  });
  const snapshot = noteSnapshot(
    {
      ...v,
      physicalExamination: v.physicalExamination ?? null,
      followUpDate: v.followUpDate ? new Date(v.followUpDate) : null,
      temperature: v.temperature ?? null,
      height: v.height ?? null,
      weight: v.weight ?? null,
      hpi: v.hpi ?? null,
      reviewOfSystems: v.reviewOfSystems ?? null,
      referralSource: v.referralSource ?? null,
      referralNotes: v.referralNotes ?? null,
      patientInstructions: v.patientInstructions ?? null,
      followUpPlan: v.followUpPlan ?? null,
      chiefComplaint: v.chiefComplaint ?? null,
      subjective: v.subjective ?? null,
      objective: v.objective ?? null,
      assessment: v.assessment ?? null,
      plan: v.plan ?? null,
      pulse: v.pulse ?? null,
      respRate: v.respRate ?? null,
      bpSystolic: v.bpSystolic ?? null,
      bpDiastolic: v.bpDiastolic ?? null,
      spO2: v.spO2 ?? null,
    },
    diagnoses,
  );

  await prisma.$transaction([
    prisma.encounterNoteRevision.create({
      data: {
        clinicId,
        encounterId: id,
        version,
        status: "AMENDED",
        snapshot,
        reason: reasonParsed.data.reason,
        amendedById: user.id,
      },
    }),
    prisma.encounter.update({
      where: { id },
      data: {
        visitType: v.visitType,
        chiefComplaint: v.chiefComplaint || null,
        hpi: v.hpi || null,
        reviewOfSystems: v.reviewOfSystems || null,
        physicalExamination: v.physicalExamination || null,
        subjective: v.subjective || null,
        objective: v.objective || null,
        assessment: v.assessment || null,
        plan: v.plan || null,
        patientInstructions: v.patientInstructions || null,
        followUpPlan: v.followUpPlan || null,
        followUpDate: v.followUpDate ? new Date(v.followUpDate) : null,
        referralSource: v.referralSource || null,
        referralNotes: v.referralNotes || null,
        temperature: v.temperature,
        pulse: v.pulse,
        respRate: v.respRate,
        bpSystolic: v.bpSystolic,
        bpDiastolic: v.bpDiastolic,
        spO2: v.spO2,
        height: v.height,
        weight: v.weight,
        noteStatus: "AMENDED",
        amendmentReason: reasonParsed.data.reason,
        updatedBy: user.id,
      },
    }),
  ]);

  recordAudit({
    actorId: user.id,
    action: "sign",
    entity: "Encounter",
    entityId: id,
    clinicId,
    metadata: { patientId: existing.patientId, amendment: true, version },
  });
  revalidatePath("/encounters");
  revalidatePath(`/encounters/${id}`);
  return { ok: true, id };
}

export type EncounterRevisionRow = {
  id: string;
  version: number;
  status: string;
  reason: string | null;
  amendedByName: string | null;
  createdAt: Date;
  snapshot: Record<string, unknown>;
};

export async function listEncounterRevisions(
  id: string,
): Promise<EncounterRevisionRow[]> {
  const user = await requirePermission("encounters:read");
  const clinicId = user.currentClinicId ?? "";
  const encounter = await prisma.encounter.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!encounter) return [];
  const revisions = await prisma.encounterNoteRevision.findMany({
    where: { encounterId: id },
    orderBy: { version: "desc" },
  });
  const ids = [
    ...new Set(revisions.map((r) => r.amendedById).filter((v): v is string => Boolean(v))),
  ];
  const users = ids.length
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  return revisions.map((r) => ({
    id: r.id,
    version: r.version,
    status: r.status,
    reason: r.reason,
    amendedByName: r.amendedById ? nameById.get(r.amendedById) ?? null : null,
    createdAt: r.createdAt,
    snapshot: (r.snapshot ?? {}) as Record<string, unknown>,
  }));
}

export async function addAttachment(
  encounterId: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = attachmentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const encounter = await prisma.encounter.findFirst({
    where: { id: encounterId, clinicId },
    select: { id: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };

  const row = await prisma.encounterAttachment.create({
    data: {
      clinicId,
      encounterId,
      title: v.title,
      fileName: v.fileName || null,
      url: v.url || null,
      notes: v.notes || null,
      uploadedBy: user.id,
    },
    select: { id: true },
  });
  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "EncounterAttachment",
    entityId: row.id,
    clinicId,
    metadata: { encounterId },
  });
  revalidatePath(`/encounters/${encounterId}`);
  return { ok: true, id: row.id };
}

export async function removeAttachment(id: string): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId ?? "";
  const row = await prisma.encounterAttachment.findFirst({
    where: { id, clinicId },
    select: { id: true, encounterId: true },
  });
  if (!row) return { ok: false, error: "not-found" };
  await prisma.encounterAttachment.delete({ where: { id } });
  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "EncounterAttachment",
    entityId: id,
    clinicId,
    metadata: { encounterId: row.encounterId },
  });
  revalidatePath(`/encounters/${row.encounterId}`);
  return { ok: true, id };
}

export type ClinicalTemplateRow = {
  id: string;
  code: string;
  kind: string;
  specialty: string | null;
  nameAr: string;
  nameEn: string;
  body: Record<string, unknown> | null;
};

export async function listClinicalTemplates(
  kind?: string,
  specialty?: string,
): Promise<ClinicalTemplateRow[]> {
  const user = await requirePermission("encounters:read");
  const clinicId = user.currentClinicId ?? "";
  const rows = await prisma.clinicalTemplate.findMany({
    where: {
      clinicId,
      isActive: true,
      ...(kind ? { kind } : {}),
      ...(specialty ? { OR: [{ specialty }, { specialty: null }] } : {}),
    },
    orderBy: [{ kind: "asc" }, { code: "asc" }],
    select: { id: true, kind: true, specialty: true, code: true, nameAr: true, nameEn: true, body: true },
  });
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    specialty: r.specialty,
    code: r.code,
    nameAr: r.nameAr,
    nameEn: r.nameEn,
    body: (r.body ?? null) as Record<string, unknown> | null,
  }));
}
