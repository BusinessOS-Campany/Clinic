import { z } from "zod";

export const INTERACTION_SEVERITIES = [
  "MINOR",
  "MODERATE",
  "MAJOR",
  "CONTRAINDICATED",
] as const;

export const interactionSchema = z
  .object({
    drugA: z.string().trim().min(1).max(200),
    drugB: z.string().trim().min(1).max(200),
    severity: z.enum(INTERACTION_SEVERITIES),
    description: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.drugA.toLowerCase() !== v.drugB.toLowerCase(), {
    message: "same-drug",
    path: ["drugB"],
  });

export type InteractionValues = z.infer<typeof interactionSchema>;
export type InteractionSeverity = (typeof INTERACTION_SEVERITIES)[number];
