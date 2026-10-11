import { toNumber } from "@/lib/format";

export type VitalAlertInput = {
  temperature?: number | null;
  pulse?: number | null;
  respRate?: number | null;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  spO2?: number | null;
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  painScore?: number | null;
  glucose?: number | null;
  headCircumference?: number | null;
};

export type VitalRule = {
  id: string;
  vitalType: string;
  ageMin: number | null;
  ageMax: number | null;
  sex: string | null;
  conditionCode: string | null;
  minValue: unknown;
  maxValue: unknown;
  severity: string;
  message: string;
};

export type VitalAlertSpec = {
  vitalType: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  ruleId: string;
  value: number;
};

const FIELD_BY_TYPE: Record<string, keyof VitalAlertInput> = {
  TEMPERATURE: "temperature",
  PULSE: "pulse",
  RESP_RATE: "respRate",
  BP_SYSTOLIC: "bpSystolic",
  BP_DIASTOLIC: "bpDiastolic",
  SPO2: "spO2",
  PAIN: "painScore",
  GLUCOSE: "glucose",
  BMI: "bmi",
  HEIGHT: "height",
  WEIGHT: "weight",
  HEAD_CIRCUMFERENCE: "headCircumference",
};

const SEVERITY_RANK: Record<string, number> = {
  INFO: 0,
  WARNING: 1,
  CRITICAL: 2,
};

function matchesAge(
  ageMonths: number | null,
  ageMin: number | null,
  ageMax: number | null,
): boolean {
  const min = ageMin && ageMin > 0 ? ageMin : null;
  const max = ageMax && ageMax > 0 ? ageMax : null;
  if (ageMonths == null) return min == null && max == null;
  if (min != null && ageMonths < min) return false;
  if (max != null && ageMonths > max) return false;
  return true;
}

/**
 * Evaluates recorded measurements against clinic alert rules (normal-range
 * semantics: a rule fires when the value is below minValue or above maxValue).
 * Rules scoped to a condition code are skipped (condition is not known at
 * capture time). At most one alert per vital type is returned — the highest
 * severity that was triggered.
 */
export function evaluateVitalAlerts(
  input: VitalAlertInput,
  rules: VitalRule[],
  ageMonths: number | null,
  sex: string | null,
): VitalAlertSpec[] {
  const byType = new Map<string, VitalAlertSpec[]>();

  for (const rule of rules) {
    if (rule.conditionCode) continue;
    if (rule.sex && rule.sex !== sex) continue;
    if (!matchesAge(ageMonths, rule.ageMin, rule.ageMax)) continue;

    const field = FIELD_BY_TYPE[rule.vitalType];
    if (!field) continue;
    const raw = input[field];
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;

    const min = rule.minValue != null ? toNumber(rule.minValue) : null;
    const max = rule.maxValue != null ? toNumber(rule.maxValue) : null;

    let violated = false;
    if (min != null && raw < min) violated = true;
    if (max != null && raw > max) violated = true;
    if (!violated) continue;

    const severity =
      rule.severity === "CRITICAL"
        ? "CRITICAL"
        : rule.severity === "INFO"
          ? "INFO"
          : "WARNING";

    const list = byType.get(rule.vitalType) ?? [];
    list.push({
      vitalType: rule.vitalType,
      severity,
      message: rule.message,
      ruleId: rule.id,
      value: raw,
    });
    byType.set(rule.vitalType, list);
  }

  const result: VitalAlertSpec[] = [];
  for (const specs of byType.values()) {
    const topRank = Math.max(...specs.map((s) => SEVERITY_RANK[s.severity] ?? 0));
    const seen = new Set<string>();
    for (const spec of specs) {
      if ((SEVERITY_RANK[spec.severity] ?? 0) !== topRank) continue;
      if (seen.has(spec.message)) continue;
      seen.add(spec.message);
      result.push(spec);
    }
  }
  return result;
}
