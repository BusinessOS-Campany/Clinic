import { prisma } from "@/lib/db";

export type SequenceKey =
  | "PATIENT"
  | "ENCOUNTER"
  | "VISIT"
  | "INVOICE"
  | "RECEIPT"
  | "QUEUE"
  | "REQ_LAB"
  | "REQ_IMAGING";

const DEFAULTS: Record<SequenceKey, { prefix: string; pad: number }> = {
  PATIENT: { prefix: "P", pad: 5 },
  ENCOUNTER: { prefix: "E", pad: 5 },
  VISIT: { prefix: "V", pad: 5 },
  INVOICE: { prefix: "INV", pad: 5 },
  RECEIPT: { prefix: "RCP", pad: 5 },
  QUEUE: { prefix: "Q", pad: 3 },
  REQ_LAB: { prefix: "LAB", pad: 5 },
  REQ_IMAGING: { prefix: "IMG", pad: 5 },
};

export async function nextNumber(
  clinicId: string,
  key: SequenceKey,
  overrides?: { prefix?: string; padLength?: number },
): Promise<string> {
  const def = DEFAULTS[key] ?? { prefix: "", pad: 5 };
  const prefix = overrides?.prefix ?? def.prefix;
  const padLength = overrides?.padLength ?? def.pad;

  const seq = await prisma.numberSequence.upsert({
    where: { clinicId_key: { clinicId, key } },
    create: {
      clinicId,
      key,
      prefix,
      padLength,
      currentValue: 1,
    },
    update: {
      prefix,
      padLength,
      currentValue: { increment: 1 },
    },
    select: { currentValue: true, padLength: true, prefix: true, suffix: true },
  });

  return `${seq.prefix}${String(seq.currentValue).padStart(seq.padLength, "0")}${seq.suffix}`;
}

export async function peekNumber(
  clinicId: string,
  key: SequenceKey,
): Promise<string> {
  const def = DEFAULTS[key] ?? { prefix: "", pad: 5 };
  const seq = await prisma.numberSequence.findUnique({
    where: { clinicId_key: { clinicId, key } },
    select: { currentValue: true, padLength: true, prefix: true, suffix: true },
  });
  const currentValue = seq ? seq.currentValue + BigInt(1) : BigInt(1);
  return `${seq?.prefix ?? def.prefix}${String(currentValue).padStart(seq?.padLength ?? def.pad, "0")}${seq?.suffix ?? ""}`;
}