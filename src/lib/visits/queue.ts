import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";

export type QueueRoute = "TRIAGE" | "DOCTOR";

export const ACTIVE_ENTRY_STATUSES = [
  "WAITING",
  "CALLED",
  "IN_PROGRESS",
] as const;

export const PRIORITY_WEIGHT = {
  NORMAL: 0,
  URGENT: 10,
  EMERGENCY: 20,
} as const;

const QUEUE_META: Record<QueueRoute, { nameAr: string; nameEn: string }> = {
  TRIAGE: { nameAr: "الفرز والعلامات الحيوية", nameEn: "Triage & Vitals" },
  DOCTOR: { nameAr: "طابور الأطباء", nameEn: "Doctor Queue" },
};

export async function ensureQueue(clinicId: string, kind: QueueRoute) {
  const existing = await prisma.queue.findFirst({
    where: { clinicId, code: kind },
    select: { id: true },
  });
  if (existing) return existing;
  return prisma.queue.create({
    data: { clinicId, code: kind, kind, ...QUEUE_META[kind] },
    select: { id: true },
  });
}

export async function nextVisitNumber(
  tx: Prisma.TransactionClient,
  clinicId: string,
): Promise<string> {
  const seq = await tx.numberSequence.upsert({
    where: { clinicId_key: { clinicId, key: "VISIT" } },
    create: {
      clinicId,
      key: "VISIT",
      prefix: "V",
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
}

/**
 * Places a patient in a live queue without starting a clinical encounter:
 * records a walk-in Visit and a waiting QueueEntry so reception can see and
 * call the patient. Used when a patient is registered without opening a visit.
 */
export async function enqueuePatient(
  tx: Prisma.TransactionClient,
  params: {
    clinicId: string;
    patientId: string;
    mrn: string;
    userId: string;
    route?: QueueRoute;
  },
): Promise<{ visitId: string }> {
  const route = params.route ?? "DOCTOR";
  const queue = await ensureQueue(params.clinicId, route);
  const visitNumber = await nextVisitNumber(tx, params.clinicId);

  const visit = await tx.visit.create({
    data: {
      clinicId: params.clinicId,
      patientId: params.patientId,
      visitNumber,
      mrn: params.mrn,
      type: "NEW",
      priority: "NORMAL",
      status: route === "TRIAGE" ? "TRIAGE" : "WAITING",
      source: "WALK_IN",
      referralSource: "SELF",
      arrivedAt: new Date(),
      registeredById: params.userId,
      createdBy: params.userId,
      updatedBy: params.userId,
    },
    select: { id: true },
  });

  const activeCount = await tx.queueEntry.count({
    where: {
      queueId: queue.id,
      status: { in: [...ACTIVE_ENTRY_STATUSES] },
    },
  });

  await tx.queueEntry.create({
    data: {
      clinicId: params.clinicId,
      queueId: queue.id,
      visitId: visit.id,
      patientId: params.patientId,
      position: activeCount + 1,
      priority: PRIORITY_WEIGHT.NORMAL,
      status: "WAITING",
      addedById: params.userId,
    },
  });

  return { visitId: visit.id };
}
