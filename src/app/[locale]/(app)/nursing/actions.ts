"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { setEncounterStatus } from "@/app/[locale]/(app)/encounters/actions";
import { triageSchema, vitalsSchema } from "./schema";

type Result = { ok: true; id: string } | { ok: false; error: string };

export type NursingVitals = {
  id: string;
  measuredAt: string;
  temperature: string | null;
  pulse: number | null;
  respRate: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  spO2: number | null;
  painScore: number | null;
  glucose: string | null;
  height: string | null;
  weight: string | null;
  bmi: string | null;
  notes: string | null;
};

export type NursingQueueRow = {
  encounterId: string;
  encounterNo: string;
  status: string;
  patientId: string;
  patientName: string;
  mrn: string;
  doctorName: string | null;
  visitType: string;
  triageLevel: string | null;
  triageNotes: string | null;
  checkedInAt: string | null;
  createdAt: string;
  latestVitals: NursingVitals | null;
};

function nameOf(p: {
  firstNameAr: string;
  secondNameAr: string | null;
  lastNameAr: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
}) {
  const ar = [p.firstNameAr, p.secondNameAr, p.lastNameAr].filter(Boolean).join(" ");
  if (ar.trim()) return ar;
  return [p.firstNameEn, p.lastNameEn].filter(Boolean).join(" ");
}

export async function listNursingQueue(): Promise<NursingQueueRow[]> {
  const user = await requirePermission("nursing:read");
  const clinicId = user.currentClinicId ?? "";
  const rows = await prisma.encounter.findMany({
    where: { clinicId, status: { in: ["CHECKED_IN", "TRIAGE"] as never[] } },
    include: {
      patient: {
        select: {
          firstNameAr: true,
          secondNameAr: true,
          lastNameAr: true,
          firstNameEn: true,
          lastNameEn: true,
          mrn: true,
        },
      },
      doctor: { select: { name: true } },
      vitalSigns: { orderBy: { measuredAt: "desc" }, take: 1 },
    },
    orderBy: { checkedInAt: "asc" },
    take: 100,
  });

  return rows.map((e) => {
    const v = e.vitalSigns[0];
    return {
      encounterId: e.id,
      encounterNo: e.encounterNo,
      status: e.status,
      patientId: e.patientId,
      patientName: nameOf(e.patient),
      mrn: e.patient.mrn,
      doctorName: e.doctor?.name ?? null,
      visitType: e.visitType,
      triageLevel: e.triageLevel,
      triageNotes: e.triageNotes,
      checkedInAt: e.checkedInAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      latestVitals: v
        ? {
            id: v.id,
            measuredAt: v.measuredAt.toISOString(),
            temperature: v.temperature === null ? null : String(v.temperature),
            pulse: v.pulse,
            respRate: v.respRate,
            bpSystolic: v.bpSystolic,
            bpDiastolic: v.bpDiastolic,
            spO2: v.spO2,
            painScore: v.painScore,
            glucose: v.glucose === null ? null : String(v.glucose),
            height: v.height === null ? null : String(v.height),
            weight: v.weight === null ? null : String(v.weight),
            bmi: v.bmi === null ? null : String(v.bmi),
            notes: v.notes,
          }
        : null,
    };
  });
}

function computeBmi(height: number | undefined, weight: number | undefined) {
  if (!height || !weight) return null;
  const m = height / 100;
  if (m <= 0) return null;
  return Math.round((weight / (m * m)) * 10) / 10;
}

export async function recordVitals(
  encounterId: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("nursing:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = vitalsSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const encounter = await prisma.encounter.findFirst({
    where: { id: encounterId, clinicId },
    select: { id: true, patientId: true, status: true, checkedInAt: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };

  const bmi = computeBmi(v.height, v.weight);

  await prisma.vitalSign.create({
    data: {
      clinicId,
      patientId: encounter.patientId,
      encounterId,
      measuredAt: new Date(),
      temperature: v.temperature ?? null,
      pulse: v.pulse ?? null,
      respRate: v.respRate ?? null,
      bpSystolic: v.bpSystolic ?? null,
      bpDiastolic: v.bpDiastolic ?? null,
      spO2: v.spO2 ?? null,
      painScore: v.painScore,
      glucose: v.glucose ?? null,
      height: v.height ?? null,
      weight: v.weight ?? null,
      bmi,
      notes: v.notes || null,
      createdBy: user.id,
      recordedById: user.id,
    },
    select: { id: true },
  });

  await prisma.encounter.update({    where: { id: encounterId },
    data: {
      temperature: v.temperature ?? null,
      pulse: v.pulse ?? null,
      respRate: v.respRate ?? null,
      bpSystolic: v.bpSystolic ?? null,
      bpDiastolic: v.bpDiastolic ?? null,
      spO2: v.spO2 ?? null,
      height: v.height ?? null,
      weight: v.weight ?? null,
      ...(v.triageLevel ? { triageLevel: v.triageLevel } : {}),
      ...(v.triageNotes ? { triageNotes: v.triageNotes } : {}),
      ...(encounter.checkedInAt ? {} : { checkedInAt: new Date() }),
      ...(encounter.status === "CHECKED_IN" ? { status: "TRIAGE" as never } : {}),
      updatedBy: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "VitalSign",
    entityId: encounterId,
    clinicId,
    metadata: { encounterId, patientId: encounter.patientId, advanced: encounter.status === "CHECKED_IN" },
  });
  revalidatePath("/nursing");
  revalidatePath(`/encounters/${encounterId}`);
  revalidatePath(`/patients/${encounter.patientId}`);
  return { ok: true, id: encounterId };
}

export async function setTriage(
  encounterId: string,
  values: unknown,
): Promise<Result> {
  const user = await requirePermission("nursing:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = triageSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const encounter = await prisma.encounter.findFirst({
    where: { id: encounterId, clinicId },
    select: { id: true, patientId: true, status: true },
  });
  if (!encounter) return { ok: false, error: "not-found" };

  await prisma.encounter.update({
    where: { id: encounterId },
    data: {
      triageLevel: v.triageLevel,
      triageNotes: v.triageNotes || null,
      ...(encounter.status === "CHECKED_IN" ? { status: "TRIAGE" } : {}),
      updatedBy: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "VitalSign",
    entityId: encounterId,
    clinicId,
    metadata: { encounterId, patientId: encounter.patientId },
  });
  revalidatePath("/nursing");
  revalidatePath(`/encounters/${encounterId}`);
  revalidatePath(`/patients/${encounter.patientId}`);
  return { ok: true, id: encounterId };
}

export async function startConsultationFromTriage(
  encounterId: string,
): Promise<Result> {
  const res = await setEncounterStatus(encounterId, "IN_CONSULTATION");
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/nursing");
  return { ok: true, id: encounterId };
}
