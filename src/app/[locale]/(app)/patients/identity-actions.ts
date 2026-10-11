"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@/lib/generated/prisma/client";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import {
  findDuplicateCandidates,
  probableDuplicates,
  type DuplicateCandidate,
} from "@/lib/patients-duplicates";

export type MergeActionError =
  | "no-clinic"
  | "not-found"
  | "forbidden"
  | "self-approval"
  | "already-decided"
  | "invalid-selection";

export type DuplicateCheckResult = {
  ok: true;
  candidates: DuplicateCandidate[];
  probable: DuplicateCandidate[];
  blocked: boolean;
};

/**
 * Live duplicate check used while registering. Scoped to the caller's clinic so
 * a patient keeps one longitudinal record per organisation.
 */
export async function checkDuplicatePatient(
  input: {
    firstNameAr?: string;
    secondNameAr?: string;
    lastNameAr?: string;
    phone?: string;
    phone2?: string;
    nationalId?: string;
    birthDate?: string;
  },
  excludeId?: string,
): Promise<DuplicateCheckResult> {
  const user = await requirePermission("patients:read");
  const clinicId = user.currentClinicId ?? "";
  if (!clinicId) return { ok: true, candidates: [], probable: [], blocked: false };

  if (!input.firstNameAr?.trim() && !input.nationalId?.trim() && !input.phone?.trim()) {
    return { ok: true, candidates: [], probable: [], blocked: false };
  }

  const candidates = await findDuplicateCandidates(
    clinicId,
    {
      firstNameAr: input.firstNameAr ?? "",
      secondNameAr: input.secondNameAr,
      lastNameAr: input.lastNameAr ?? "",
      phone: input.phone,
      phone2: input.phone2,
      nationalId: input.nationalId,
      birthDate: input.birthDate,
    },
    excludeId,
  );

  const probable = probableDuplicates(candidates);
  return {
    ok: true,
    candidates,
    probable,
    // A national-ID clash is always blocking; softer matches need confirmation.
    blocked: probable.some((c) => c.reasons.includes("nationalId")),
  };
}

export async function recordPatientView(patientId: string) {
  const user = await requirePermission("patients:read");
  const clinicId = user.currentClinicId;
  if (!clinicId) return;

  const owned = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    select: { id: true },
  });
  if (!owned) return;

  await prisma.patientView.upsert({
    where: { userId_patientId: { userId: user.id, patientId } },
    create: { clinicId, userId: user.id, patientId },
    update: { viewedAt: new Date() },
  });
}

export type MergeRequestResult =
  | { ok: true; id: string }
  | { ok: false; error: MergeActionError };

/** Step 1: request a merge. Requires patients:merge. */
export async function requestPatientMerge(input: {
  primaryId: string;
  duplicateIds: string[];
  reason: string;
}): Promise<MergeRequestResult> {
  try {
    const user = await requirePermission("patients:merge");
    const clinicId = user.currentClinicId ?? "";
    if (!clinicId) return { ok: false, error: "no-clinic" };

    const primary = await prisma.patient.findFirst({
      where: { id: input.primaryId, clinicId },
      select: { id: true, mrn: true, mergedIntoId: true },
    });
    if (!primary || primary.mergedIntoId) return { ok: false, error: "not-found" };

    const duplicateIds = [...new Set(input.duplicateIds)].filter(
      (id) => id && id !== input.primaryId,
    );
    if (duplicateIds.length === 0) return { ok: false, error: "invalid-selection" };

    const duplicates = await prisma.patient.findMany({
      where: { id: { in: duplicateIds }, clinicId },
      select: { id: true, mrn: true, mergedIntoId: true },
    });
    if (duplicates.length !== duplicateIds.length) {
      return { ok: false, error: "not-found" };
    }
    if (duplicates.some((d) => d.mergedIntoId)) {
      return { ok: false, error: "invalid-selection" };
    }

    const request = await prisma.patientMergeRequest.create({
      data: {
        clinicId,
        primaryId: primary.id,
        duplicateIds,
        reason: input.reason.trim() || "duplicate-records",
        requestedById: user.id,
      },
    });

    recordAudit({
      actorId: user.id,
      action: "create",
      entity: "PatientMergeRequest",
      entityId: request.id,
      clinicId,
      metadata: {
        primaryId: primary.id,
        primaryMrn: primary.mrn,
        duplicateIds,
        duplicateMrns: duplicates.map((d) => d.mrn),
      },
    });

    revalidatePath("/patients/merges");
    revalidatePath("/patients");
    return { ok: true, id: request.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, error: "invalid-selection" };
    }
    throw err;
  }
}

/** Step 2: an authorized approver (never the requester) signs off. */
export async function approvePatientMerge(
  requestId: string,
): Promise<MergeRequestResult> {
  try {
    const user = await requirePermission("patients:merge");
    const clinicId = user.currentClinicId ?? "";
    if (!clinicId) return { ok: false, error: "no-clinic" };

    const request = await prisma.patientMergeRequest.findFirst({
      where: { id: requestId, clinicId },
    });
    if (!request) return { ok: false, error: "not-found" };
    if (request.status !== "PENDING") return { ok: false, error: "already-decided" };
    if (request.requestedById === user.id) {
      return { ok: false, error: "self-approval" };
    }

    await prisma.patientMergeRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED", approvedById: user.id, decidedAt: new Date() },
    });

    recordAudit({
      actorId: user.id,
      action: "verify",
      entity: "PatientMergeRequest",
      entityId: request.id,
      clinicId,
      metadata: { approved: true, primaryId: request.primaryId },
    });

    revalidatePath("/patients/merges");
    return { ok: true, id: request.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, error: "not-found" };
    }
    throw err;
  }
}

export async function rejectPatientMerge(
  requestId: string,
): Promise<MergeRequestResult> {
  try {
    const user = await requirePermission("patients:merge");
    const clinicId = user.currentClinicId ?? "";
    if (!clinicId) return { ok: false, error: "no-clinic" };

    const request = await prisma.patientMergeRequest.findFirst({
      where: { id: requestId, clinicId },
    });
    if (!request) return { ok: false, error: "not-found" };
    if (request.status !== "PENDING") return { ok: false, error: "already-decided" };

    await prisma.patientMergeRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED", approvedById: user.id, decidedAt: new Date() },
    });

    recordAudit({
      actorId: user.id,
      action: "verify",
      entity: "PatientMergeRequest",
      entityId: request.id,
      clinicId,
      metadata: { approved: false, primaryId: request.primaryId },
    });

    revalidatePath("/patients/merges");
    return { ok: true, id: request.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, error: "not-found" };
    }
    throw err;
  }
}

/**
 * Step 3: apply an approved merge. Every related clinical row moves to the
 * primary record so the longitudinal history stays in one place; the duplicate
 * rows are retired (never hard-deleted) and keep pointing at the survivor.
 */
export async function applyPatientMerge(
  requestId: string,
): Promise<MergeRequestResult> {
  try {
    const user = await requirePermission("patients:merge");
    const clinicId = user.currentClinicId ?? "";
    if (!clinicId) return { ok: false, error: "no-clinic" };

    const request = await prisma.patientMergeRequest.findFirst({
      where: { id: requestId, clinicId },
    });
    if (!request) return { ok: false, error: "not-found" };
    if (request.status !== "APPROVED") return { ok: false, error: "already-decided" };
    if (request.requestedById === user.id && request.approvedById !== user.id) {
      return { ok: false, error: "self-approval" };
    }

    const primary = await prisma.patient.findFirst({
      where: { id: request.primaryId, clinicId, mergedIntoId: null },
    });
    const duplicates = await prisma.patient.findMany({
      where: { id: { in: request.duplicateIds }, clinicId, mergedIntoId: null },
    });
    if (!primary) return { ok: false, error: "not-found" };
    if (duplicates.length !== request.duplicateIds.length) {
      return { ok: false, error: "invalid-selection" };
    }

    const duplicateIds = duplicates.map((d) => d.id);
    const counts = {
      appointments: await prisma.appointment.count({
        where: { patientId: { in: duplicateIds }, clinicId },
      }),
      encounters: await prisma.encounter.count({
        where: { patientId: { in: duplicateIds }, clinicId },
      }),
      invoices: await prisma.invoice.count({
        where: { patientId: { in: duplicateIds }, clinicId },
      }),
    };

    await prisma.$transaction(async (tx) => {
      await tx.appointment.updateMany({
        where: { patientId: { in: duplicateIds }, clinicId },
        data: { patientId: primary.id },
      });
      await tx.encounter.updateMany({
        where: { patientId: { in: duplicateIds }, clinicId },
        data: { patientId: primary.id },
      });
      await tx.invoice.updateMany({
        where: { patientId: { in: duplicateIds }, clinicId },
        data: { patientId: primary.id },
      });
      await tx.patient.updateMany({
        where: { id: { in: duplicateIds }, clinicId },
        data: { mergedIntoId: primary.id, status: "INACTIVE" },
      });
      await tx.patientView.deleteMany({ where: { patientId: { in: duplicateIds } } });
      await tx.patientMergeRequest.update({
        where: { id: request.id },
        data: {
          status: "APPLIED",
          decidedAt: new Date(),
          snapshot: {
            primaryId: primary.id,
            primaryMrn: primary.mrn,
            duplicates: duplicates.map((d) => ({
              id: d.id,
              mrn: d.mrn,
              firstNameAr: d.firstNameAr,
              secondNameAr: d.secondNameAr,
              lastNameAr: d.lastNameAr,
              nationalId: d.nationalId,
              phone: d.phone,
            })),
            movedRecords: counts,
            appliedById: user.id,
            appliedAt: new Date().toISOString(),
          },
        },
      });
    });

    recordAudit({
      actorId: user.id,
      action: "amend",
      entity: "Patient",
      entityId: primary.id,
      clinicId,
      metadata: {
        mergeRequestId: request.id,
        primaryMrn: primary.mrn,
        mergedIds: duplicateIds,
        mergedMrns: duplicates.map((d) => d.mrn),
        movedRecords: counts,
      },
    });
    for (const duplicate of duplicates) {
      recordAudit({
        actorId: user.id,
        action: "amend",
        entity: "Patient",
        entityId: duplicate.id,
        clinicId,
        metadata: {
          mergeRequestId: request.id,
          mergedIntoId: primary.id,
          primaryMrn: primary.mrn,
        },
      });
    }

    revalidatePath("/patients/merges");
    revalidatePath("/patients");
    revalidatePath(`/patients/${primary.id}`);
    return { ok: true, id: request.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false, error: "invalid-selection" };
    }
    throw err;
  }
}

/** Lightweight audit breadcrumb for read access on clinical records. */
export async function auditPatientAccess(patientId: string, action: "read") {
  const h = await headers();
  const user = await requirePermission("patients:read");
  const clinicId = user.currentClinicId ?? null;
  recordAudit({
    actorId: user.id,
    action,
    entity: "Patient",
    entityId: patientId,
    clinicId,
    metadata: { path: h.get("x-invoke-path") ?? null },
  });
}