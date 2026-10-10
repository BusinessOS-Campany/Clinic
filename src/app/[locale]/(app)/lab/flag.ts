/**
 * Pure reference-range selection and abnormal-flag computation. Reference
 * ranges may differ by sex, age band, method and unit; the most specific
 * applicable range is chosen before comparing the numeric result.
 */

export type RangeSex = "ANY" | "MALE" | "FEMALE";
export type ResultFlag = "NORMAL" | "LOW" | "HIGH" | "CRITICAL_LOW" | "CRITICAL_HIGH" | "ABNORMAL";

export type RangeLike = {
  sex: string;
  ageMinYears: number | null;
  ageMaxYears: number | null;
  low: number | null;
  high: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  text?: string | null;
};

export function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function ageInBand(age: number | null, min: number | null, max: number | null): boolean {
  if (min === null && max === null) return true;
  if (age === null) return false;
  if (min !== null && age < min) return false;
  if (max !== null && age > max) return false;
  return true;
}

function sexMatches(rangeSex: string, sex: string | null): boolean {
  if (rangeSex === "ANY") return true;
  if (!sex) return false;
  return rangeSex === sex;
}

/** Picks the most specific applicable range for the given sex/age. */
export function pickRange(
  ranges: RangeLike[],
  sex: string | null,
  ageYears: number | null,
): RangeLike | null {
  const applicable = ranges.filter(
    (r) => sexMatches(r.sex, sex) && ageInBand(ageYears, r.ageMinYears, r.ageMaxYears),
  );
  if (applicable.length === 0) return null;

  const score = (r: RangeLike) => {
    let s = 0;
    if (r.sex !== "ANY") s += 4;
    if (r.ageMinYears !== null || r.ageMaxYears !== null) s += 2;
    if (r.low !== null || r.high !== null) s += 1;
    return s;
  };
  return applicable.sort((a, b) => score(b) - score(a))[0]!;
}

export function computeFlag(
  value: number | null,
  range: RangeLike | null,
): ResultFlag | null {
  if (value === null || !range) return null;
  const { low, high, criticalLow, criticalHigh } = range;
  if (criticalLow !== null && value <= criticalLow) return "CRITICAL_LOW";
  if (criticalHigh !== null && value >= criticalHigh) return "CRITICAL_HIGH";
  if (low !== null && value < low) return "LOW";
  if (high !== null && value > high) return "HIGH";
  if (low === null && high === null) return null;
  return "NORMAL";
}

export function isCriticalFlag(flag: ResultFlag | null): boolean {
  return flag === "CRITICAL_LOW" || flag === "CRITICAL_HIGH";
}

export function isAbnormalFlag(flag: ResultFlag | null): boolean {
  return flag !== null && flag !== "NORMAL";
}
