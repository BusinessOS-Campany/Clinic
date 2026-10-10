import { describe, expect, it } from "vitest";
import {
  checkMedicationSafety,
  highestSeverity,
  namesMatch,
  normalizeName,
  requiresOverride,
} from "./safety";

describe("normalizeName / namesMatch", () => {
  it("normalizes case and punctuation", () => {
    expect(normalizeName("Amoxicillin/Clavulanate")).toBe("amoxicillinclavulanate");
  });

  it("matches substrings conservatively", () => {
    expect(namesMatch("Amoxicillin", "amoxicillin")).toBe(true);
    expect(namesMatch("Paracetamol", "Paracetamol 500mg")).toBe(true);
    expect(namesMatch("Aspirin", "Warfarin")).toBe(false);
  });
});

describe("checkMedicationSafety", () => {
  const interactions = [
    { drugA: "Warfarin", drugB: "Aspirin", severity: "MAJOR", description: "Bleeding" },
    { drugA: "Enalapril", drugB: "Ibuprofen", severity: "MODERATE", description: null },
  ];

  it("flags allergies against the generic or brand name", () => {
    const alerts = checkMedicationSafety({
      candidates: [{ name: "Augmentin", genericName: "Amoxicillin/Clavulanate" }],
      allergies: [{ allergen: "Amoxicillin", severity: "SEVERE" }],
      activeMeds: [],
      interactions: [],
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ kind: "ALLERGY", severity: "MAJOR" });
  });

  it("flags duplicate therapy by medication id", () => {
    const alerts = checkMedicationSafety({
      candidates: [{ medicationId: "m1", name: "Metformin" }],
      allergies: [],
      activeMeds: [{ medicationId: "m1", name: "Metformin" }],
      interactions: [],
    });
    expect(alerts.some((a) => a.kind === "DUPLICATE")).toBe(true);
  });

  it("flags interactions against active medications", () => {
    const alerts = checkMedicationSafety({
      candidates: [{ name: "Aspirin" }],
      allergies: [],
      activeMeds: [{ name: "Warfarin" }],
      interactions,
    });
    const ix = alerts.find((a) => a.kind === "INTERACTION");
    expect(ix).toMatchObject({ severity: "MAJOR" });
    expect(requiresOverride(alerts)).toBe(true);
  });

  it("flags interactions between two new items", () => {
    const alerts = checkMedicationSafety({
      candidates: [{ name: "Enalapril" }, { name: "Ibuprofen" }],
      allergies: [],
      activeMeds: [],
      interactions,
    });
    expect(alerts.some((a) => a.kind === "INTERACTION" && a.severity === "MODERATE")).toBe(true);
  });

  it("de-duplicates identical findings", () => {
    const alerts = checkMedicationSafety({
      candidates: [{ name: "Aspirin" }],
      allergies: [{ allergen: "Aspirin", severity: "MILD" }],
      activeMeds: [{ name: "Warfarin" }],
      interactions,
    });
    const keys = alerts.map((a) => `${a.kind}|${a.medication}|${a.against}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("severity helpers", () => {
  it("computes the highest severity", () => {
    expect(
      highestSeverity([
        { kind: "DUPLICATE", severity: "MODERATE", medication: "a", against: "b" },
        { kind: "ALLERGY", severity: "MAJOR", medication: "a", against: "b" },
      ]),
    ).toBe("MAJOR");
  });

  it("requires an override only for major findings", () => {
    expect(
      requiresOverride([
        { kind: "INTERACTION", severity: "MODERATE", medication: "a", against: "b" },
      ]),
    ).toBe(false);
    expect(
      requiresOverride([
        { kind: "INTERACTION", severity: "CONTRAINDICATED", medication: "a", against: "b" },
      ]),
    ).toBe(true);
  });
});
