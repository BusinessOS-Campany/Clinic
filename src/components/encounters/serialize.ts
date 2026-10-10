import type { ChartEncounter, ChartOrder } from "@/components/encounters/encounter-chart";
import type { Prisma } from "@/lib/generated/prisma/client";

type EncounterFull = Prisma.EncounterGetPayload<{
  include: {
    patient: true;
    doctor: { select: { name: true } };
    department: { select: { nameAr: true; nameEn: true } };
    diagnoses: true;
    orders: { include: { labRequest: { select: { id: true } }; imagingRequest: { select: { id: true } } } };
    attachments: true;
  };
}>;

export function serializeEncounter(e: EncounterFull): ChartEncounter {
  return {
    id: e.id,
    encounterNo: e.encounterNo,
    status: e.status,
    noteStatus: e.noteStatus,
    appointmentId: e.appointmentId,
    patientId: e.patientId,
    patientName: [e.patient.firstNameAr, e.patient.secondNameAr, e.patient.lastNameAr]
      .filter(Boolean)
      .join(" "),
    mrn: e.patient.mrn,
    doctorName: e.doctor?.name ?? null,
    departmentName: e.department
      ? `${e.department.nameAr} · ${e.department.nameEn}`
      : null,
    startedAt: e.startedAt?.toISOString() ?? null,
    completedAt: e.completedAt?.toISOString() ?? null,
    checkedInAt: e.checkedInAt?.toISOString() ?? null,
    signedAt: e.signedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    visitType: e.visitType,
    triageLevel: e.triageLevel,
    triageNotes: e.triageNotes,
    chiefComplaint: e.chiefComplaint,
    hpi: e.hpi,
    reviewOfSystems: e.reviewOfSystems,
    physicalExamination: e.physicalExamination,
    subjective: e.subjective,
    objective: e.objective,
    assessment: e.assessment,
    plan: e.plan,
    patientInstructions: e.patientInstructions,
    followUpPlan: e.followUpPlan,
    followUpDate: e.followUpDate?.toISOString() ?? null,
    referralSource: e.referralSource,
    referralNotes: e.referralNotes,
    temperature: e.temperature === null ? null : Number(e.temperature),
    pulse: e.pulse,
    respRate: e.respRate,
    bpSystolic: e.bpSystolic,
    bpDiastolic: e.bpDiastolic,
    spO2: e.spO2,
    height: e.height === null ? null : Number(e.height),
    weight: e.weight === null ? null : Number(e.weight),
    diagnoses: e.diagnoses.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      isPrimary: d.isPrimary,
    })),
    orders: e.orders.map<ChartOrder>((o) => ({
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
      imagingRequestId: o.imagingRequest?.id ?? null,
      dispensedAt: o.dispensedAt?.toISOString() ?? null,
    })),
    attachments: e.attachments.map((a) => ({
      id: a.id,
      title: a.title,
      fileName: a.fileName,
      url: a.url,
      notes: a.notes,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}