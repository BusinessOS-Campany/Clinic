import { z } from "zod";

const num = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(min).max(max).optional(),
  );

const int = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(min).max(max).optional(),
  );

export const TRIAGE_LEVELS = [
  "RESUSCITATION",
  "EMERGENT",
  "URGENT",
  "STANDARD",
  "NON_URGENT",
] as const;

export type TriageLevelValue = (typeof TRIAGE_LEVELS)[number];

export const vitalsSchema = z.object({
  temperature: num(30, 45),
  pulse: int(20, 250),
  respRate: int(4, 80),
  bpSystolic: int(50, 280),
  bpDiastolic: int(20, 200),
  spO2: int(50, 100),
  painScore: int(0, 10),
  glucose: num(1, 60),
  height: num(20, 250),
  weight: num(1, 400),
  triageLevel: z.enum(TRIAGE_LEVELS).optional(),
  triageNotes: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const triageSchema = z.object({
  triageLevel: z.enum(TRIAGE_LEVELS),
  triageNotes: z.string().trim().optional(),
});

export type VitalsValues = z.infer<typeof vitalsSchema>;
export type TriageValues = z.infer<typeof triageSchema>;
