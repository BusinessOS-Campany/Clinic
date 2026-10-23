"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { dispenseSchema } from "./schema";

type Result = { ok: true; id: string } | { ok: false; error: "no-clinic" | "not-found" | "invalid" | "conflict" };

export async function dispenseOrder(orderId: string, values: unknown): Promise<Result> {
  const user = await requirePermission("pharmacy:dispense");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = dispenseSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;
  const qty = toNumber(v.quantity);

  const order = await prisma.medicalOrder.findFirst({
    where: { id: orderId, clinicId, kind: "MEDICATION" },
    select: { id: true, encounterId: true, patientId: true, name: true, quantity: true, unit: true, instructions: true, status: true },
  });
  if (!order) return { ok: false, error: "not-found" };
  if (order.status === "COMPLETED" || order.status === "CANCELLED") return { ok: false, error: "conflict" };

  let itemId: string | null = v.inventoryItemId ?? null;
  if (itemId) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, clinicId },
      select: { id: true, currentQty: true },
    });
    if (!item) return { ok: false, error: "not-found" };
    if (item.currentQty < qty) return { ok: false, error: "conflict" };
    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: item.id },
        data: { currentQty: item.currentQty - Math.round(qty) },
      }),
      prisma.inventoryMovement.create({
        data: {
          clinicId,
          itemId: item.id,
          type: "DISPENSE",
          quantity: -Math.round(qty),
          unitCost: null,
          reference: orderId,
          notes: `${order.name} (${orderId})`,
          movedBy: user.id,
        },
      }),
    ]);
  }

  const dispensation = await prisma.dispensation.create({
    data: {
      clinicId,
      orderId: order.id,
      patientId: order.patientId,
      medicationName: order.name,
      medicationCode: order.quantity ?? null,
      quantityDispensed: qty,
      unit: order.unit ?? null,
      instructions: order.instructions ?? null,
      dispensedBy: user.id,
      notes: v.notes || null,
    },
    select: { id: true },
  });

  await prisma.medicalOrder.update({
    where: { id: order.id },
    data: { status: "COMPLETED", dispensedAt: new Date() },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Dispensation",
    entityId: dispensation.id,
    clinicId,
    metadata: { orderId: order.id, quantity: qty, inventoryItemId: itemId },
  });
  revalidatePath("/pharmacy");
  revalidatePath(`/encounters/${order.encounterId}`);
  return { ok: true, id: dispensation.id };
}