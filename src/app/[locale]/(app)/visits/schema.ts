import { z } from "zod";

export const VISIT_ROUTES = ["TRIAGE", "DOCTOR"] as const;
export type VisitRoute = (typeof VISIT_ROUTES)[number];

export const VISIT_TYPES = ["NEW", "FOLLOW_UP", "EMERGENCY"] as const;
export type VisitTypeValue = (typeof VISIT_TYPES)[number];

export const VISIT_PRIORITIES = ["NORMAL", "URGENT", "EMERGENCY"] as const;
export type VisitPriorityValue = (typeof VISIT_PRIORITIES)[number];

export const REFERRAL_SOURCES = ["SELF", "DOCTOR", "HOSPITAL", "OTHER"] as const;
export type ReferralSourceValue = (typeof REFERRAL_SOURCES)[number];

export const DURATION_UNITS = [
  "HOURS",
  "DAYS",
  "WEEKS",
  "MONTHS",
  "YEARS",
] as const;
export type DurationUnitValue = (typeof DURATION_UNITS)[number];

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : undefined));

export const openVisitSchema = z.object({
  route: z.enum(VISIT_ROUTES),
  type: z.enum(VISIT_TYPES).default("NEW"),
  priority: z.enum(VISIT_PRIORITIES).default("NORMAL"),
  referralSource: z.enum(REFERRAL_SOURCES).default("SELF"),
  departmentId: z.string().optional(),
  doctorId: z.string().optional(),
  reason: optionalText,
  chiefComplaint: optionalText,
  symptomDurationValue: z.coerce.number().int().min(0).max(9999).optional(),
  symptomDurationUnit: z.enum(DURATION_UNITS).optional(),
  notes: optionalText,
});

export const routeVisitSchema = z.object({
  destination: z.enum(VISIT_ROUTES),
  doctorId: z.string().optional(),
});

export const queueEntryStatusSchema = z.enum([
  "WAITING",
  "CALLED",
  "IN_PROGRESS",
  "DONE",
  "SKIPPED",
  "CANCELLED",
]);

export type QueueEntryStatusValue = z.infer<typeof queueEntryStatusSchema>;
