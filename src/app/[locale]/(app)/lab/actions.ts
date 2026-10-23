"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { labResultsSchema, labTestSchema } from "./schema";

type Result = { ok: true; id: string } | { ok: false; error: string };

export async function addLabTest(values: unknown): Promise<Result> {
  const user = await requirePermission("laboratory:verify");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = labTestSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const test = await prisma.labTest.upsert({
    where: { clinicId_code: { clinicId, code: v.code } },
    create: {
      clinicId,
      code: v.code,
      nameAr: v.nameAr,
      nameEn: v.nameEn,
      category: v.category || null,
      unit: v.unit || null,
      referenceRange: v.referenceRange || null,
      price: v.price,
    },
    update: {
      nameAr: v.nameAr,
      nameEn: v.nameEn,
      category: v.category || null,
      unit: v.unit || null,
      referenceRange: v.referenceRange || null,
      price: v.price,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "LabTest",
    entityId: test.id,
    clinicId,
    metadata: { code: v.code },
  });
  revalidatePath("/lab/tests");
  return { ok: true, id: test.id };
}

export async function enterResults(requestId: string, values: unknown): Promise<Result> {
  const user = await requirePermission("laboratory:result");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = labResultsSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const request = await prisma.labRequest.findFirst({
    where: { id: requestId, clinicId },
    select: { id: true, status: true },
  });
  if (!request) return { ok: false, error: "not-found" };
  if (request.status === "VERIFIED" || request.status === "CANCELLED") return { ok: false, error: "conflict" };

  const testIds = v.results.map((r) => r.resultId);
  const tests = await prisma.labResult.findMany({
    where: { requestId, id: { in: testIds } },
    select: { id: true, status: true },
  });
  if (tests.length !== testIds.length) return { ok: false, error: "not-found" };

  await prisma.$transaction(
    v.results.map((r) =>
      prisma.labResult.update({
        where: { id: r.resultId },
        data: {
          resultValue: r.value || null,
          isAbnormal: r.isAbnormal ?? null,
          status: "RESULTED",
          enteredBy: user.id,
        },
      }),
    ),
  );

  const pending = await prisma.labResult.count({
    where: { requestId, status: { not: "RESULTED" } },
  });
  if (pending === 0) {
    await prisma.labRequest.update({
      where: { id: requestId },
      data: { status: "RESULTED" },
    });
  }

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "LabRequest",
    entityId: requestId,
    clinicId,
    metadata: { results: testIds },
  });
  revalidatePath("/lab");
  revalidatePath(`/lab/requests/${requestId}`);
  return { ok: true, id: requestId };
}

export async function verifyResults(requestId: string): Promise<Result> {
  const user = await requirePermission("laboratory:verify");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const request = await prisma.labRequest.findFirst({
    where: { id: requestId, clinicId },
    select: { id: true, status: true, orderId: true },
  });
  if (!request) return { ok: false, error: "not-found" };
  if (request.status !== "RESULTED") return { ok: false, error: "conflict" };

  await prisma.$transaction([
    prisma.labResult.updateMany({
      where: { requestId, status: "RESULTED" },
      data: { status: "VERIFIED", verifiedBy: user.id, verifiedAt: new Date() },
    }),
    prisma.labRequest.update({
      where: { id: requestId },
      data: { status: "VERIFIED" },
    }),
    ...(request.orderId
      ? [
          prisma.medicalOrder.update({
            where: { id: request.orderId },
            data: { status: "COMPLETED" },
          }),
        ]
      : []),
  ]);

  recordAudit({
    actorId: user.id,
    action: "verify",
    entity: "LabRequest",
    entityId: requestId,
    clinicId,
  });
  revalidatePath("/lab");
  revalidatePath(`/lab/requests/${requestId}`);
  revalidatePath("/encounters");
  return { ok: true, id: requestId };
}

export async function cancelRequest(requestId: string): Promise<Result> {
  const user = await requirePermission("laboratory:verify");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const request = await prisma.labRequest.findFirst({
    where: { id: requestId, clinicId },
    select: { id: true, status: true, orderId: true },
  });
  if (!request) return { ok: false, error: "not-found" };
  if (request.status === "VERIFIED" || request.status === "CANCELLED") return { ok: false, error: "conflict" };

  await prisma.$transaction([
    prisma.labRequest.update({ where: { id: requestId }, data: { status: "CANCELLED" } }),
    ...(request.orderId
      ? [
          prisma.medicalOrder.update({
            where: { id: request.orderId },
            data: { status: "CANCELLED" },
          }),
        ]
      : []),
  ]);

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "LabRequest",
    entityId: requestId,
    clinicId,
    metadata: { status: "CANCELLED" },
  });
  revalidatePath("/lab");
  revalidatePath(`/lab/requests/${requestId}`);
  return { ok: true, id: requestId };
}