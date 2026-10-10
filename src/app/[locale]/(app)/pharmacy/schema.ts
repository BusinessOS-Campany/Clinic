import { z } from "zod";

export const dispenseSchema = z.object({
  inventoryItemId: z.string().optional(),
  quantity: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().positive().max(1_000_000),
  ),
  notes: z.string().trim().optional(),
});

export type DispenseValues = z.infer<typeof dispenseSchema>;