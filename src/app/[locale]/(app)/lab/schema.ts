import { z } from "zod";

export const labTestSchema = z.object({
  code: z.string().trim().min(1).max(30),
  nameAr: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  category: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  referenceRange: z.string().trim().optional(),
  price: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).max(100_000_000)),
});

export const labResultValueSchema = z.object({
  resultId: z.string().min(1),
  value: z.string().trim().optional(),
  isAbnormal: z.boolean().optional(),
});

export const labResultsSchema = z.object({
  results: z.array(labResultValueSchema),
});