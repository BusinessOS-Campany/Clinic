import { z } from "zod";

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
export const EXCEPTION_TYPES = ["TIME_OFF", "EXTRA_HOURS"] as const;
export const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60] as const;

function minutes() {
  return z.number().int().min(0).max(1440).nullable();
}

export const scheduleRowSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    isActive: z.boolean(),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
    breakStartMinute: minutes(),
    breakEndMinute: minutes(),
    slotMinutes: z.number().int().min(5).max(120),
  })
  .refine((r) => !r.isActive || r.endMinute > r.startMinute, {
    path: ["endMinute"],
  })
  .refine(
    (r) =>
      !r.isActive ||
      r.breakStartMinute == null ||
      r.breakEndMinute == null ||
      r.breakEndMinute > r.breakStartMinute,
    { path: ["breakEndMinute"] },
  );

export const saveScheduleSchema = z.object({
  doctorId: z.string().min(1),
  rows: z.array(scheduleRowSchema).length(7),
});

export const exceptionSchema = z.object({
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["TIME_OFF", "EXTRA_HOURS"]),
  startMinute: minutes(),
  endMinute: minutes(),
  reason: z.string().trim().optional(),
});

export const availabilityQuerySchema = z.object({
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type ScheduleRowValues = z.infer<typeof scheduleRowSchema>;
export type SaveScheduleValues = z.infer<typeof saveScheduleSchema>;
export type ExceptionValues = z.infer<typeof exceptionSchema>;
export type AvailabilityQueryValues = z.infer<typeof availabilityQuerySchema>;
