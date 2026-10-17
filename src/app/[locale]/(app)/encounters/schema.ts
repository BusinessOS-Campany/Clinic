import { z } from "zod";

const num = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(min).max(max).optional(),
  );

export const encounterFormSchema = z.object({
  type: z.enum([
    "INITIAL",
    "FOLLOW_UP",
    "CONSULTATION",
    "VACCINATION",
    "PROCEDURE",
    "RE_EVALUATION",
  ]),
  chiefComplaint: z.string().trim().optional(),
  symptomOnset: z.string().optional(),
  symptomDurationValue: num(1, 3650),
  symptomDurationUnit: z.string().optional(),
  severity: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  subjective: z.string().trim().optional(),
  objective: z.string().trim().optional(),
  physicalExamination: z.string().trim().optional(),
  assessment: z.string().trim().optional(),
  plan: z.string().trim().optional(),
  symptomsText: z.string().trim().optional(),
  diagnosisText: z.string().trim().optional(),
  labsText: z.string().trim().optional(),
  imagingText: z.string().trim().optional(),
  treatmentsText: z.string().trim().optional(),
  temperature: num(30, 45),
  pulse: num(20, 250),
  respRate: num(4, 80),
  bpSystolic: num(50, 280),
  bpDiastolic: num(20, 200),
  spO2: num(50, 100),
  height: num(20, 250),
  weight: num(1, 400),
});

export const diagnosisSchema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  classification: z.enum(["ICD10", "ICD11", "SNOMED_CT", "LOCAL"]).optional(),
  codeSystem: z.string().optional(),
  status: z.enum(["SUSPECTED", "PROVISIONAL", "CONFIRMED", "RULED_OUT", "RESOLVED", "CHRONIC"]).optional(),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  course: z.enum(["ACUTE", "CHRONIC", "RECURRENT"]).optional(),
  laterality: z.enum(["LEFT", "RIGHT", "BILATERAL", "NOT_APPLICABLE"]).optional(),
  onsetDate: z.string().optional(),
  isPrimary: z.boolean().optional(),
  isDifferential: z.boolean().optional(),
  parentDiagnosisId: z.string().optional(),
  diagnosedBy: z.string().optional(),
  diagnosedAt: z.string().optional(),
  clinicalFindings: z.string().optional(),
  supportingLabResultIds: z.array(z.string()).optional(),
  supportingImagingIds: z.array(z.string()).optional(),
  treatmentPlan: z.string().optional(),
  followUp: z.string().optional(),
  notes: z.string().optional(),
});

export const diagnosisStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["SUSPECTED", "PROVISIONAL", "CONFIRMED", "RULED_OUT", "RESOLVED", "CHRONIC"]),
});

export const diagnosisAmendmentSchema = z.object({
  diagnosisId: z.string(),
  fieldName: z.string(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  reason: z.string().trim().min(1),
});

export const orderSchema = z.object({
  kind: z.enum(["MEDICATION", "LABORATORY", "IMAGING", "OTHER"]),
  name: z.string().trim().min(1),
  instructions: z.string().trim().optional(),
  dosage: z.string().trim().optional(),
  frequency: z.string().trim().optional(),
  durationDays: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(1).max(365).optional(),
  ),
  quantity: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  modality: z.string().optional(),
  labTestIds: z.array(z.string()).optional(),
  // Prescription fields
  drugCatalogId: z.string().optional(),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  strength: z.string().optional(),
  dosageForm: z.string().optional(),
  route: z.string().optional(),
  dose: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().positive().optional(),
  ),
  doseUnit: z.string().optional(),
  frequencyCode: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  refills: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(0).max(99).optional(),
  ),
  dispenseAsWritten: z.boolean().optional(),
  clinicalIndication: z.string().optional(),
  priority: z.enum(["ROUTINE", "URGENT"]).optional(),
  prescriptionStatus: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD", "EXPIRED"]).optional(),
});

export const historyFormSchema = z.object({
  painLocation: z.string().trim().optional(),
  symptomNature: z.enum(["CONTINUOUS", "INTERMITTENT", "WORSENING", "IMPROVING"]).optional(),
  aggravatingFactors: z.string().trim().optional(),
  alleviatingFactors: z.string().trim().optional(),
  hpi: z.string().trim().optional(),
  pastHistory: z.string().trim().optional(),
  familyHistory: z.string().trim().optional(),
  socialHistory: z.string().trim().optional(),
  ros: z.string().trim().optional(),
  historyNotes: z.string().trim().optional(),
});

const examTextField = z.string().trim().optional();

export const examFormSchema = z.object({
  general: examTextField,
  headNeck: examTextField,
  cardiac: examTextField,
  respiratory: examTextField,
  abdominal: examTextField,
  neuro: examTextField,
  skin: examTextField,
  extremities: examTextField,
  local: examTextField,
  additional: examTextField,
  examNotes: examTextField,
});

export const planFormSchema = z.object({
  plan: z.string().trim().optional(),
  clinicProcedures: z.string().trim().optional(),
  homeAdvice: z.string().trim().optional(),
  dietActivity: z.string().trim().optional(),
  redFlags: z.string().trim().optional(),
  referralTo: z.string().trim().optional(),
  urgent: z.boolean().optional(),
  sickLeaveDays: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(0).max(365).optional(),
  ),
  followUpNeeded: z.boolean().optional(),
  followUpDate: z.string().optional(),
  patientNotes: z.string().trim().optional(),
});

export const currentMedicationSchema = z.object({
  encounterId: z.string().trim().min(1),
  listType: z.enum(["current", "previous"]).optional(),
  name: z.string().trim().min(1),
  genericName: z.string().trim().optional(),
  brandName: z.string().trim().optional(),
  strength: z.string().trim().optional(),
  dosageForm: z.string().trim().optional(),
  route: z.string().trim().optional(),
  dose: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().positive().optional(),
  ),
  doseUnit: z.string().trim().optional(),
  frequency: z.string().trim().optional(),
  durationDays: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(1).max(3650).optional(),
  ),
  quantity: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  refills: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(0).max(99).optional(),
  ),
  instructions: z.string().trim().optional(),
  clinicalIndication: z.string().trim().optional(),
});

export type EncounterFormValues = z.infer<typeof encounterFormSchema>;
export type OrderValues = z.infer<typeof orderSchema>;
export type CurrentMedicationValues = z.infer<typeof currentMedicationSchema>;
export type HistoryFormValues = z.infer<typeof historyFormSchema>;
export type ExamFormValues = z.infer<typeof examFormSchema>;
export type PlanFormValues = z.infer<typeof planFormSchema>;

export const ENCOUNTER_TYPES = [
  "INITIAL",
  "FOLLOW_UP",
  "CONSULTATION",
  "VACCINATION",
  "PROCEDURE",
  "RE_EVALUATION",
] as const;

export const MODALITIES = ["XRAY", "US", "MRI", "CT", "ECG"] as const;

export const DIAGNOSIS_STATUSES = [
  "SUSPECTED",
  "PROVISIONAL",
  "CONFIRMED",
  "RULED_OUT",
  "RESOLVED",
  "CHRONIC",
] as const;

export const DIAGNOSIS_CLASSIFICATIONS = [
  "ICD10",
  "ICD11",
  "SNOMED_CT",
  "LOCAL",
] as const;

export const DIAGNOSIS_COURSES = [
  "ACUTE",
  "CHRONIC",
  "RECURRENT",
] as const;

export const LATERALITIES = [
  "LEFT",
  "RIGHT",
  "BILATERAL",
  "NOT_APPLICABLE",
] as const;

export const SEVERITIES = [
  "MILD",
  "MODERATE",
  "SEVERE",
  "CRITICAL",
] as const;

export const DURATION_UNITS = [
  "MINUTES",
  "HOURS",
  "DAYS",
  "WEEKS",
  "MONTHS",
  "YEARS",
] as const;

export const SYMPTOM_OPTIONS = [
  "FEVER",
  "PAIN",
  "COUGH",
  "SHORTNESS_OF_BREATH",
  "FATIGUE",
  "NAUSEA",
  "VOMITING",
  "DIARRHEA",
  "DIZZINESS",
  "HEADACHE",
  "CHEST_PAIN",
  "SWELLING",
  "RASH",
  "LOSS_OF_APPETITE",
] as const;

export const SYMPTOM_NATURES = [
  "CONTINUOUS",
  "INTERMITTENT",
  "WORSENING",
  "IMPROVING",
] as const;

export const CONFIDENCES = ["LOW", "MEDIUM", "HIGH"] as const;

export const EXAM_SECTIONS = [
  "general",
  "headNeck",
  "cardiac",
  "respiratory",
  "abdominal",
  "neuro",
  "skin",
  "extremities",
  "local",
  "additional",
] as const;