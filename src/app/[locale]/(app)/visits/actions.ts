"use server";

import { revalidatePath } from "next/cache";
import { requireAnyPermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import {
  ACTIVE_ENTRY_STATUSES,
  PRIORITY_WEIGHT,
  ensureQueue,
  nextVisitNumber,
} from "@/lib/visits/queue";
import {
  openVisitSchema,
  routeVisitSchema,
  queueEntryStatusSchema,
  type QueueEntryStatusValue,
  type VisitRoute,
  type VisitTypeValue,
} from "./schema";

type VisitError = "no-clinic" | "not-found" | "invalid" | "not-allowed";

type OpenVisitResult =
  | { ok: true; visitId: string; encounterId: string; redirectTo: string }
  | { ok: false; error: VisitError };

type Result = { ok: true } | { ok: false; error: VisitError };

export type VisitOption = { id: string; nameAr: string; nameEn: string };

function encounterTypeFor(type: VisitTypeValue): "INITIAL" | "FOLLOW_UP" {
  return type === "FOLLOW_UP" ? "FOLLOW_UP" : "INITIAL";
}

function revalidateVisitPaths(patientId: string) {
  revalidatePath("/queue");
  revalidatePath("/reception");
  revalidatePath("/encounters");
  revalidatePath("/visits");
  revalidatePath(`/patients/${patientId}`);
}

/** Doctors (physicians) and active departments for the visit registration form. */
export async function listVisitOptions(): Promise<{
  doctors: VisitOption[];
  departments: VisitOption[];
}> {
  const user = await requireAnyPermission([
    "patients:write",
    "reception:write",
    "encounters:write",
  ]);
  const clinicId = user.currentClinicId ?? "";
  if (!clinicId) return { doctors: [], departments: [] };

  const select = { id: true, name: true, nameAr: true, nameEn: true } as const;
  const physicians = await prisma.user.findMany({
    where: { clinicId, isActive: true, role: { code: "physician" } },
    select,
    orderBy: { name: "asc" },
  });
  const doctorRows =
    physicians.length > 0
      ? physicians
      : await prisma.user.findMany({
          where: { clinicId, isActive: true },
          select,
          orderBy: { name: "asc" },
        });

  const departments = await prisma.department.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, nameAr: true, nameEn: true },
    orderBy: { nameAr: "asc" },
  });

  return {
    doctors: doctorRows.map((d) => ({
      id: d.id,
      nameAr: d.nameAr ?? d.name,
      nameEn: d.nameEn ?? d.name,
    })),
    departments: departments.map((d) => ({
      id: d.id,
      nameAr: d.nameAr,
      nameEn: d.nameEn,
    })),
  };
}

/**
 * Registers a new Visit (attendance) for a patient: records arrival time and
 * the registering employee, links an encounter, and places the patient in the
 * doctor or triage queue.
 */
export async function openVisit(
  patientId: string,
  input: unknown,
): Promise<OpenVisitResult> {
  const user = await requireAnyPermission([
    "patients:write",
    "reception:write",
    "encounters:write",
  ]);
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = openVisitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const {
    route,
    type,
    priority,
    referralSource,
    departmentId,
    doctorId,
    reason,
    chiefComplaint,
    symptomDurationValue,
    symptomDurationUnit,
    notes,
  } = parsed.data;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    select: { id: true, mrn: true },
  });
  if (!patient) return { ok: false, error: "not-found" };

  const canWriteEncounter = await can(user, "encounters:write");
  const queue = await ensureQueue(clinicId, route);
  const now = new Date();
  const assignedDoctorId = doctorId || (canWriteEncounter ? user.id : null);

  const created = await prisma.$transaction(async (tx) => {
    const visitNumber = await nextVisitNumber(tx, clinicId);

    const encounter = await tx.encounter.create({
      data: {
        clinicId,
        patientId,
        doctorId: assignedDoctorId,
        type: encounterTypeFor(type),
        status: "IN_PROGRESS",
        chiefComplaint: chiefComplaint ?? null,
        symptomDurationValue: symptomDurationValue ?? null,
        symptomDurationUnit: symptomDurationUnit ?? null,
        startedAt: now,
        createdBy: user.id,
        updatedBy: user.id,
      },
      select: { id: true },
    });

    const visit = await tx.visit.create({
      data: {
        clinicId,
        patientId,
        visitNumber,
        mrn: patient.mrn,
        encounterId: encounter.id,
        type,
        priority,
        status: route === "TRIAGE" ? "TRIAGE" : "WAITING",
        source: "WALK_IN",
        referralSource,
        reason: reason ?? null,
        chiefComplaint: chiefComplaint ?? null,
        symptomDurationValue: symptomDurationValue ?? null,
        symptomDurationUnit: symptomDurationUnit ?? null,
        arrivedAt: now,
        registeredById: user.id,
        doctorId: assignedDoctorId,
        departmentId: departmentId || null,
        notes: notes || null,
        createdBy: user.id,
        updatedBy: user.id,
      },
      select: { id: true },
    });

    const activeCount = await tx.queueEntry.count({
      where: { queueId: queue.id, status: { in: [...ACTIVE_ENTRY_STATUSES] } },
    });

    await tx.queueEntry.create({
      data: {
        clinicId,
        queueId: queue.id,
        visitId: visit.id,
        patientId,
        position: activeCount + 1,
        priority: PRIORITY_WEIGHT[priority],
        status: "WAITING",
        addedById: user.id,
      },
    });

    return { visitId: visit.id, encounterId: encounter.id };
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Visit",
    entityId: created.visitId,
    clinicId,
    metadata: {
      patientId,
      route,
      type,
      priority,
      mrn: patient.mrn,
      encounterId: created.encounterId,
    },
  });

  revalidateVisitPaths(patientId);

  return {
    ok: true,
    visitId: created.visitId,
    encounterId: created.encounterId,
    redirectTo: "/queue",
  };
}

/** Moves an existing visit between the triage and doctor queues. */
export async function routeVisit(
  visitId: string,
  input: unknown,
): Promise<Result> {
  const user = await requireAnyPermission([
    "queue:write",
    "reception:write",
    "encounters:write",
  ]);
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = routeVisitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { destination, doctorId } = parsed.data;

  const visit = await prisma.visit.findFirst({
    where: { id: visitId, clinicId },
    select: { id: true, patientId: true, priority: true },
  });
  if (!visit) return { ok: false, error: "not-found" };

  const queue = await ensureQueue(clinicId, destination);

  await prisma.$transaction(async (tx) => {
    await tx.queueEntry.updateMany({
      where: { visitId, status: { in: [...ACTIVE_ENTRY_STATUSES] } },
      data: { status: "CANCELLED" },
    });

    const activeCount = await tx.queueEntry.count({
      where: { queueId: queue.id, status: { in: [...ACTIVE_ENTRY_STATUSES] } },
    });

    await tx.queueEntry.create({
      data: {
        clinicId,
        queueId: queue.id,
        visitId,
        patientId: visit.patientId,
        position: activeCount + 1,
        priority: PRIORITY_WEIGHT[visit.priority],
        status: "WAITING",
        addedById: user.id,
      },
    });

    await tx.visit.update({
      where: { id: visitId },
      data: {
        status: destination === "TRIAGE" ? "TRIAGE" : "WAITING",
        doctorId: destination === "DOCTOR" ? doctorId || null : null,
        updatedBy: user.id,
      },
    });
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Visit",
    entityId: visitId,
    clinicId,
    metadata: { route: destination, doctorId: doctorId ?? null },
  });

  revalidateVisitPaths(visit.patientId);
  return { ok: true };
}

/** Advances a queue entry through its lifecycle. */
export async function setQueueEntryStatus(
  entryId: string,
  status: QueueEntryStatusValue,
): Promise<Result> {
  const user = await requireAnyPermission([
    "queue:write",
    "reception:write",
    "encounters:write",
  ]);
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = queueEntryStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const next = parsed.data;

  const entry = await prisma.queueEntry.findFirst({
    where: { id: entryId, clinicId },
    select: { id: true, visitId: true },
  });
  if (!entry) return { ok: false, error: "not-found" };

  const now = new Date();
  await prisma.$transaction([
    prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: next,
        ...(next === "CALLED" ? { calledAt: now } : {}),
        ...(next === "IN_PROGRESS" ? { startedAt: now } : {}),
        ...(next === "DONE" ? { completedAt: now } : {}),
      },
    }),
    ...(next === "IN_PROGRESS"
      ? [
          prisma.visit.update({
            where: { id: entry.visitId },
            data: { status: "IN_SERVICE", updatedBy: user.id },
          }),
        ]
      : next === "DONE"
        ? [
            prisma.visit.update({
              where: { id: entry.visitId },
              data: { status: "COMPLETED", completedAt: now, updatedBy: user.id },
            }),
          ]
        : []),
  ]);

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "QueueEntry",
    entityId: entryId,
    clinicId,
    metadata: { status: next },
  });

  revalidatePath("/queue");
  revalidatePath("/reception");
  return { ok: true };
}

/** Pulls the next waiting patient in a queue and marks them as called. */
export async function callNextEntry(queueId: string): Promise<Result> {
  const user = await requireAnyPermission([
    "queue:write",
    "reception:write",
  ]);
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const queue = await prisma.queue.findFirst({
    where: { id: queueId, clinicId },
    select: { id: true },
  });
  if (!queue) return { ok: false, error: "not-found" };

  const next = await prisma.queueEntry.findFirst({
    where: { queueId, status: "WAITING" },
    orderBy: [
      { priority: "desc" },
      { visit: { arrivedAt: "asc" } },
      { position: "asc" },
    ],
    select: { id: true },
  });
  if (!next) return { ok: false, error: "not-found" };

  await prisma.queueEntry.update({
    where: { id: next.id },
    data: { status: "CALLED", calledAt: new Date() },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "QueueEntry",
    entityId: next.id,
    clinicId,
    metadata: { status: "CALLED", queueId },
  });

  revalidatePath("/queue");
  return { ok: true };
}
