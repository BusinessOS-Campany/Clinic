import { z } from "zod";

const num = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(min).max(max),
  );

export const invoiceFormSchema = z.object({
  patientId: z.string().min(1),
  notes: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        kind: z.enum(["SERVICE", "MEDICATION", "LABORATORY", "IMAGING", "OTHER"]),
        description: z.string().trim().min(1),
        quantity: num(0.01, 1_000_000),
        unitPrice: num(0, 10_000_000),
      }),
    )
    .min(1),
  discount: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).max(1_000_000)),
  taxRate: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).max(100)),
});

export const invoiceItemSchema = z.object({
  kind: z.enum(["SERVICE", "MEDICATION", "LABORATORY", "IMAGING", "OTHER"]),
  description: z.string().trim().min(1),
  quantity: num(0.01, 1_000_000),
  unitPrice: num(0, 10_000_000),
});

export const paymentSchema = z.object({
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MOBILE_MONEY", "INSURANCE", "OTHER"]),
  amount: num(0.01, 100_000_000),
  reference: z.string().trim().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceItemValues = z.infer<typeof invoiceItemSchema>;
export type PaymentValues = z.infer<typeof paymentSchema>;

export const BILLING_KINDS = [
  "SERVICE",
  "MEDICATION",
  "LABORATORY",
  "IMAGING",
  "OTHER",
] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "MOBILE_MONEY",
  "INSURANCE",
  "OTHER",
] as const;