"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { round2 } from "@/lib/format";
import { evaluateVitalAlerts, type VitalAlertSpec } from "@/lib/vitals/alerts";
import {
  loadAlertRules,
  patientAgeMonths,
} from "@/lib/vitals/queries";
import {
  recordVitalsSchema,
  MEASUREMENT_KEYS,
  type RecordVitalsValues,
} from "./schema";

type Result =
  | { ok: true; id: string; alerts: VitalAlertSpec[] }
  | { ok: false; error: "no-clinic" | "not-found" | "invalid" | "empty" };

function readNumber(values: RecordVitalsValues, key: (typeof MEASUREMENT_KEYS)[number]) {
  const v = values[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export async function recordVitals(
  patientId: string,
  input: unknown,
): Promise<Result> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = recordVitalsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const values = parsed.data;

  const hasMeasurement = MEASUREMENT_KEYS.some((key) => {
    const v = values[key];
    return v !== undefined && v !== null;
  });
  if (!hasMeasurement) return { ok: false, error: "empty" };

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    select: { id: true, birthDate: true, gender: true },
  });
  if (!patient) return { ok: false, error: "not-found" };

  let encounterId: string | null = null;
  if (values.encounterId) {
    const encounter = await prisma.encounter.findFirst({
      where: { id: values.encounterId, clinicId, patientId },
      select: { id: true },
    });
    encounterId = encounter?.id ?? null;
  }

  const height = readNumber(values, "height");
  const weight = readNumber(values, "weight");
  const bmi =
    height && weight ? round2(weight / Math.pow(height / 100, 2)) : null;

  const recordedAt = values.recordedAt ? new Date(values.recordedAt) : new Date();
  const when = Number.isNaN(recordedAt.getTime()) ? new Date() : recordedAt;

  const painScore = readNumber(values, "painScore");

  const vital = await prisma.vitalSign.create({
    data: {
      clinicId,
      patientId,
      encounterId,
      recordedBy: user.id,
      recordedAt: when,
      temperature: readNumber(values, "temperature"),
      pulse: readNumber(values, "pulse"),
      respRate: readNumber(values, "respRate"),
      bpSystolic: readNumber(values, "bpSystolic"),
      bpDiastolic: readNumber(values, "bpDiastolic"),
      spO2: readNumber(values, "spO2"),
      height,
      weight,
      bmi,
      painScore,
      consciousness: values.consciousness ?? null,
      glucose: readNumber(values, "glucose"),
      glucoseType: values.glucoseType ?? null,
      glucoseTiming: values.glucoseTiming ?? null,
      headCircumference: readNumber(values, "headCircumference"),
      position: values.position ?? null,
      device: values.device ?? null,
      notes: values.notes ?? null,
      isManual: true,
    },
    select: { id: true },
  });

  const rules = await loadAlertRules(clinicId);
  const spec = evaluateVitalAlerts(
    {
      temperature: readNumber(values, "temperature"),
      pulse: readNumber(values, "pulse"),
      respRate: readNumber(values, "respRate"),
      bpSystolic: readNumber(values, "bpSystolic"),
      bpDiastolic: readNumber(values, "bpDiastolic"),
      spO2: readNumber(values, "spO2"),
      height,
      weight,
      bmi,
      painScore,
      glucose: readNumber(values, "glucose"),
      headCircumference: readNumber(values, "headCircumference"),
    },
    rules,
    patientAgeMonths(patient.birthDate),
    patient.gender,
  );

  if (spec.length > 0) {
    await prisma.vitalAlert.createMany({
      data: spec.map((s) => ({
        clinicId,
        patientId,
        vitalSignId: vital.id,
        ruleId: s.ruleId,
        vitalType: s.vitalType as never,
        value: s.value,
        severity: s.severity,
        message: s.message,
      })),
    });
  }

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "VitalSign",
    entityId: vital.id,
    clinicId,
    metadata: {
      patientId,
      encounterId,
      alertCount: spec.length,
    },
  });

  revalidatePath("/nursing");
  revalidatePath(`/patients/${patientId}`);
  if (encounterId) revalidatePath(`/encounters/${encounterId}`);

  return { ok: true, id: vital.id, alerts: spec };
}

export async function acknowledgeVitalAlert(
  alertId: string,
): Promise<{ ok: true } | { ok: false; error: "no-clinic" | "not-found" }> {
  const user = await requirePermission("encounters:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const alert = await prisma.vitalAlert.findFirst({
    where: { id: alertId, clinicId },
    select: { id: true, patientId: true },
  });
  if (!alert) return { ok: false, error: "not-found" };

  await prisma.vitalAlert.update({
    where: { id: alert.id },
    data: {
      acknowledged: true,
      acknowledgedBy: user.id,
      acknowledgedAt: new Date(),
    },
  });

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "VitalAlert",
    entityId: alert.id,
    clinicId,
    metadata: { patientId: alert.patientId },
  });

  revalidatePath("/nursing");
  revalidatePath(`/patients/${alert.patientId}`);
  return { ok: true };
}
