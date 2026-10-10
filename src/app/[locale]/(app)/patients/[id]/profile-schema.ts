import { z } from "zod";

export const MEDICAL_HISTORY_CATEGORIES = [
  "PREVIOUS_ILLNESS",
  "CHRONIC_DISEASE",
  "PREVIOUS_SURGERY",
  "PREVIOUS_HOSPITALIZATION",
  "FAMILY_HISTORY",
  "CURRENT_MEDICATION",
  "PREVIOUS_MEDICATION",
  "DRUG_ALLERGY",
  "FOOD_ALLERGY",
  "ENVIRONMENTAL_ALLERGY",
  "ADVERSE_DRUG_REACTION",
  "IMMUNIZATION",
  "SMOKING",
  "ALCOHOL_SUBSTANCE",
  "PREGNANCY_OBSTETRIC",
  "DIETARY",
  "OCCUPATIONAL_LIFESTYLE",
  "PREVIOUS_DIAGNOSIS",
  "PREVIOUS_TREATMENT",
] as const;

export const HISTORY_VERIFICATIONS = [
  "PATIENT_REPORTED",
  "CLINICIAN_CONFIRMED",
  "UNVERIFIED",
] as const;

export const HISTORY_SOURCES = [
  "PATIENT",
  "CAREGIVER",
  "CLINICIAN",
  "DOCUMENT",
  "OTHER",
] as const;

export const HISTORY_STATUSES = ["ACTIVE", "RESOLVED", "UNKNOWN"] as const;

export const medicalHistorySchema = z.object({
  category: z.enum(MEDICAL_HISTORY_CATEGORIES),
  condition: z.string().trim().min(1, "required"),
  detail: z.string().trim().optional(),
  medication: z.string().trim().optional(),
  diagnosis: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  startedOn: z.string().optional(),
  resolvedOn: z.string().optional(),
  status: z.enum(HISTORY_STATUSES),
  verification: z.enum(HISTORY_VERIFICATIONS),
  source: z.enum(HISTORY_SOURCES),
  sourceName: z.string().trim().optional(),
  isAlert: z.boolean().optional(),
  alertNote: z.string().trim().optional(),
  changeNote: z.string().trim().optional(),
});
export type MedicalHistoryFormValues = z.infer<typeof medicalHistorySchema>;

export const DIAGNOSIS_TYPES = ["PRIMARY", "SECONDARY", "DIFFERENTIAL"] as const;

export const DIAGNOSIS_STATUSES = [
  "SUSPECTED",
  "PROVISIONAL",
  "CONFIRMED",
  "RULED_OUT",
  "RESOLVED",
  "CHRONIC",
] as const;

export const CODE_SYSTEMS = [
  "NONE",
  "ICD10",
  "ICD11",
  "SNOMED_CT",
  "LOCAL",
] as const;

export const diagnosisSchema = z.object({
  catalogId: z.string().trim().optional(),
  name: z.string().trim().min(1, "required"),
  code: z.string().trim().optional(),
  codeSystem: z.enum(CODE_SYSTEMS),
  description: z.string().trim().optional(),
  type: z.enum(DIAGNOSIS_TYPES),
  status: z.enum(DIAGNOSIS_STATUSES),
  symptoms: z.string().trim().optional(),
  clinicalFindings: z.string().trim().optional(),
  supportiveResults: z.string().trim().optional(),
  diagnosedOn: z.string().optional(),
  diagnosedBy: z.string().trim().optional(),
  treatmentPlan: z.string().trim().optional(),
  followUp: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isChronic: z.boolean().optional(),
  encounterId: z.string().trim().optional(),
  changeNote: z.string().trim().optional(),
});
export type DiagnosisFormValues = z.infer<typeof diagnosisSchema>;

export const catalogEntrySchema = z.object({
  code: z.string().trim().min(1, "required"),
  codeSystem: z.enum(CODE_SYSTEMS),
  nameEn: z.string().trim().min(1, "required"),
  nameAr: z.string().trim().optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});
export type CatalogEntryFormValues = z.infer<typeof catalogEntrySchema>;

export const allergySchema = z.object({
  allergen: z.string().trim().min(1, "required"),
  reaction: z.string().trim().optional(),
  severity: z.enum(["MILD", "MODERATE", "SEVERE"]),
  notes: z.string().trim().optional(),
});
export type AllergyFormValues = z.infer<typeof allergySchema>;

const optionalNumber = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || !Number.isNaN(Number(v)), "invalid");

export const vitalSignSchema = z.object({
  measuredAt: z.string().optional(),
  temperature: optionalNumber,
  pulse: optionalNumber,
  respRate: optionalNumber,
  bpSystolic: optionalNumber,
  bpDiastolic: optionalNumber,
  spO2: optionalNumber,
  height: optionalNumber,
  weight: optionalNumber,
  bmi: optionalNumber,
  notes: z.string().trim().optional(),
});
export type VitalSignFormValues = z.infer<typeof vitalSignSchema>;

export const DOCUMENT_CATEGORIES = [
  "LAB",
  "IMAGING",
  "CONSENT",
  "REFERRAL",
  "INSURANCE",
  "ID",
  "OTHER",
] as const;

export const documentSchema = z.object({
  title: z.string().trim().min(1, "required"),
  category: z.enum(DOCUMENT_CATEGORIES),
  fileName: z.string().trim().optional(),
  url: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type DocumentFormValues = z.infer<typeof documentSchema>;

export const REFERRAL_STATUSES = ["PENDING", "SENT", "COMPLETED", "CANCELLED"] as const;

export const referralSchema = z.object({
  referredTo: z.string().trim().min(1, "required"),
  reason: z.string().trim().optional(),
  status: z.enum(REFERRAL_STATUSES),
  notes: z.string().trim().optional(),
});
export type ReferralFormValues = z.infer<typeof referralSchema>;

export const CONSENT_STATUSES = ["PENDING", "SIGNED", "CANCELLED"] as const;

export const consentFormSchema = z.object({
  title: z.string().trim().min(1, "required"),
  category: z.string().trim().optional(),
  status: z.enum(CONSENT_STATUSES),
  signedBy: z.string().trim().optional(),
  content: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type ConsentFormValues = z.infer<typeof consentFormSchema>;
