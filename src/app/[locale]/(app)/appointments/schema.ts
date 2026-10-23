import { z } from "zod";

export const appointmentFormSchema = z.object({
  patientId: z.string().min(1, "required"),
  doctorId: z.string().min(1, "required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "required"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "required"),
  durationMinutes: z.number().int().min(10).max(240),
  type: z.enum([
    "INITIAL",
    "FOLLOW_UP",
    "CONSULTATION",
    "VACCINATION",
    "PROCEDURE",
    "RE_EVALUATION",
  ]),
  reason: z.string().trim().optional(),
  departmentId: z.string().optional(),
  roomId: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export const APPOINTMENT_TYPES = [
  "INITIAL",
  "FOLLOW_UP",
  "CONSULTATION",
  "VACCINATION",
  "PROCEDURE",
  "RE_EVALUATION",
] as const;

export const APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "ARRIVED",
  "IN_SERVICE",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type AppointmentStatusValue = (typeof APPOINTMENT_STATUSES)[number];

export const STATUS_TRANSITIONS: Record<
  AppointmentStatusValue,
  AppointmentStatusValue[]
> = {
  SCHEDULED: ["CONFIRMED", "ARRIVED", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["ARRIVED", "IN_SERVICE", "CANCELLED", "NO_SHOW"],
  ARRIVED: ["IN_SERVICE", "COMPLETED", "CANCELLED", "NO_SHOW"],
  IN_SERVICE: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};