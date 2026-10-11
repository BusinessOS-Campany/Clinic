import { z } from "zod";

export const inventoryItemSchema = z.object({
  code: z.string().trim().min(1).max(40),
  nameAr: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  category: z.string().trim().optional(),
  unit: z.string().trim().min(1).max(20),
  quantity: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).max(10_000_000)),
  reorderLevel: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).max(10_000_000)),
  price: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).max(100_000_000)),
  expiryDate: z.string().optional(),
  supplier: z.string().trim().optional(),
});

export const inventoryMovementSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(["PURCHASE", "DISPENSE", "ADJUST", "RETURN", "DAMAGE"]),
  quantity: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(1).max(10_000_000)),
  unitCost: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().min(0).max(100_000_000).optional()),
  reference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});