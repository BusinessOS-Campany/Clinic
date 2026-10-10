import { z } from "zod";
import { MEDICATION_FORMS, MEDICATION_ROUTES } from "../pharmacy/medications/schema";

export const prescriptionItemSchema = z.object({
  medicationId: z.string().min(1),
  medicationName: z.string().trim().min(1).max(200),
  genericName: z.string().trim().max(200).optional(),
  strength: z.string().trim().max(40).optional(),
  form: z.enum(MEDICATION_FORMS).optional(),
  route: z.enum(MEDICATION_ROUTES).optional(),
  dosage: z.string().trim().min(1).max(120),
  frequency: z.string().trim().min(1).max(120),
  durationDays: z.coerce.number().int().min(0).max(3650).optional(),
  quantity: z.coerce.number().min(0).max(100000).default(0),
  unit: z.string().trim().max(40).optional(),
  instructions: z.string().trim().max(500).optional(),
});

export const prescriptionSchema = z.object({
  encounterId: z.string().min(1).optional(),
  patientId: z.string().min(1),
  items: z.array(prescriptionItemSchema).min(1).max(30),
  followUpDate: z.string().trim().optional(),
  instructions: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(1000).optional(),
  overrideReason: z.string().trim().max(500).optional(),
  sign: z.boolean().optional(),
});

export type PrescriptionItemValues = z.infer<typeof prescriptionItemSchema>;
export type PrescriptionValues = z.infer<typeof prescriptionSchema>;
