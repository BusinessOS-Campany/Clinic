import { z } from "zod";

export const drugCatalogSchema = z.object({
  genericName: z.string().trim().min(1),
  genericNameAr: z.string().trim().optional(),
  brandNames: z.string().optional(),
  strength: z.string().trim().min(1),
  dosageForm: z.string().trim().min(1),
  route: z.string().trim().min(1),
  atcCode: z.string().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  productId: z.string().optional(),
  isControlled: z.boolean().optional(),
  schedule: z.string().optional(),
  maxDailyDose: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().positive().optional(),
  ),
  maxSingleDose: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().positive().optional(),
  ),
  minAge: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(0).optional(),
  ),
  maxAge: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(0).optional(),
  ),
  pregnancyCategory: z.string().optional(),
  renalAdjustment: z.boolean().optional(),
  hepaticAdjustment: z.boolean().optional(),
  contraindications: z.string().optional(),
  monitoringRequired: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const drugInteractionSchema = z.object({
  drugId1: z.string().min(1),
  drugId2: z.string().min(1),
  severity: z.enum(["MAJOR", "MODERATE", "MINOR"]),
  mechanism: z.string().optional(),
  management: z.string().optional(),
  evidenceLevel: z.string().optional(),
  onset: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type DrugCatalogValues = z.infer<typeof drugCatalogSchema>;
export type DrugInteractionValues = z.infer<typeof drugInteractionSchema>;

export const DOSAGE_FORMS = [
  "TABLET",
  "CAPSULE",
  "SYRUP",
  "SUSPENSION",
  "INJECTION",
  "CREAM",
  "OINTMENT",
  "GEL",
  "DROPS",
  "INHALER",
  "PATCH",
  "SUPPOSITORY",
  "LOZENGE",
  "SPRAY",
  "OTHER",
] as const;

export const ROUTES = [
  "ORAL",
  "IV",
  "IM",
  "SC",
  "TOPICAL",
  "INHALATION",
  "SUBLINGUAL",
  "RECTAL",
  "VAGINAL",
  "OPHTHALMIC",
  "OTIC",
  "NASAL",
  "TRANSDERMAL",
  "OTHER",
] as const;

export const PREGNANCY_CATEGORIES = ["A", "B", "C", "D", "X", "N"] as const;