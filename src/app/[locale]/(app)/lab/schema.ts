import { z } from "zod";

export const LAB_SPECIMEN_TYPES = [
  "BLOOD",
  "SERUM",
  "PLASMA",
  "URINE",
  "STOOL",
  "SPUTUM",
  "SWAB",
  "CSF",
  "TISSUE",
  "OTHER",
] as const;

export const LAB_PRIORITIES = ["ROUTINE", "URGENT", "STAT"] as const;

export const LAB_RESULT_FLAGS = [
  "NORMAL",
  "LOW",
  "HIGH",
  "CRITICAL_LOW",
  "CRITICAL_HIGH",
  "ABNORMAL",
] as const;

export const LAB_REJECTION_REASONS = [
  "HEMOLYZED",
  "CLOTTED",
  "INSUFFICIENT_VOLUME",
  "WRONG_CONTAINER",
  "UNLABELED",
  "CONTAMINATED",
  "EXPIRED",
  "OTHER",
] as const;

export const LAB_RANGE_SEXES = ["ANY", "MALE", "FEMALE"] as const;

const optionalText = z.string().trim().max(2000).optional();
const optionalNumber = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().finite().optional(),
);

export const labReferenceRangeSchema = z.object({
  sex: z.enum(LAB_RANGE_SEXES).default("ANY"),
  ageMinYears: optionalNumber,
  ageMaxYears: optionalNumber,
  low: optionalNumber,
  high: optionalNumber,
  criticalLow: optionalNumber,
  criticalHigh: optionalNumber,
  unit: optionalText,
  method: optionalText,
  text: optionalText,
});

export const labTestSchema = z.object({
  code: z.string().trim().min(1).max(30),
  nameAr: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  category: optionalText,
  categoryId: z.string().trim().optional(),
  unit: optionalText,
  referenceRange: optionalText,
  method: optionalText,
  specimenType: z.enum(LAB_SPECIMEN_TYPES).default("BLOOD"),
  collectionInstructions: optionalText,
  turnaroundHours: optionalNumber,
  price: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).max(100_000_000)),
  ranges: z.array(labReferenceRangeSchema).max(20).optional(),
});

export const labCategorySchema = z.object({
  code: z.string().trim().min(1).max(30),
  nameAr: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  sortOrder: optionalNumber,
});

export const collectSpecimenSchema = z.object({
  specimenType: z.enum(LAB_SPECIMEN_TYPES),
  specimenId: z.string().trim().max(60).optional(),
  collectedBy: z.string().trim().max(120).optional(),
});

export const rejectSpecimenSchema = z.object({
  reason: z.enum(LAB_REJECTION_REASONS),
  notes: optionalText,
});

export const labResultValueSchema = z.object({
  resultId: z.string().min(1),
  value: z.string().trim().max(500).optional(),
  valueNumeric: optionalNumber,
  flag: z.enum(LAB_RESULT_FLAGS).optional(),
  method: optionalText,
  comments: optionalText,
  isAbnormal: z.boolean().optional(),
});

export const labResultsSchema = z.object({
  results: z.array(labResultValueSchema),
});

export const amendResultSchema = z.object({
  resultId: z.string().min(1),
  value: z.string().trim().min(1).max(500),
  flag: z.enum(LAB_RESULT_FLAGS).optional(),
  reason: z.string().trim().min(3).max(500),
});

export const labQcSchema = z.object({
  testId: z.string().trim().optional(),
  testName: z.string().trim().min(1).max(200),
  level: optionalText,
  lotNumber: optionalText,
  expected: optionalText,
  observed: optionalText,
  passed: z.coerce.boolean().default(true),
  equipment: optionalText,
  notes: optionalText,
});

export const labEquipmentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  serialNumber: optionalText,
  manufacturer: optionalText,
  model: optionalText,
  location: optionalText,
  nextServiceDue: optionalText,
});

export const labMaintenanceSchema = z.object({
  equipmentId: z.string().min(1),
  type: optionalText,
  performedBy: optionalText,
  cost: optionalNumber,
  notes: optionalText,
});
