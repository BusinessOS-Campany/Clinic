import { z } from "zod";

export const imagingReportSchema = z.object({
  findings: z.string().trim().min(1).max(5_000),
});

export type ImagingReportValues = z.infer<typeof imagingReportSchema>;