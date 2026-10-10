import { z } from "zod";

export const MEDICATION_FORMS = [
  "TABLET",
  "CAPSULE",
  "SYRUP",
  "SUSPENSION",
  "DROPS",
  "TOPICAL",
  "INJECTION",
  "INHALER",
  "SUPPOSITORY",
  "OTHER",
] as const;

export const MEDICATION_ROUTES = [
  "ORAL",
  "SUBLINGUAL",
  "TOPICAL",
  "INHALATION",
  "INTRAVENOUS",
  "INTRAMUSCULAR",
  "SUBCUTANEOUS",
  "RECTAL",
  "VAGINAL",
  "OPHTHALMIC",
  "OTIC",
  "NASAL",
  "OTHER",
] as const;

export const medicationSchema = z.object({
  code: z.string().trim().min(1).max(40),
  genericName: z.string().trim().min(1).max(160),
  brandName: z.string().trim().max(160).optional(),
  strength: z.string().trim().max(40).optional(),
  strengthUnit: z.string().trim().max(20).optional(),
  form: z.enum(MEDICATION_FORMS),
  route: z.enum(MEDICATION_ROUTES),
  atcCode: z.string().trim().max(20).optional(),
  category: z.string().trim().max(80).optional(),
  isControlled: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(500).optional(),
});

export type MedicationFormValues = z.infer<typeof medicationSchema>;
export type MedicationFormValue = (typeof MEDICATION_FORMS)[number];
export type MedicationRouteValue = (typeof MEDICATION_ROUTES)[number];
