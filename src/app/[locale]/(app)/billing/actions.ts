"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { round2, toNumber } from "@/lib/format";
import { nextNumber } from "@/lib/sequence";
import { invoiceFormSchema, invoiceItemSchema, paymentSchema } from "./schema";

type Result =
  | { ok: true; id: string; already?: boolean }
  | { ok: false; error: "no-clinic" | "not-found" | "invalid" | "not-allowed" | "conflict" | "empty" };

async function recompute(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, discount: true, taxRate: true, status: true },
  });
  if (!invoice) return;

  const items = await prisma.invoiceItem.aggregate({
    where: { invoiceId },
    _sum: { total: true },
  });
  const subtotal = round2(toNumber(items._sum.total) );
  const discount = round2(toNumber(invoice.discount));
  const taxRate = round2(toNumber(invoice.taxRate));
  const taxable = round2(subtotal - discount);
  const total = round2(taxable * (1 + taxRate / 100));
  const paid = await prisma.payment.aggregate({
    where: { invoiceId },
    _sum: { amount: true },
  });
  const paidAmount = round2(toNumber(paid._sum.amount) );

  let status = invoice.status as string;
  if (status !== "VOID") {
    status = paidAmount >= total && total > 0 ? "PAID" : total > 0 ? "OPEN" : "DRAFT";
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, total, paidAmount, status: status as never },
  });
}

export async function createInvoice(values: unknown): Promise<Result> {
  const user = await requirePermission("billing:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = invoiceFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const patient = await prisma.patient.findFirst({
    where: { id: v.patientId, clinicId },
    select: { id: true },
  });
  if (!patient) return { ok: false, error: "not-found" };

  const subtotal = round2(
    v.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
  );
  const discount = round2(v.discount);
  const taxRate = round2(v.taxRate);
  const total = round2((subtotal - discount) * (1 + taxRate / 100));

  const invoiceNo = await nextNumber(clinicId, "INVOICE");

  const invoice = await prisma.invoice.create({
    data: {
      clinicId,
      patientId: v.patientId,
      invoiceNo,
      status: total > 0 ? "OPEN" : "DRAFT",
      subtotal,
      discount,
      taxRate,
      total,
      notes: v.notes || null,
      issuedBy: user.id,
      items: {
        create: v.items.map((it) => ({
          kind: it.kind,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: round2(it.quantity * it.unitPrice),
        })),
      },
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Invoice",
    entityId: invoice.id,
    clinicId,
    metadata: { invoiceNo, total },
  });
  revalidatePath("/billing");
  return { ok: true, id: invoice.id };
}

export async function addInvoiceItem(invoiceId: string, values: unknown): Promise<Result> {
  const user = await requirePermission("billing:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = invoiceItemSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, clinicId },
    select: { id: true, status: true },
  });
  if (!invoice) return { ok: false, error: "not-found" };
  if (invoice.status === "VOID") return { ok: false, error: "conflict" };

  const item = await prisma.invoiceItem.create({
    data: {
      invoiceId,
      kind: v.kind,
      description: v.description,
      quantity: v.quantity,
      unitPrice: v.unitPrice,
      total: round2(v.quantity * v.unitPrice),
    },
    select: { id: true },
  });

  await recompute(invoiceId);

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "InvoiceItem",
    entityId: item.id,
    clinicId,
    metadata: { invoiceId },
  });
  revalidatePath(`/billing/${invoiceId}`);
  return { ok: true, id: item.id };
}

export async function removeInvoiceItem(id: string): Promise<Result> {
  const user = await requirePermission("billing:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const item = await prisma.invoiceItem.findFirst({
    where: { id, invoice: { clinicId } },
    select: { id: true, invoiceId: true },
  });
  if (!item) return { ok: false, error: "not-found" };

  await prisma.invoiceItem.delete({ where: { id: item.id } });
  await recompute(item.invoiceId);

  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "InvoiceItem",
    entityId: id,
    clinicId,
    metadata: { invoiceId: item.invoiceId },
  });
  revalidatePath(`/billing/${item.invoiceId}`);
  return { ok: true, id };
}

export async function applyPayment(invoiceId: string, values: unknown): Promise<Result> {
  const user = await requirePermission("billing:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = paymentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, clinicId },
    select: { id: true, status: true, total: true, paidAmount: true },
  });
  if (!invoice) return { ok: false, error: "not-found" };
  if (invoice.status === "VOID") return { ok: false, error: "conflict" };

  const newPaid = round2(toNumber(invoice.paidAmount) + v.amount);
  if (newPaid > round2(toNumber(invoice.total))) return { ok: false, error: "conflict" };

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      method: v.method,
      amount: v.amount,
      reference: v.reference || null,
      receivedBy: user.id,
    },
    select: { id: true },
  });
  await recompute(invoiceId);

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Payment",
    entityId: payment.id,
    clinicId,
    metadata: { invoiceId, amount: v.amount, method: v.method },
  });
  revalidatePath(`/billing/${invoiceId}`);
  return { ok: true, id: payment.id };
}

export async function voidInvoice(id: string): Promise<Result> {
  const user = await requirePermission("billing:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const invoice = await prisma.invoice.findFirst({
    where: { id, clinicId },
    select: { id: true, status: true },
  });
  if (!invoice) return { ok: false, error: "not-found" };

  await prisma.invoice.update({
    where: { id },
    data: { status: "VOID" },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "Invoice",
    entityId: id,
    clinicId,
    metadata: { status: "VOID" },
  });
  revalidatePath("/billing");
  revalidatePath(`/billing/${id}`);
  return { ok: true, id };
}

/** Remove a recorded payment (refund) and recompute the invoice. */
export async function refundPayment(id: string): Promise<Result> {
  const user = await requirePermission("billing:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const payment = await prisma.payment.findFirst({
    where: { id, invoice: { clinicId } },
    select: { id: true, invoiceId: true, amount: true, method: true },
  });
  if (!payment) return { ok: false, error: "not-found" };

  const invoice = await prisma.invoice.findUnique({
    where: { id: payment.invoiceId },
    select: { status: true },
  });
  if (!invoice) return { ok: false, error: "not-found" };
  if (invoice.status === "VOID") return { ok: false, error: "conflict" };

  await prisma.payment.delete({ where: { id: payment.id } });
  await recompute(payment.invoiceId);

  recordAudit({
    actorId: user.id,
    action: "delete",
    entity: "Payment",
    entityId: payment.id,
    clinicId,
    metadata: { invoiceId: payment.invoiceId, refundedAmount: Number(payment.amount), method: payment.method },
  });
  revalidatePath(`/billing/${payment.invoiceId}`);
  return { ok: true, id: payment.id };
}

/**
 * Auto-generate an invoice for an encounter from its service fee
 * (patient.consultation price) plus ordered lab tests (from the catalog).
 * Idempotent: returns the existing invoice if one already exists.
 */
export async function createEncounterInvoice(
  encounterId: string,
  locale: string,
): Promise<Result> {
  const user = await requirePermission("billing:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const existing = await prisma.invoice.findFirst({
    where: { encounterId, clinicId },
    select: { id: true },
  });
  if (existing) return { ok: true, id: existing.id, already: true };

  const encounter = await prisma.encounter.findFirst({
    where: { id: encounterId, clinicId },
    select: {
      patientId: true,
      patient: { select: { price: true } },
      orders: {
        where: { kind: "LABORATORY", status: { not: "CANCELLED" } },
        select: {
          name: true,
          labRequest: { select: { tests: { select: { test: { select: { id: true, nameAr: true, nameEn: true, price: true } } } } } },
        },
      },
    },
  });
  if (!encounter) return { ok: false, error: "not-found" };

  const items: {
    kind: "SERVICE" | "LABORATORY";
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[] = [];

  const consultationPrice = toNumber(encounter.patient.price);
  if (consultationPrice > 0) {
    items.push({
      kind: "SERVICE",
      description: locale === "ar" ? "استشارة" : "Consultation",
      quantity: 1,
      unitPrice: consultationPrice,
      total: consultationPrice,
    });
  }

  for (const order of encounter.orders) {
    const seen = new Set<string>();
    for (const result of order.labRequest?.tests ?? []) {
      const test = result.test;
      if (!test) continue;
      const price = toNumber(test.price);
      if (price <= 0 || seen.has(test.id)) continue;
      seen.add(test.id);
      items.push({
        kind: "LABORATORY",
        description: locale === "ar" ? test.nameAr || test.nameEn : test.nameEn || test.nameAr,
        quantity: 1,
        unitPrice: price,
        total: price,
      });
    }
  }

  if (items.length === 0) return { ok: false, error: "empty" };

  const subtotal = round2(items.reduce((s, it) => s + it.total, 0));
  const total = subtotal;
  const invoiceNo = await nextNumber(clinicId, "INVOICE");

  const invoice = await prisma.invoice.create({
    data: {
      clinicId,
      patientId: encounter.patientId,
      encounterId,
      invoiceNo,
      status: "OPEN",
      subtotal,
      total,
      notes: locale === "ar" ? `فاتورة الجلسة ${encounterId}` : `Encounter ${encounterId}`,
      issuedBy: user.id,
      items: { create: items },
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "Invoice",
    entityId: invoice.id,
    clinicId,
    metadata: { encounterId, invoiceNo, total, items: items.length },
  });
  revalidatePath(`/encounters/${encounterId}`);
  revalidatePath(`/billing/${invoice.id}`);
  revalidatePath("/billing");
  return { ok: true, id: invoice.id };
}