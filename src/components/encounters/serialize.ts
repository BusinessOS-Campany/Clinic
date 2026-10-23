import type { ChartEncounter, ChartOrder, ChartDiagnosis } from "@/components/encounters/encounter-chart";
import type { Prisma } from "@/lib/generated/prisma/client";

type EncounterFull = Prisma.EncounterGetPayload<{
  include: {
    patient: true;
    doctor: { select: { name: true } };
    diagnoses: true;
    orders: {
      include: {
        labRequest: {
          select: {
            id: true;
            status: true;
            tests: {
              where: { status: { in: ["RESULTED", "VERIFIED"] } };
              select: { testName: true; resultValue: true; unit: true; isAbnormal: true };
              orderBy: { createdAt: "asc" };
            };
          };
        };
        imagingRequest: {
          select: { id: true; status: true; modality: true; findings: true; impression: true };
        };
      };
    };
  };
}>;

export function serializeEncounter(e: EncounterFull): ChartEncounter {
  return {
    id: e.id,
    status: e.status,
    appointmentId: e.appointmentId,
    patientId: e.patientId,
    patientName: `${e.patient.firstNameAr} ${e.patient.lastNameAr}`,
    mrn: e.patient.mrn,
    doctorName: e.doctor?.name ?? null,
    startedAt: e.startedAt?.toISOString() ?? null,
    completedAt: e.completedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    type: e.type,
    chiefComplaint: e.chiefComplaint,
    symptomOnset: e.symptomOnset?.toISOString() ?? null,
    symptomDurationValue: e.symptomDurationValue,
    symptomDurationUnit: e.symptomDurationUnit,
    severity: e.severity,
    symptoms: e.symptoms,
    subjective: e.subjective,
    objective: e.objective,
    physicalExamination: e.physicalExamination,
    assessment: e.assessment,
    plan: e.plan,
    symptomsText: e.symptomsText,
    diagnosisText: e.diagnosisText,
    labsText: e.labsText,
    imagingText: e.imagingText,
    treatmentsText: e.treatmentsText,
    temperature: e.temperature === null ? null : Number(e.temperature),
    pulse: e.pulse,
    respRate: e.respRate,
    bpSystolic: e.bpSystolic,
    bpDiastolic: e.bpDiastolic,
    spO2: e.spO2,
    height: e.height === null ? null : Number(e.height),
    weight: e.weight === null ? null : Number(e.weight),
    painLocation: e.painLocation,
    symptomNature: e.symptomNature,
    aggravatingFactors: e.aggravatingFactors,
    alleviatingFactors: e.alleviatingFactors,
    history: e.history ?? null,
    examination: e.examination ?? null,
    treatmentPlan: e.treatmentPlan ?? null,
    diagnoses: e.diagnoses.map((d): ChartDiagnosis => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      classification: d.classification,
      codeSystem: d.codeSystem,
      status: d.status,
      course: d.course,
      laterality: d.laterality,
      onsetDate: d.onsetDate?.toISOString() ?? null,
      isPrimary: d.isPrimary,
      isDifferential: d.isDifferential,
      parentDiagnosisId: d.parentDiagnosisId,
      diagnosedBy: d.diagnosedBy,
      diagnosedAt: d.diagnosedAt?.toISOString() ?? null,
      clinicalFindings: d.clinicalFindings,
      supportingLabResultIds: d.supportingLabResultIds ? JSON.parse(d.supportingLabResultIds) : null,
      supportingImagingIds: d.supportingImagingIds ? JSON.parse(d.supportingImagingIds) : null,
      treatmentPlan: d.treatmentPlan,
      followUp: d.followUp,
      notes: d.notes,
      resolvedAt: d.resolvedAt?.toISOString() ?? null,
      resolvedBy: d.resolvedBy,
      confidence: d.confidence,
    })),
    orders: e.orders.map((o): ChartOrder => ({
      id: o.id,
      kind: o.kind,
      name: o.name,
      instructions: o.instructions,
      dosage: o.dosage,
      frequency: o.frequency,
      durationDays: o.durationDays,
      quantity: o.quantity,
      unit: o.unit,
      status: o.status,
      labRequestId: o.labRequest?.id ?? null,
      labRequestStatus: o.labRequest?.status ?? null,
      labResults: (o.labRequest?.tests ?? []).map((tr) => ({
        testName: tr.testName,
        resultValue: tr.resultValue,
        unit: tr.unit,
        isAbnormal: tr.isAbnormal,
      })),
      imagingRequestId: o.imagingRequest?.id ?? null,
      imagingRequestStatus: o.imagingRequest?.status ?? null,
      imagingModality: o.imagingRequest?.modality ?? null,
      imagingFindings: o.imagingRequest?.findings ?? null,
      imagingImpression: o.imagingRequest?.impression ?? null,
      dispensedAt: o.dispensedAt?.toISOString() ?? null,
      drugCatalogId: o.drugCatalogId,
      genericName: o.genericName,
      brandName: o.brandName,
      strength: o.strength,
      dosageForm: o.dosageForm,
      route: o.route,
      dose: o.dose === null ? null : Number(o.dose),
      doseUnit: o.doseUnit,
      frequencyCode: o.frequencyCode,
      startDate: o.startDate?.toISOString() ?? null,
      endDate: o.endDate?.toISOString() ?? null,
      refills: o.refills,
      dispenseAsWritten: o.dispenseAsWritten,
      clinicalIndication: o.clinicalIndication,
      prescriptionStatus: o.prescriptionStatus,
      priority: o.priority,
    })),
  };
}