"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import {
  amendResultSchema,
  collectSpecimenSchema,
  labCategorySchema,
  labEquipmentSchema,
  labMaintenanceSchema,
  labQcSchema,
  labResultsSchema,
  labTestSchema,
  rejectSpecimenSchema,
} from "./schema";
import { computeFlag, isAbnormalFlag, isCriticalFlag, pickRange, type RangeLike } from "./flag";

type Result = { ok: true; id: string } | { ok: false; error: string };

function ageYears(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const diff = Date.now() - birthDate.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

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
      categoryId: v.categoryId || null,
      unit: v.unit || null,
      referenceRange: v.referenceRange || null,
      method: v.method || null,
      specimenType: v.specimenType,
      collectionInstructions: v.collectionInstructions || null,
      turnaroundHours: v.turnaroundHours ?? null,
      price: v.price,
    },
    update: {
      nameAr: v.nameAr,
      nameEn: v.nameEn,
      category: v.category || null,
      categoryId: v.categoryId || null,
      unit: v.unit || null,
      referenceRange: v.referenceRange || null,
      method: v.method || null,
      specimenType: v.specimenType,
      collectionInstructions: v.collectionInstructions || null,
      turnaroundHours: v.turnaroundHours ?? null,
      price: v.price,
    },
    select: { id: true },
  });

  if (v.ranges) {
    await prisma.labReferenceRange.deleteMany({ where: { testId: test.id } });
    if (v.ranges.length > 0) {
      await prisma.labReferenceRange.createMany({
        data: v.ranges.map((r) => ({
          testId: test.id,
          sex: r.sex,
          ageMinYears: r.ageMinYears ?? null,
          ageMaxYears: r.ageMaxYears ?? null,
          low: r.low ?? null,
          high: r.high ?? null,
          criticalLow: r.criticalLow ?? null,
          criticalHigh: r.criticalHigh ?? null,
          unit: r.unit || null,
          method: r.method || null,
          text: r.text || null,
        })),
      });
    }
  }

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

export async function addLabCategory(values: unknown): Promise<Result> {
  const user = await requirePermission("laboratory:verify");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = labCategorySchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const cat = await prisma.labTestCategory.upsert({
    where: { clinicId_code: { clinicId, code: v.code } },
    create: { clinicId, code: v.code, nameAr: v.nameAr, nameEn: v.nameEn, sortOrder: v.sortOrder ?? 0 },
    update: { nameAr: v.nameAr, nameEn: v.nameEn, sortOrder: v.sortOrder ?? 0 },
    select: { id: true },
  });

  recordAudit({ actorId: user.id, action: "create", entity: "LabTestCategory", entityId: cat.id, clinicId });
  revalidatePath("/lab/tests");
  return { ok: true, id: cat.id };
}

async function loadRangesByTest(testIds: string[]): Promise<Map<string, RangeLike[]>> {
  const map = new Map<string, RangeLike[]>();
  if (testIds.length === 0) return map;
  const ranges = await prisma.labReferenceRange.findMany({ where: { testId: { in: testIds } } });
  for (const r of ranges) {
    const list = map.get(r.testId) ?? [];
    list.push({
      sex: r.sex,
      ageMinYears: r.ageMinYears,
      ageMaxYears: r.ageMaxYears,
      low: r.low === null ? null : Number(r.low),
      high: r.high === null ? null : Number(r.high),
      criticalLow: r.criticalLow === null ? null : Number(r.criticalLow),
      criticalHigh: r.criticalHigh === null ? null : Number(r.criticalHigh),
      text: r.text,
    });
    map.set(r.testId, list);
  }
  return map;
}

export async function collectSpecimen(requestId: string, values: unknown): Promise<Result> {
  const user = await requirePermission("laboratory:result");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = collectSpecimenSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const request = await prisma.labRequest.findFirst({
    where: { id: requestId, clinicId },
    select: { id: true, status: true },
  });
  if (!request) return { ok: false, error: "not-found" };
  if (request.status !== "PENDING" && request.status !== "REJECTED") {
    return { ok: false, error: "conflict" };
  }

  await prisma.labRequest.update({
    where: { id: requestId },
    data: {
      status: "SAMPLED",
      specimenType: v.specimenType,
      specimenId: v.specimenId || null,
      collectedAt: new Date(),
      collectedBy: v.collectedBy || user.name,
    },
  });

  recordAudit({ actorId: user.id, action: "update", entity: "LabRequest", entityId: requestId, clinicId, metadata: { status: "SAMPLED" } });
  revalidatePath("/lab");
  revalidatePath(`/lab/requests/${requestId}`);
  return { ok: true, id: requestId };
}

export async function startProcessing(requestId: string): Promise<Result> {
  const user = await requirePermission("laboratory:result");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const request = await prisma.labRequest.findFirst({
    where: { id: requestId, clinicId },
    select: { id: true, status: true },
  });
  if (!request) return { ok: false, error: "not-found" };
  if (request.status !== "SAMPLED") return { ok: false, error: "conflict" };

  await prisma.labRequest.update({
    where: { id: requestId },
    data: { status: "IN_PROGRESS", processedAt: new Date() },
  });

  recordAudit({ actorId: user.id, action: "update", entity: "LabRequest", entityId: requestId, clinicId, metadata: { status: "IN_PROGRESS" } });
  revalidatePath("/lab");
  revalidatePath(`/lab/requests/${requestId}`);
  return { ok: true, id: requestId };
}

export async function rejectSpecimen(requestId: string, values: unknown): Promise<Result> {
  const user = await requirePermission("laboratory:result");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = rejectSpecimenSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const request = await prisma.labRequest.findFirst({
    where: { id: requestId, clinicId },
    select: { id: true, status: true },
  });
  if (!request) return { ok: false, error: "not-found" };
  if (request.status === "VERIFIED" || request.status === "CANCELLED") return { ok: false, error: "conflict" };

  await prisma.labRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      rejectionReason: v.reason,
      notes: v.notes || null,
      rejectedAt: new Date(),
      rejectedBy: user.name,
    },
  });

  recordAudit({ actorId: user.id, action: "update", entity: "LabRequest", entityId: requestId, clinicId, metadata: { status: "REJECTED", reason: v.reason } });
  revalidatePath("/lab");
  revalidatePath(`/lab/requests/${requestId}`);
  return { ok: true, id: requestId };
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
    select: { id: true, status: true, patientId: true, tests: { select: { id: true, testId: true } } },
  });
  if (!request) return { ok: false, error: "not-found" };
  if (request.status === "VERIFIED" || request.status === "CANCELLED") return { ok: false, error: "conflict" };

  const patient = await prisma.patient.findUnique({
    where: { id: request.patientId },
    select: { gender: true, birthDate: true },
  });
  const age = ageYears(patient?.birthDate ?? null);
  const testIdByResult = new Map(request.tests.map((t) => [t.id, t.testId]));
  const rangesByTest = await loadRangesByTest(
    [...new Set(request.tests.map((t) => t.testId).filter((x): x is string => Boolean(x)))],
  );

  let hasCritical = false;

  await prisma.$transaction(
    v.results.map((r) => {
      const testId = testIdByResult.get(r.resultId);
      const ranges = testId ? rangesByTest.get(testId) ?? [] : [];
      const range = pickRange(ranges, patient?.gender ?? null, age);
      const autoFlag = r.valueNumeric != null ? computeFlag(r.valueNumeric, range) : null;
      const flag = r.flag ?? autoFlag;
      if (isCriticalFlag(flag)) hasCritical = true;
      const isAbnormal = flag ? isAbnormalFlag(flag) : r.isAbnormal ?? null;

      return prisma.labResult.update({
        where: { id: r.resultId },
        data: {
          resultValue: r.value ?? "",
          valueNumeric: r.valueNumeric ?? null,
          flag: flag ?? null,
          method: r.method || null,
          comments: r.comments || null,
          isAbnormal,
          status: "RESULTED",
          enteredBy: user.name,
        },
      });
    }),
  );

  const pending = await prisma.labResult.count({ where: { requestId, status: { not: "RESULTED" } } });
  if (pending === 0) {
    await prisma.labRequest.update({
      where: { id: requestId },
      data: { status: "RESULTED", criticalFlag: hasCritical },
    });
  } else if (hasCritical) {
    await prisma.labRequest.update({ where: { id: requestId }, data: { criticalFlag: true } });
  }

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "LabRequest",
    entityId: requestId,
    clinicId,
    metadata: { results: v.results.map((r) => r.resultId), critical: hasCritical },
  });
  revalidatePath("/lab");
  revalidatePath(`/lab/requests/${requestId}`);
  return { ok: true, id: requestId };
}

export async function notifyCritical(requestId: string, notes: string): Promise<Result> {
  const user = await requirePermission("laboratory:result");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const request = await prisma.labRequest.findFirst({
    where: { id: requestId, clinicId },
    select: { id: true, criticalFlag: true },
  });
  if (!request || !request.criticalFlag) return { ok: false, error: "not-found" };

  await prisma.labRequest.update({
    where: { id: requestId },
    data: { criticalNotedAt: new Date(), criticalNotedBy: user.name, notes: notes || undefined },
  });

  recordAudit({ actorId: user.id, action: "update", entity: "LabRequest", entityId: requestId, clinicId, metadata: { criticalNotified: true } });
  revalidatePath(`/lab/requests/${requestId}`);
  return { ok: true, id: requestId };
}

export async function amendResult(values: unknown): Promise<Result> {
  const user = await requirePermission("laboratory:verify");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = amendResultSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const result = await prisma.labResult.findFirst({
    where: { id: v.resultId, request: { clinicId } },
    select: { id: true, resultValue: true, flag: true, amendments: { select: { id: true } } },
  });
  if (!result) return { ok: false, error: "not-found" };

  await prisma.$transaction([
    prisma.labResultAmendment.create({
      data: {
        resultId: result.id,
        previousValue: result.resultValue,
        newValue: v.value,
        previousFlag: result.flag ?? null,
        newFlag: (v.flag ?? null) as never,
        reason: v.reason,
        amendedBy: user.name,
      },
    }),
    prisma.labResult.update({
      where: { id: result.id },
      data: {
        resultValue: v.value,
        flag: (v.flag ?? null) as never,
        isAbnormal: v.flag ? isAbnormalFlag(v.flag) : undefined,
        amendedBy: user.name,
        amendedAt: new Date(),
        amendmentCount: { increment: 1 },
      },
    }),
  ]);

  recordAudit({ actorId: user.id, action: "update", entity: "LabResult", entityId: result.id, clinicId, metadata: { amendment: true, reason: v.reason } });
  revalidatePath("/lab");
  const target = await prisma.labResult.findUnique({ where: { id: result.id }, select: { requestId: true } });
  if (target) revalidatePath(`/lab/requests/${target.requestId}`);
  return { ok: true, id: result.id };
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
      data: { status: "VERIFIED", verifiedBy: user.name, verifiedAt: new Date() },
    }),
    prisma.labRequest.update({
      where: { id: requestId },
      data: { status: "VERIFIED", releasedAt: new Date(), releasedBy: user.name },
    }),
    ...(request.orderId
      ? [prisma.medicalOrder.update({ where: { id: request.orderId }, data: { status: "COMPLETED" } })]
      : []),
  ]);

  recordAudit({ actorId: user.id, action: "verify", entity: "LabRequest", entityId: requestId, clinicId });
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
      ? [prisma.medicalOrder.update({ where: { id: request.orderId }, data: { status: "CANCELLED" } })]
      : []),
  ]);

  recordAudit({ actorId: user.id, action: "update", entity: "LabRequest", entityId: requestId, clinicId, metadata: { status: "CANCELLED" } });
  revalidatePath("/lab");
  revalidatePath(`/lab/requests/${requestId}`);
  return { ok: true, id: requestId };
}

export async function addQcRecord(values: unknown): Promise<Result> {
  const user = await requirePermission("laboratory:result");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = labQcSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const record = await prisma.labQcRecord.create({
    data: {
      clinicId,
      testId: v.testId || null,
      testName: v.testName,
      level: v.level || null,
      lotNumber: v.lotNumber || null,
      expected: v.expected || null,
      observed: v.observed || null,
      passed: v.passed,
      equipment: v.equipment || null,
      notes: v.notes || null,
      recordedBy: user.name,
    },
    select: { id: true },
  });

  recordAudit({ actorId: user.id, action: "create", entity: "LabQcRecord", entityId: record.id, clinicId });
  revalidatePath("/lab/qc");
  return { ok: true, id: record.id };
}

export async function addEquipment(values: unknown): Promise<Result> {
  const user = await requirePermission("laboratory:verify");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = labEquipmentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const eq = await prisma.labEquipment.create({
    data: {
      clinicId,
      name: v.name,
      serialNumber: v.serialNumber || null,
      manufacturer: v.manufacturer || null,
      model: v.model || null,
      location: v.location || null,
      nextServiceDue: v.nextServiceDue ? new Date(v.nextServiceDue) : null,
    },
    select: { id: true },
  });

  recordAudit({ actorId: user.id, action: "create", entity: "LabEquipment", entityId: eq.id, clinicId });
  revalidatePath("/lab/equipment");
  return { ok: true, id: eq.id };
}

export async function addMaintenance(values: unknown): Promise<Result> {
  const user = await requirePermission("laboratory:verify");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = labMaintenanceSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const eq = await prisma.labEquipment.findFirst({ where: { id: v.equipmentId, clinicId }, select: { id: true } });
  if (!eq) return { ok: false, error: "not-found" };

  const record = await prisma.labEquipmentMaintenance.create({
    data: {
      equipmentId: v.equipmentId,
      type: v.type || null,
      performedBy: v.performedBy || null,
      cost: v.cost ?? null,
      notes: v.notes || null,
    },
    select: { id: true },
  });

  await prisma.labEquipment.update({
    where: { id: v.equipmentId },
    data: { lastServiceAt: new Date() },
  });

  recordAudit({ actorId: user.id, action: "create", entity: "LabEquipmentMaintenance", entityId: record.id, clinicId });
  revalidatePath("/lab/equipment");
  return { ok: true, id: record.id };
}
