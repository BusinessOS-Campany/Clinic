/**
 * Pure medication-safety checks: allergy cross-reactivity, duplicate therapy
 * and drug–drug interactions. Kept free of I/O so it can be unit tested and
 * reused both by the live prescribing UI and the server action.
 */

export type Severity = "MINOR" | "MODERATE" | "MAJOR" | "CONTRAINDICATED";

export type MedicationRef = {
  medicationId?: string | null;
  name: string;
  genericName?: string | null;
};

export type AllergyRef = {
  allergen: string;
  severity: string; // MILD | MODERATE | SEVERE
};

export type InteractionRef = {
  drugA: string;
  drugB: string;
  severity: string;
  description?: string | null;
};

export type SafetyAlert = {
  kind: "ALLERGY" | "DUPLICATE" | "INTERACTION";
  severity: Severity;
  medication: string;
  against: string;
  detail?: string | null;
};

const SEVERITY_RANK: Record<Severity, number> = {
  MINOR: 0,
  MODERATE: 1,
  MAJOR: 2,
  CONTRAINDICATED: 3,
};

const ALLERGY_SEVERITY: Record<string, Severity> = {
  MILD: "MINOR",
  MODERATE: "MODERATE",
  SEVERE: "MAJOR",
};

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

/** True when two drug/allergen names refer to the same substance. */
export function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na));
}

function namesOf(ref: MedicationRef): string[] {
  return [ref.name, ref.genericName ?? ""].filter((n) => n && n.trim());
}

function matchesMedication(a: MedicationRef, b: MedicationRef): boolean {
  if (a.medicationId && b.medicationId && a.medicationId === b.medicationId) {
    return true;
  }
  return namesOf(a).some((an) => namesOf(b).some((bn) => namesMatch(an, bn)));
}

export function highestSeverity(alerts: SafetyAlert[]): Severity | null {
  let highest: Severity | null = null;
  for (const a of alerts) {
    if (!highest || SEVERITY_RANK[a.severity] > SEVERITY_RANK[highest]) {
      highest = a.severity;
    }
  }
  return highest;
}

/** MAJOR/CONTRAINDICATED findings require a documented override reason. */
export function requiresOverride(alerts: SafetyAlert[]): boolean {
  const highest = highestSeverity(alerts);
  return highest === "MAJOR" || highest === "CONTRAINDICATED";
}

export function checkMedicationSafety(input: {
  candidates: MedicationRef[];
  allergies: AllergyRef[];
  activeMeds: MedicationRef[];
  interactions: InteractionRef[];
}): SafetyAlert[] {
  const { candidates, allergies, activeMeds, interactions } = input;
  const alerts: SafetyAlert[] = [];

  // Allergy cross-reactivity.
  for (const cand of candidates) {
    for (const allergy of allergies) {
      if (namesOf(cand).some((n) => namesMatch(n, allergy.allergen))) {
        alerts.push({
          kind: "ALLERGY",
          severity: ALLERGY_SEVERITY[allergy.severity] ?? "MODERATE",
          medication: cand.name,
          against: allergy.allergen,
          detail: null,
        });
      }
    }
  }

  // Duplicate therapy against already-active medications.
  for (const cand of candidates) {
    for (const active of activeMeds) {
      if (matchesMedication(cand, active)) {
        alerts.push({
          kind: "DUPLICATE",
          severity: "MODERATE",
          medication: cand.name,
          against: active.name,
          detail: null,
        });
      }
    }
  }

  // Drug–drug interactions: candidate vs active meds and candidate vs candidate.
  const others: MedicationRef[] = [
    ...activeMeds,
    ...candidates,
  ];
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i]!;
    for (let j = 0; j < others.length; j++) {
      const other = others[j]!;
      if (cand === other) continue;
      if (cand.medicationId && other.medicationId && cand.medicationId === other.medicationId) {
        continue;
      }
      for (const rule of interactions) {
        const candMatchesA = namesOf(cand).some((n) => namesMatch(n, rule.drugA));
        const candMatchesB = namesOf(cand).some((n) => namesMatch(n, rule.drugB));
        const otherMatchesA = namesOf(other).some((n) => namesMatch(n, rule.drugA));
        const otherMatchesB = namesOf(other).some((n) => namesMatch(n, rule.drugB));
        const paired =
          (candMatchesA && otherMatchesB) || (candMatchesB && otherMatchesA);
        if (paired) {
          alerts.push({
            kind: "INTERACTION",
            severity: (rule.severity as Severity) in SEVERITY_RANK
              ? (rule.severity as Severity)
              : "MODERATE",
            medication: cand.name,
            against: other.name,
            detail: rule.description ?? null,
          });
        }
      }
    }
  }

  // De-duplicate identical findings.
  const seen = new Set<string>();
  return alerts.filter((a) => {
    const key = `${a.kind}|${a.severity}|${normalizeName(a.medication)}|${normalizeName(a.against)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
