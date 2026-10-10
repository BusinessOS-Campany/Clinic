import { z } from "zod";

export const clinicSettingsSchema = z.object({
  currency: z.string().trim().min(1).max(10),
  timezone: z.string().trim().min(1),
  locale: z.enum(["ar", "en"]),
  dateFormat: z.string().trim().min(1),
});

export type ClinicSettingsFormValues = z.infer<typeof clinicSettingsSchema>;