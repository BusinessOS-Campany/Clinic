import { z } from "zod";

const num = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(min).max(max).optional(),
  );

export const encounterFormSchema = z.object({
  visitType: z.enum([
    "NEW_CONSULTATION",
    "FOLLOW_UP",
    "EMERGENCY",
    "ROUTINE_EXAMINATION",
    "PREVENTIVE_EXAMINATION",
    "TELEMEDICINE",
    "PROCEDURE",
    "POST_TREATMENT_REVIEW",
  ]),
  chiefComplaint: z.string().trim().optional(),
  hpi: z.string().trim().optional(),
  reviewOfSystems: z.string().trim().optional(),
  physicalExamination: z.string().trim().optional(),
  examTemplateCode: z.string().trim().optional(),
  subjective: z.string().trim().optional(),
  objective: z.string().trim().optional(),
  assessment: z.string().trim().optional(),
  plan: z.string().trim().optional(),
  patientInstructions: z.string().trim().optional(),
  followUpPlan: z.string().trim().optional(),
  followUpDate: z.string().trim().optional(),
  referralSource: z.string().trim().optional(),
  referralNotes: z.string().trim().optional(),
  temperature: num(30, 45),
  pulse: num(20, 250),
  respRate: num(4, 80),
  bpSystolic: num(50, 280),
  bpDiastolic: num(20, 200),
  spO2: num(50, 100),
  height: num(20, 250),
  weight: num(1, 400),
});

export const amendmentSchema = z.object({
  reason: z.string().trim().min(3, "required"),
});

export const encounterRegistrationSchema = z.object({
  patientId: z.string().trim().min(1),
  visitType: z.enum([
    "NEW_CONSULTATION",
    "FOLLOW_UP",
    "EMERGENCY",
    "ROUTINE_EXAMINATION",
    "PREVENTIVE_EXAMINATION",
    "TELEMEDICINE",
    "PROCEDURE",
    "POST_TREATMENT_REVIEW",
  ]),
  doctorId: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  appointmentId: z.string().trim().optional(),
  chiefComplaint: z.string().trim().optional(),
  referralSource: z.string().trim().optional(),
  referralNotes: z.string().trim().optional(),
});

export const attachmentSchema = z.object({
  title: z.string().trim().min(1),
  fileName: z.string().trim().optional(),
  url: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const diagnosisSchema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().min(1),
  isPrimary: z.boolean().optional(),
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
  labPriority: z.enum(["ROUTINE", "URGENT", "STAT"]).optional(),
  labIndication: z.string().trim().max(500).optional(),
});

export type EncounterFormValues = z.infer<typeof encounterFormSchema>;
export type EncounterRegistrationValues = z.infer<typeof encounterRegistrationSchema>;
export type AttachmentValues = z.infer<typeof attachmentSchema>;
export type OrderValues = z.infer<typeof orderSchema>;

export const VISIT_TYPES = [
  "NEW_CONSULTATION",
  "FOLLOW_UP",
  "EMERGENCY",
  "ROUTINE_EXAMINATION",
  "PREVENTIVE_EXAMINATION",
  "TELEMEDICINE",
  "PROCEDURE",
  "POST_TREATMENT_REVIEW",
] as const;

export const ENCOUNTER_TYPES = VISIT_TYPES;

export const ENCOUNTER_STATUSES = [
  "CHECKED_IN",
  "TRIAGE",
  "IN_CONSULTATION",
  "COMPLETED",
  "SIGNED",
  "CANCELLED",
] as const;

export type EncounterStatusValue = (typeof ENCOUNTER_STATUSES)[number];

export const ENCOUNTER_STATUS_TRANSITIONS: Record<
  EncounterStatusValue,
  EncounterStatusValue[]
> = {
  CHECKED_IN: ["TRIAGE", "IN_CONSULTATION", "CANCELLED"],
  TRIAGE: ["IN_CONSULTATION", "CANCELLED"],
  IN_CONSULTATION: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["SIGNED"],
  SIGNED: [],
  CANCELLED: [],
};

export const MODALITIES = ["XRAY", "US", "MRI", "CT", "ECG"] as const;
