"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { imagingReportSchema } from "./schema";

type Result = { ok: true; id: string } | { ok: false; error: "no-clinic" | "not-found" | "invalid" | "conflict" };

async function findScoped(id: string, clinicId: string) {
  return prisma.imagingRequest.findFirst({
    where: { id, clinicId },
    select: { id: true, status: true, orderId: true, patientId: true },
  });
}

export async function markPerformed(id: string): Promise<Result> {
  const user = await requirePermission("imaging:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const request = await findScoped(id, clinicId);
  if (!request) return { ok: false, error: "not-found" };
  if (request.status !== "PENDING") return { ok: false, error: "conflict" };

  await prisma.imagingRequest.update({
    where: { id },
    data: { status: "PERFORMED" },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "ImagingRequest",
    entityId: id,
    clinicId,
    metadata: { status: "PERFORMED" },
  });
  revalidatePath("/imaging");
  revalidatePath(`/imaging/${id}`);
  return { ok: true, id };
}

export async function submitReport(id: string, values: unknown): Promise<Result> {
  const user = await requirePermission("imaging:report");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = imagingReportSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const request = await findScoped(id, clinicId);
  if (!request) return { ok: false, error: "not-found" };
  if (request.status !== "PERFORMED") return { ok: false, error: "conflict" };

  await prisma.$transaction([
    prisma.imagingRequest.update({
      where: { id },
      data: {
        status: "REPORTED",
        findings: parsed.data.findings,
        reportedBy: user.id,
        reportedAt: new Date(),
      },
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
    action: "report",
    entity: "ImagingRequest",
    entityId: id,
    clinicId,
    metadata: { status: "REPORTED" },
  });
  revalidatePath("/imaging");
  revalidatePath(`/imaging/${id}`);
  revalidatePath("/encounters");
  return { ok: true, id };
}

export async function cancelRequest(id: string): Promise<Result> {
  const user = await requirePermission("imaging:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const request = await findScoped(id, clinicId);
  if (!request) return { ok: false, error: "not-found" };
  if (request.status === "REPORTED" || request.status === "CANCELLED") return { ok: false, error: "conflict" };

  await prisma.$transaction([
    prisma.imagingRequest.update({ where: { id }, data: { status: "CANCELLED" } }),
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
    entity: "ImagingRequest",
    entityId: id,
    clinicId,
    metadata: { status: "CANCELLED" },
  });
  revalidatePath("/imaging");
  revalidatePath(`/imaging/${id}`);
  return { ok: true, id };
}