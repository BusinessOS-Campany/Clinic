"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { patientFormSchema, type PatientFormValues } from "./schema";

export type DuplicatePatient = {
  id: string;
  mrn: string;
  patientId: string;
  firstNameAr: string;
  secondNameAr: string | null;
  lastNameAr: string;
  phone: string | null;
  birthDate: Date | null;
};

type ActionResult =
  | { ok: true; id: string; mrn?: string; patientId?: string }
  | {
      ok: false;
      error: "no-clinic" | "not-found" | "invalid" | "duplicate";
      duplicates?: DuplicatePatient[];
    };

async function nextPatientId(clinicId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const seq = await tx.numberSequence.upsert({
      where: { clinicId_key: { clinicId, key: "PATIENT_ID" } },
      create: {
        clinicId,
        key: "PATIENT_ID",
        prefix: "PID",
        currentValue: 1n,
        padLength: 6,
      },
      update: { currentValue: { increment: 1 } },
    });
    const padded = String(seq.currentValue).padStart(
      seq.padLength > 0 ? seq.padLength : 6,
      "0",
    );
    return `${seq.prefix ?? ""}${padded}${seq.suffix ?? ""}`;
  });
}

async function nextMrn(clinicId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const seq = await tx.numberSequence.upsert({
      where: { clinicId_key: { clinicId, key: "PATIENT" } },
      create: {
        clinicId,
        key: "PATIENT",
        prefix: "P",
        currentValue: 1n,
        padLength: 5,
      },
      update: { currentValue: { increment: 1 } },
    });
    const padded = String(seq.currentValue).padStart(
      seq.padLength > 0 ? seq.padLength : 5,
      "0",
    );
    return `${seq.prefix ?? ""}${padded}${seq.suffix ?? ""}`;
  });
}

function toData(values: PatientFormValues) {
  return {
    firstNameAr: values.firstNameAr,
    secondNameAr: values.secondNameAr || null,
    lastNameAr: values.lastNameAr,
    gender: values.gender,
    birthDate: values.birthDate ? new Date(values.birthDate) : null,
    phone: values.phone || null,
    phone2: values.phone2 || null,
    address: values.address || null,
    city: values.city || null,
    insuranceCompany: values.insuranceCompany || null,
    notes: values.notes || null,
  };
}

export async function createPatient(
  values: PatientFormValues,
  options?: { allowDuplicate?: boolean },
): Promise<ActionResult> {
  try {
    const user = await requirePermission("patients:write");
    const parsed = patientFormSchema.parse(values);
    const clinicId = user.currentClinicId;
    if (!clinicId) return { ok: false, error: "no-clinic" };

    if (!options?.allowDuplicate) {
      const duplicates = await findDuplicatePatients(clinicId, parsed);
      if (duplicates.length > 0) {
        return { ok: false, error: "duplicate", duplicates };
      }
    }

    const [mrn, patientId] = await Promise.all([
      nextMrn(clinicId),
      nextPatientId(clinicId),
    ]);
    const patient = await prisma.patient.create({
      data: {
        clinicId,
        mrn,
        patientId,
        ...toData(parsed),
        createdBy: user.id,
        updatedBy: user.id,
      },
      select: { id: true },
    });

    recordAudit({
      actorId: user.id,
      action: "create",
      entity: "Patient",
      entityId: patient.id,
      clinicId,
      metadata: { mrn, patientId },
    });
    revalidatePath("/patients");
    revalidatePath("/");
    return { ok: true, id: patient.id, mrn, patientId };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, error: "invalid" };
    }
    throw err;
  }
}

export async function updatePatient(
  id: string,
  values: PatientFormValues,
): Promise<ActionResult> {
  const user = await requirePermission("patients:write");
  const parsed = patientFormSchema.parse(values);
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await prisma.patient.findFirst({ where: { id, clinicId } });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.patient.update({
    where: { id },
    data: { ...toData(parsed), updatedBy: user.id },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Patient",
    entityId: id,
    clinicId,
    metadata: { mrn: existing.mrn },
  });
  revalidatePath("/patients");
  revalidatePath(`/patients/${id}`);
  return { ok: true, id };
}
const DUPLICATE_SELECT = {
  id: true,
  mrn: true,
  patientId: true,
  firstNameAr: true,
  secondNameAr: true,
  lastNameAr: true,
  phone: true,
  birthDate: true,
} as const;

async function findDuplicatePatients(
  clinicId: string,
  values: Partial<PatientFormValues>,
): Promise<DuplicatePatient[]> {
  const or: Prisma.PatientWhereInput[] = [];

  const phones = [values.phone, values.phone2]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));
  if (phones.length > 0) {
    or.push({
      OR: phones.flatMap((phone) => [{ phone }, { phone2: phone }]),
    });
  }

  const name: Prisma.PatientWhereInput = {
    firstNameAr: values.firstNameAr,
    lastNameAr: values.lastNameAr,
  };
  if (values.birthDate) name.birthDate = new Date(values.birthDate);
  or.push(name);

  if (or.length === 0) return [];

  return prisma.patient.findMany({
    where: {
      clinicId,
      mergedIntoId: null,
      OR: or,
    },
    select: DUPLICATE_SELECT,
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function checkPatientDuplicates(
  values: Partial<PatientFormValues>,
): Promise<DuplicatePatient[]> {
  const user = await requirePermission("patients:read");
  const clinicId = user.currentClinicId;
  if (!clinicId) return [];
  return findDuplicatePatients(clinicId, values);
}

export async function recordPatientView(patientId: string): Promise<void> {
  const user = await requirePermission("patients:read");
  const clinicId = user.currentClinicId;
  if (!clinicId) return;
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId, mergedIntoId: null },
    select: { id: true },
  });
  if (!patient) return;
  await prisma.patientView.upsert({
    where: { userId_patientId: { userId: user.id, patientId } },
    create: { userId: user.id, patientId, clinicId },
    update: { viewedAt: new Date() },
  });
}

type MergeResult =
  | { ok: true; moved: Record<string, number> }
  | { ok: false; error: "not-found" | "same-patient" | "already-merged" };

export async function mergePatients(
  sourceId: string,
  targetId: string,
): Promise<MergeResult> {
  const user = await requirePermission("patients:merge");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "not-found" };
  if (sourceId === targetId) return { ok: false, error: "same-patient" };

  const [source, target] = await Promise.all([
    prisma.patient.findFirst({ where: { id: sourceId, clinicId } }),
    prisma.patient.findFirst({ where: { id: targetId, clinicId } }),
  ]);
  if (!source || !target) return { ok: false, error: "not-found" };
  if (source.mergedIntoId || target.mergedIntoId) {
    return { ok: false, error: "already-merged" };
  }

  const moved = await prisma.$transaction(async (tx) => {
    const counts: Record<string, number> = {};
    const where = { patientId: sourceId, clinicId };
    const data = { patientId: targetId };

    counts.appointments = (await tx.appointment.updateMany({ where, data })).count;
    counts.encounters = (await tx.encounter.updateMany({ where, data })).count;
    await tx.medicalOrder.updateMany({ where: { patientId: sourceId, clinicId }, data: { patientId: targetId, encounterId: undefined } }).catch(() => undefined);
    counts.invoices = (await tx.invoice.updateMany({ where: { patientId: sourceId, clinicId }, data: { patientId: targetId } })).count;
    counts.medicalHistories = (
      await tx.medicalHistory.updateMany({ where: { patientId: sourceId, clinicId }, data: { patientId: targetId } })
    ).count;
    counts.allergies = (
      await tx.allergy.updateMany({ where: { patientId: sourceId, clinicId }, data: { patientId: targetId } })
    ).count;
    counts.vitalSigns = (
      await tx.vitalSign.updateMany({ where: { patientId: sourceId, clinicId }, data: { patientId: targetId } })
    ).count;
    const documentsRes = await tx.patientDocument.updateMany({
      where: { patientId: sourceId, clinicId },
      data: { patientId: targetId },
    });
    counts.documents = documentsRes.count;

    const diagnosisRes = await tx.diagnosis.updateMany({
      where: { patientId: sourceId, clinicId },
      data: { patientId: targetId },
    });
    counts.diagnoses = diagnosisRes.count;
    await tx.referral.updateMany({ where: { patientId: sourceId, clinicId }, data: { patientId: targetId } });
    await tx.consentForm.updateMany({ where: { patientId: sourceId, clinicId }, data: { patientId: targetId } });
    await tx.medicalOrder.updateMany({
      where: { patientId: sourceId, clinicId },
      data: { patientId: targetId },
    });
    await tx.labRequest.updateMany({
      where: { patientId: sourceId, clinicId },
      data: { patientId: targetId },
    });
    await tx.imagingRequest.updateMany({
      where: { patientId: sourceId, clinicId },
      data: { patientId: targetId },
    });
    await tx.dispensation.updateMany({
      where: { patientId: sourceId, clinicId },
      data: { patientId: targetId },
    });

    const removedViews = await tx.patientView.deleteMany({
      where: { patientId: sourceId },
    });
    counts.views = removedViews.count;

    await tx.patient.update({
      where: { id: sourceId },
      data: {
        status: "INACTIVE",
        mergedIntoId: targetId,
        mergedAt: new Date(),
        updatedBy: user.id,
      },
    });

    return counts;
  });

  recordAudit({
    actorId: user.id,
    action: "merge",
    entity: "Patient",
    entityId: targetId,
    clinicId,
    metadata: {
      sourceId,
      sourceMrn: source.mrn,
      sourcePatientId: source.patientId,
      targetId,
      targetMrn: target.mrn,
      targetPatientId: target.patientId,
      moved,
    },
  });
  recordAudit({
    actorId: user.id,
    action: "merge",
    entity: "Patient",
    entityId: sourceId,
    clinicId,
    metadata: {
      mergedIntoId: targetId,
      mergedIntoMrn: target.mrn,
      moved,
    },
  });

  revalidatePath("/patients");
  revalidatePath(`/patients/${sourceId}`);
  revalidatePath(`/patients/${targetId}`);
  return { ok: true, moved };
}
