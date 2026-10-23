import { z } from "zod";

const optNum = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(min).max(max).optional(),
  );

const optInt = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(min).max(max).optional(),
  );

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const VITAL_CONSCIOUSNESS = [
  "ALERT",
  "VERBAL",
  "PAIN",
  "UNRESPONSIVE",
] as const;

export const GLUCOSE_TYPES = [
  "FASTING",
  "RANDOM",
  "PRE_PRANDIAL",
  "POST_PRANDIAL",
] as const;

export const VITAL_POSITIONS = [
  "SITTING",
  "STANDING",
  "SUPINE",
  "LEFT_LATERAL",
  "RIGHT_LATERAL",
] as const;

export const recordVitalsSchema = z.object({
  encounterId: z.string().trim().optional(),
  recordedAt: z.string().optional(),
  temperature: optNum(25, 45),
  pulse: optInt(20, 300),
  respRate: optInt(4, 80),
  bpSystolic: optInt(50, 300),
  bpDiastolic: optInt(20, 200),
  spO2: optInt(40, 100),
  height: optNum(20, 250),
  weight: optNum(0.5, 500),
  headCircumference: optNum(20, 70),
  painScore: optInt(0, 10),
  consciousness: z.enum(VITAL_CONSCIOUSNESS).optional(),
  glucose: optNum(10, 1000),
  glucoseType: z.enum(GLUCOSE_TYPES).optional(),
  glucoseTiming: optText(200),
  position: z.enum(VITAL_POSITIONS).optional(),
  device: optText(200),
  notes: optText(2000),
});

export type RecordVitalsValues = z.infer<typeof recordVitalsSchema>;

export const vitalAlertAckSchema = z.object({
  alertId: z.string().trim().min(1),
});

export const MEASUREMENT_KEYS = [
  "temperature",
  "pulse",
  "respRate",
  "bpSystolic",
  "bpDiastolic",
  "spO2",
  "height",
  "weight",
  "headCircumference",
  "painScore",
  "glucose",
  "consciousness",
] as const;
