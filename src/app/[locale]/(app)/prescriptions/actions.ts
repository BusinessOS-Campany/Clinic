"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";
import { nextNumber } from "@/lib/sequence";
import {
  checkMedicationSafety,
  requiresOverride,
  type MedicationRef,
  type SafetyAlert,
} from "./safety";
import {
  prescriptionSchema,
  type PrescriptionItemValues,
  type PrescriptionValues,
} from "./schema";

export type { SafetyAlert } from "./safety";

type Result =
  | { ok: true; id: string }
  | {
      ok: false;
      error:
        | "no-clinic"
        | "not-found"
        | "invalid"
        | "not-allowed"
        | "override-required"
        | "conflict";
      alerts?: SafetyAlert[];
    };

type CandidateInput = {
  patientId?: string;
  items: { medicationId: string; medicationName: string; genericName?: string | null }[];
};

async function loadSafetyContext(clinicId: string, patientId: string) {
  const [allergies, interactions, activePrescriptions] = await Promise.all([
    prisma.allergy.findMany({
      where: { clinicId, patientId },
      select: { allergen: true, severity: true },
    }),
    prisma.medicationInteraction.findMany({
      where: { clinicId },
      select: { drugA: true, drugB: true, severity: true, description: true },
    }),
    prisma.prescription.findMany({
      where: {
        clinicId,
        patientId,
        status: { in: ["SIGNED", "PARTIALLY_DISPENSED", "DISPENSED"] },
      },
      select: {
        items: {
          select: { medicationId: true, medicationName: true, genericName: true },
        },
      },
    }),
  ]);

  const activeMeds: MedicationRef[] = activePrescriptions.flatMap((p) =>
    p.items.map((it) => ({
      medicationId: it.medicationId,
      name: it.medicationName,
      genericName: it.genericName,
    })),
  );

  return { allergies, interactions, activeMeds };
}

export async function checkPrescriptionSafety(
  input: CandidateInput,
): Promise<{ alerts: SafetyAlert[]; requiresOverride: boolean }> {
  const user = await requirePermission("pharmacy:prescribe");
  const clinicId = user.currentClinicId;
  if (!clinicId || !input.patientId || input.items.length === 0) {
    return { alerts: [], requiresOverride: false };
  }
  const { allergies, interactions, activeMeds } = await loadSafetyContext(
    clinicId,
    input.patientId,
  );
  const candidates: MedicationRef[] = input.items.map((it) => ({
    medicationId: it.medicationId,
    name: it.medicationName,
    genericName: it.genericName,
  }));
  const alerts = checkMedicationSafety({
    candidates,
    allergies,
    activeMeds,
    interactions,
  });
  return { alerts, requiresOverride: requiresOverride(alerts) };
}

function generateVerificationCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  let code = "";
  for (let i = 0; i < 10; i++) code += alphabet[bytes[i]! % alphabet.length];
  return code;
}

export async function createPrescription(
  values: PrescriptionValues,
): Promise<Result> {
  const user = await requirePermission("pharmacy:prescribe");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = prescriptionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const patient = await prisma.patient.findFirst({
    where: { id: v.patientId, clinicId },
    select: { id: true },
  });
  if (!patient) return { ok: false, error: "not-found" };

  if (v.encounterId) {
    const enc = await prisma.encounter.findFirst({
      where: { id: v.encounterId, clinicId },
      select: { id: true },
    });
    if (!enc) return { ok: false, error: "not-found" };
  }

  const { allergies, interactions, activeMeds } = await loadSafetyContext(
    clinicId,
    v.patientId,
  );
  const candidates: MedicationRef[] = v.items.map((it) => ({
    medicationId: it.medicationId,
    name: it.medicationName,
    genericName: it.genericName,
  }));
  const alerts = checkMedicationSafety({
    candidates,
    allergies,
    activeMeds,
    interactions,
  });
  if (requiresOverride(alerts) && !v.overrideReason?.trim()) {
    return { ok: false, error: "override-required", alerts };
  }

  const signed = v.sign === true;
  const prescriptionNo = await nextNumber(clinicId, "PRESCRIPTION");

  let verificationCode = generateVerificationCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.prescription.findUnique({
      where: { verificationCode },
      select: { id: true },
    });
    if (!clash) break;
    verificationCode = generateVerificationCode();
  }

  const created = await prisma.prescription.create({
    data: {
      clinicId,
      patientId: v.patientId,
      encounterId: v.encounterId ?? null,
      prescriberId: user.id,
      prescriptionNo,
      verificationCode,
      status: signed ? "SIGNED" : "DRAFT",
      signedBy: signed ? user.id : null,
      signedAt: signed ? new Date() : null,
      followUpDate: v.followUpDate ? new Date(v.followUpDate) : null,
      instructions: v.instructions ?? null,
      notes: v.notes ?? null,
      overrideReason: v.overrideReason?.trim() || null,
      createdBy: user.id,
      updatedBy: user.id,
      items: {
        create: v.items.map((it: PrescriptionItemValues) => ({
          medicationId: it.medicationId,
          medicationName: it.medicationName,
          genericName: it.genericName ?? null,
          strength: it.strength ?? null,
          form: it.form ?? null,
          route: it.route ?? null,
          dosage: it.dosage,
          frequency: it.frequency,
          durationDays: it.durationDays ?? null,
          quantity: it.quantity,
          unit: it.unit ?? null,
          instructions: it.instructions ?? null,
          refillsAllowed: 0,
          refillsRemaining: 0,
        })),
      },
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Prescription",
    entityId: created.id,
    clinicId,
    metadata: { prescriptionNo, items: v.items.length, signed },
  });

  revalidatePath("/pharmacy/prescriptions");
  revalidatePath(`/prescriptions/${created.id}`);
  if (v.encounterId) revalidatePath(`/encounters/${v.encounterId}`);
  revalidatePath(`/patients/${v.patientId}/chart`);
  return { ok: true, id: created.id };
}

export async function signPrescription(id: string): Promise<Result> {
  const user = await requirePermission("pharmacy:prescribe");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const rx = await prisma.prescription.findFirst({
    where: { id, clinicId },
    select: { id: true, status: true, patientId: true, encounterId: true },
  });
  if (!rx) return { ok: false, error: "not-found" };
  if (rx.status !== "DRAFT") return { ok: false, error: "not-allowed" };

  await prisma.prescription.update({
    where: { id },
    data: {
      status: "SIGNED",
      signedBy: user.id,
      signedAt: new Date(),
      updatedBy: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "sign",
    entity: "Prescription",
    entityId: id,
    clinicId,
  });

  revalidatePath("/pharmacy/prescriptions");
  revalidatePath(`/prescriptions/${id}`);
  if (rx.encounterId) revalidatePath(`/encounters/${rx.encounterId}`);
  revalidatePath(`/patients/${rx.patientId}/chart`);
  return { ok: true, id };
}

export async function dispensePrescriptionItem(input: {
  prescriptionItemId: string;
  quantity: number;
  inventoryItemId?: string | null;
  notes?: string | null;
}): Promise<Result> {
  const user = await requirePermission("pharmacy:dispense");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const qty = toNumber(input.quantity);
  if (!Number.isFinite(qty) || qty <= 0) return { ok: false, error: "invalid" };

  const item = await prisma.prescriptionItem.findFirst({
    where: { id: input.prescriptionItemId, prescription: { clinicId } },
    include: {
      prescription: {
        select: { id: true, patientId: true, encounterId: true, status: true },
      },
    },
  });
  if (!item) return { ok: false, error: "not-found" };
  if (item.prescription.status !== "SIGNED" && item.prescription.status !== "PARTIALLY_DISPENSED") {
    return { ok: false, error: "not-allowed" };
  }

  const ordered = toNumber(item.quantity);
  const already = toNumber(item.dispensedQty);
  const remaining = ordered - already;
  if (qty > remaining) return { ok: false, error: "conflict" };

  const itemId = input.inventoryItemId ?? null;
  if (itemId) {
    const inv = await prisma.inventoryItem.findFirst({
      where: { id: itemId, clinicId },
      select: { id: true, currentQty: true },
    });
    if (!inv) return { ok: false, error: "not-found" };
    if (inv.currentQty < qty) return { ok: false, error: "conflict" };
    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: inv.id },
        data: { currentQty: inv.currentQty - Math.round(qty) },
      }),
      prisma.inventoryMovement.create({
        data: {
          clinicId,
          itemId: inv.id,
          type: "DISPENSE",
          quantity: -Math.round(qty),
          unitCost: null,
          reference: item.prescription.id,
          notes: `${item.medicationName} (${item.prescription.id})`,
          movedBy: user.id,
        },
      }),
    ]);
  }

  const dispensation = await prisma.dispensation.create({
    data: {
      clinicId,
      prescriptionId: item.prescription.id,
      prescriptionItemId: item.id,
      patientId: item.prescription.patientId,
      medicationName: item.medicationName,
      medicationCode: item.medicationId ?? null,
      quantityDispensed: qty,
      unit: item.unit ?? null,
      instructions: item.instructions ?? null,
      dispensedBy: user.id,
      notes: input.notes || null,
    },
    select: { id: true },
  });

  const updatedItem = await prisma.prescriptionItem.update({
    where: { id: item.id },
    data: { dispensedQty: already + qty },
    select: { dispensedQty: true },
  });

  const siblings = await prisma.prescriptionItem.findMany({
    where: { prescriptionId: item.prescription.id },
    select: { quantity: true, dispensedQty: true },
  });
  const fullyDispensed = siblings.every(
    (s) => toNumber(s.dispensedQty) >= toNumber(s.quantity),
  );
  await prisma.prescription.update({
    where: { id: item.prescription.id },
    data: {
      status: fullyDispensed ? "DISPENSED" : "PARTIALLY_DISPENSED",
      updatedBy: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Dispensation",
    entityId: dispensation.id,
    clinicId,
    metadata: {
      prescriptionId: item.prescription.id,
      prescriptionItemId: item.id,
      quantity: qty,
      inventoryItemId: itemId,
      dispensedTotal: Number(updatedItem.dispensedQty),
    },
  });

  revalidatePath("/pharmacy/prescriptions");
  revalidatePath(`/prescriptions/${item.prescription.id}`);
  if (item.prescription.encounterId) {
    revalidatePath(`/encounters/${item.prescription.encounterId}`);
  }
  revalidatePath(`/patients/${item.prescription.patientId}/chart`);
  return { ok: true, id: dispensation.id };
}

export async function cancelPrescription(
  id: string,
  reason: string,
): Promise<Result> {
  const user = await requirePermission("pharmacy:prescribe");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const rx = await prisma.prescription.findFirst({
    where: { id, clinicId },
    select: {
      id: true,
      status: true,
      patientId: true,
      encounterId: true,
      items: { select: { dispensedQty: true } },
    },
  });
  if (!rx) return { ok: false, error: "not-found" };
  if (rx.status === "DISPENSED" || rx.status === "COMPLETED") {
    return { ok: false, error: "not-allowed" };
  }
  if (rx.items.some((it) => Number(it.dispensedQty) > 0)) {
    return { ok: false, error: "not-allowed" };
  }

  await prisma.prescription.update({
    where: { id },
    data: {
      status: "CANCELLED",
      notes: reason.trim() || null,
      updatedBy: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    action: "cancel",
    entity: "Prescription",
    entityId: id,
    clinicId,
    metadata: { reason: reason.trim() },
  });

  revalidatePath("/pharmacy/prescriptions");
  revalidatePath(`/prescriptions/${id}`);
  if (rx.encounterId) revalidatePath(`/encounters/${rx.encounterId}`);
  revalidatePath(`/patients/${rx.patientId}/chart`);
  return { ok: true, id };
}
