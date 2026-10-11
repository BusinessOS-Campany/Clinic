import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";

const n = (v: { toString(): string } | null | undefined): number | null =>
  v == null ? null : toNumber(v);

export type EncounterSummary = {
  allergies: Array<{
    id: string;
    allergen: string;
    type: string;
    reaction: string | null;
    severity: string;
  }>;
  chronicConditions: Array<{
    id: string;
    name: string;
    code: string | null;
    status: string;
  }>;
  currentMedications: Array<{
    id: string;
    name: string;
    strength: string | null;
    dosageForm: string | null;
    route: string | null;
    dose: number | null;
    doseUnit: string | null;
    frequencyCode: string | null;
    instructions: string | null;
  }>;
  vitals: Array<{
    id: string;
    recordedAt: string;
    temperature: number | null;
    pulse: number | null;
    respRate: number | null;
    bpSystolic: number | null;
    bpDiastolic: number | null;
    spO2: number | null;
    painScore: number | null;
  }>;
  recentDiagnoses: Array<{
    id: string;
    name: string;
    code: string | null;
    status: string;
    encounterAt: string;
  }>;
  recentVisits: Array<{
    id: string;
    visitNumber: string;
    status: string;
    type: string;
    arrivedAt: string;
  }>;
  labResults: Array<{
    id: string;
    testName: string;
    resultValue: string | null;
    unit: string | null;
    referenceRange: string | null;
    isAbnormal: boolean | null;
    verifiedAt: string | null;
    status: string;
  }>;
  imagingResults: Array<{
    id: string;
    modality: string | null;
    findings: string | null;
    impression: string | null;
    reportedAt: string | null;
  }>;
  billing: {
    invoiceNo: string;
    status: string;
    total: number;
    paidAmount: number;
    balance: number;
  } | null;
  hasOutstanding: boolean;
};

export async function loadEncounterSummary(
  clinicId: string,
  patientId: string,
): Promise<EncounterSummary> {
  const [
    allergies,
    dxs,
    meds,
    vitals,
    visits,
    labResults,
    imagingResults,
    invoices,
  ] = await Promise.all([
    prisma.allergy.findMany({
      where: { clinicId, patientId, isActive: true },
      select: { id: true, allergen: true, type: true, reaction: true, severity: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.encounterDiagnosis.findMany({
      where: {
        clinicId,
        isDifferential: false,
        status: { in: ["SUSPECTED", "PROVISIONAL", "CONFIRMED", "CHRONIC"] },
        encounter: { patientId },
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        encounter: { select: { createdAt: true } },
      },
      orderBy: { diagnosedAt: "desc" },
      take: 10,
    }),
    prisma.medicalOrder.findMany({
      where: {
        clinicId,
        patientId,
        kind: "MEDICATION",
        prescriptionStatus: "ACTIVE",
        status: { in: ["PENDING", "ACTIVE"] },
      },
      select: {
        id: true,
        name: true,
        strength: true,
        dosageForm: true,
        route: true,
        dose: true,
        doseUnit: true,
        frequencyCode: true,
        instructions: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.vitalSign.findMany({
      where: { clinicId, patientId },
      select: {
        id: true,
        recordedAt: true,
        temperature: true,
        pulse: true,
        respRate: true,
        bpSystolic: true,
        bpDiastolic: true,
        spO2: true,
        painScore: true,
      },
      orderBy: { recordedAt: "desc" },
      take: 3,
    }),
    prisma.visit.findMany({
      where: { clinicId, patientId },
      select: { id: true, visitNumber: true, status: true, type: true, arrivedAt: true },
      orderBy: { arrivedAt: "desc" },
      take: 5,
    }),
    prisma.labResult.findMany({
      where: {
        status: { in: ["RESULTED", "VERIFIED"] },
        request: { clinicId, patientId },
      },
      select: {
        id: true,
        testName: true,
        resultValue: true,
        unit: true,
        referenceRange: true,
        isAbnormal: true,
        verifiedAt: true,
        status: true,
      },
      orderBy: { verifiedAt: "desc" },
      take: 8,
    }),
    prisma.imagingRequest.findMany({
      where: { clinicId, patientId, status: "REPORTED" },
      select: {
        id: true,
        modality: true,
        findings: true,
        impression: true,
        reportedAt: true,
      },
      orderBy: { reportedAt: "desc" },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { clinicId, patientId },
      select: { id: true, invoiceNo: true, status: true, total: true, paidAmount: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const chronicConditions = dxs
    .filter((d) => d.status === "CHRONIC")
    .slice(0, 5)
    .map((d) => ({ id: d.id, name: d.name, code: d.code, status: d.status }));

  const recentDiagnoses = dxs.slice(0, 5).map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    status: d.status,
    encounterAt: d.encounter.createdAt.toISOString(),
  }));

  const openTotal = invoices
    .filter((i) => i.status === "OPEN" || i.status === "DRAFT")
    .reduce((sum, i) => sum + (toNumber(i.total) - toNumber(i.paidAmount)), 0);

  const latest = invoices[0];
  const billing = latest
    ? {
        invoiceNo: latest.invoiceNo,
        status: latest.status,
        total: toNumber(latest.total),
        paidAmount: toNumber(latest.paidAmount),
        balance: toNumber(latest.total) - toNumber(latest.paidAmount),
      }
    : null;

  return {
    allergies: allergies.map((a) => ({
      id: a.id,
      allergen: a.allergen,
      type: a.type,
      reaction: a.reaction,
      severity: a.severity,
    })),
    chronicConditions,
    currentMedications: meds.map((m) => ({
      id: m.id,
      name: m.name,
      strength: m.strength,
      dosageForm: m.dosageForm,
      route: m.route,
      dose: n(m.dose),
      doseUnit: m.doseUnit,
      frequencyCode: m.frequencyCode,
      instructions: m.instructions,
    })),
    vitals: vitals.map((v) => ({
      id: v.id,
      recordedAt: v.recordedAt.toISOString(),
      temperature: n(v.temperature),
      pulse: v.pulse,
      respRate: v.respRate,
      bpSystolic: v.bpSystolic,
      bpDiastolic: v.bpDiastolic,
      spO2: v.spO2,
      painScore: v.painScore,
    })),
    recentDiagnoses,
    recentVisits: visits.map((v) => ({
      id: v.id,
      visitNumber: v.visitNumber,
      status: v.status,
      type: v.type,
      arrivedAt: v.arrivedAt.toISOString(),
    })),
    labResults: labResults.map((r) => ({
      id: r.id,
      testName: r.testName,
      resultValue: r.resultValue,
      unit: r.unit,
      referenceRange: r.referenceRange,
      isAbnormal: r.isAbnormal,
      verifiedAt: r.verifiedAt?.toISOString() ?? null,
      status: r.status,
    })),
    imagingResults: imagingResults.map((r) => ({
      id: r.id,
      modality: r.modality,
      findings: r.findings,
      impression: r.impression,
      reportedAt: r.reportedAt?.toISOString() ?? null,
    })),
    billing,
    hasOutstanding: openTotal > 0,
  };
}