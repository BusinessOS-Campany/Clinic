"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { inventoryItemSchema, inventoryMovementSchema } from "./schema";

type Result = { ok: true; id: string } | { ok: false; error: "no-clinic" | "not-found" | "invalid" | "conflict" };

export async function createItem(values: unknown): Promise<Result> {
  const user = await requirePermission("inventory:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = inventoryItemSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const existing = await prisma.inventoryItem.findUnique({
    where: { clinicId_code: { clinicId, code: v.code } },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "conflict" };

  const qty = Math.round(v.quantity);

  const item = await prisma.inventoryItem.create({
    data: {
      clinicId,
      code: v.code,
      nameAr: v.nameAr,
      nameEn: v.nameEn,
      category: v.category || null,
      unit: v.unit,
      currentQty: qty,
      reorderLevel: Math.round(v.reorderLevel),
      price: v.price,
      expiryDate: v.expiryDate ? new Date(v.expiryDate) : null,
      supplier: v.supplier || null,
      movements: qty > 0
        ? {
            create: {
              clinicId,
              type: "PURCHASE",
              quantity: qty,
              unitCost: v.price,
              reference: "Initial stock",
              movedBy: user.id,
            },
          }
        : undefined,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "InventoryItem",
    entityId: item.id,
    clinicId,
    metadata: { code: v.code, qty },
  });
  revalidatePath("/inventory");
  return { ok: true, id: item.id };
}

export async function addMovement(values: unknown): Promise<Result> {
  const user = await requirePermission("inventory:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = inventoryMovementSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const item = await prisma.inventoryItem.findFirst({
    where: { id: v.itemId, clinicId },
    select: { id: true, currentQty: true },
  });
  if (!item) return { ok: false, error: "not-found" };

  const qty = Math.round(v.quantity);
  const delta =
    v.type === "PURCHASE" || v.type === "RETURN"
      ? qty
      : v.type === "ADJUST"
        ? qty
        : -qty;
  const newQty = item.currentQty + delta;
  if (newQty < 0) return { ok: false, error: "conflict" };

  await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { id: item.id },
      data: { currentQty: newQty },
    }),
    prisma.inventoryMovement.create({
      data: {
        clinicId,
        itemId: item.id,
        type: v.type,
        quantity: delta,
        unitCost: v.unitCost ?? null,
        reference: v.reference || null,
        notes: v.notes || null,
        movedBy: user.id,
      },
    }),
  ]);

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "InventoryMovement",
    entityId: item.id,
    clinicId,
    metadata: { itemId: item.id, type: v.type, delta },
  });
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${item.id}`);
  return { ok: true, id: item.id };
}

export async function removeItem(id: string): Promise<Result> {
  const user = await requirePermission("inventory:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const item = await prisma.inventoryItem.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });
  if (!item) return { ok: false, error: "not-found" };

  await prisma.inventoryItem.update({
    where: { id },
    data: { isActive: false },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "InventoryItem",
    entityId: id,
    clinicId,
    metadata: { isActive: false },
  });
  revalidatePath("/inventory");
  return { ok: true, id };
}