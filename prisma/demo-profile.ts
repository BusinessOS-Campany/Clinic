import "dotenv/config";
import { prisma } from "../src/lib/db";

const HISTORY = [
  { type: "MEDICAL", title: "Type 2 diabetes mellitus", occurredAt: "2016-03-10", description: "Diagnosed 2016, managed with oral hypoglycaemics." },
  { type: "SURGICAL", title: "Appendectomy", occurredAt: "2010-07-22", description: "Uncomplicated appendectomy." },
  { type: "FAMILY", title: "Family history of coronary artery disease", occurredAt: null, description: "Father had an MI at 54." },
  { type: "OBSTETRIC", title: "G2P2", occurredAt: "2020-01-15", description: "Two uncomplicated vaginal deliveries." },
  { type: "MEDICAL", title: "Iron deficiency anaemia", occurredAt: "2019-05-02", description: "Low ferritin, responded to oral iron." },
  { type: "MEDICAL", title: "Hypertension", occurredAt: "2012-09-30", description: "Stage 1, on amlodipine." },
  { type: "SOCIAL", title: "Current smoker", occurredAt: null, description: "Around 20 cigarettes a day for 25 years." },
  { type: "SURGICAL", title: "Total knee replacement", occurredAt: "2021-11-08", description: "Right knee, cemented prosthesis." },
  { type: "MEDICAL", title: "Osteoarthritis", occurredAt: "2018-02-14", description: "Bilateral grade 3." },
  { type: "IMMUNIZATION", title: "Full childhood immunisation schedule", occurredAt: "2023-04-11", description: "Verified against the national schedule, up to date." },
] as const;

const ALLERGIES = [
  { allergen: "Penicillin", type: "DRUG", reaction: "Urticaria and facial swelling", severity: "SEVERE", isActive: true },
  { allergen: "Shellfish", type: "FOOD", reaction: "Oral itching", severity: "MILD", isActive: true },
  { allergen: "Sulfa drugs", type: "DRUG", reaction: "Generalised rash", severity: "MODERATE", isActive: false },
  { allergen: "Latex", type: "ENVIRONMENT", reaction: "Contact dermatitis", severity: "MODERATE", isActive: true },
  { allergen: "Dust mite", type: "ENVIRONMENT", reaction: "Wheeze at night", severity: "MILD", isActive: true },
  { allergen: "Ibuprofen", type: "DRUG", reaction: "Gastric irritation", severity: "MILD", isActive: true },
] as const;

const PROCEDURES = [
  { name: "Wound debridement", code: "ICD-9 86.22", category: "Surgical", performedAt: "2024-03-12", provider: "Dr. H. Nasser", status: "COMPLETED", notes: "Left forearm abscess, 40ml pus." },
  { name: "Minor excision biopsy", code: "ICD-9 85.31", category: "Diagnostic", performedAt: "2024-08-05", provider: "Dr. H. Nasser", status: "COMPLETED", notes: "Histology: benign nevus." },
  { name: "Chest physiotherapy", code: null, category: "Therapeutic", performedAt: "2024-01-20", provider: "Dr. S. Baqi", status: "COMPLETED", notes: "Six sessions for recurrent bronchitis." },
  { name: "Echocardiogram", code: "ICD-9 89.52", category: "Diagnostic", performedAt: null, provider: null, status: "PLANNED", notes: "Evaluate LVH from long-standing hypertension." },
  { name: "Intra-articular corticosteroid injection", code: null, category: "Therapeutic", performedAt: "2023-10-04", provider: "Dr. M. Salem", status: "COMPLETED", notes: "Right knee, 40mg triamcinolone." },
] as const;

const DOCUMENTS = [
  { category: "IDENTITY", fileName: "national-id-scan.pdf", mimeType: "application/pdf", notes: "Scanned national ID card." },
  { category: "LABORATORY", fileName: "cbc-2024-08-05.pdf", mimeType: "application/pdf", notes: "Full blood count, requested 2024-08-05." },
  { category: "MEDICAL_REPORT", fileName: "obstetric-summary-2020.pdf", mimeType: "application/pdf", notes: "Antenatal and delivery summary." },
  { category: "IMAGING", fileName: "chest-xray-2024-01-20.jpg", mimeType: "image/jpeg", notes: "PA and lateral views." },
] as const;

const REFERRALS = [
  { type: "EXTERNAL", toFacility: "Al-Kubra Teaching Hospital", toDepartment: "Cardiology", reason: "Persistent chest pain with an abnormal ECG", status: "ACCEPTED", requestedAt: "2024-06-11", respondedAt: "2024-06-13", notes: "ECG forwarded with the referral letter." },
  { type: "INTERNAL", toFacility: null, toDepartment: "Obstetrics", reason: "Antenatal booking", status: "COMPLETED", requestedAt: "2020-01-15", respondedAt: "2020-01-16", notes: null },
  { type: "EXTERNAL", toFacility: "Sanaa Polyclinic", toDepartment: null, reason: "Cardiology opinion for hypertension", status: "PENDING", requestedAt: "2024-09-02", respondedAt: null, notes: null },
  { type: "INTERNAL", toFacility: null, toDepartment: "Orthopaedics", reason: "Knee replacement follow-up", status: "COMPLETED", requestedAt: "2023-10-10", respondedAt: "2023-10-12", notes: null },
] as const;

const day = (value: string | null): Date | null =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

/**
 * Distributes demo records round-robin across whichever demo patients exist, so
 * the seed keeps working when the demo patient set changes. Re-running is safe:
 * every generated table is cleared first.
 */
async function main() {
  const clinic = await prisma.clinic.findFirst({ where: { code: "MAIN" } });
  if (!clinic) throw new Error("MAIN clinic not found");
  const clinicId = clinic.id;

  const patients = await prisma.patient.findMany({
    where: { clinicId },
    orderBy: { mrn: "asc" },
    select: { id: true },
  });
  if (patients.length === 0) throw new Error("No patients found — run demo-patients first");

  await prisma.medicalHistory.deleteMany({ where: { clinicId } });
  await prisma.allergy.deleteMany({ where: { clinicId } });
  await prisma.procedure.deleteMany({ where: { clinicId } });
  await prisma.patientDocument.deleteMany({ where: { clinicId } });
  await prisma.referral.deleteMany({ where: { clinicId } });

  let created = 0;
  const forPatient = (index: number) =>
    patients[index % patients.length]?.id ?? patients[0]!.id;

  for (const [i, item] of HISTORY.entries()) {
    await prisma.medicalHistory.create({
      data: {
        clinicId,
        patientId: forPatient(i),
        type: item.type,
        title: item.title,
        description: item.description,
        occurredAt: day(item.occurredAt),
      },
    });
    created += 1;
  }

  for (const [i, item] of ALLERGIES.entries()) {
    await prisma.allergy.create({
      data: {
        clinicId,
        patientId: forPatient(i),
        allergen: item.allergen,
        type: item.type,
        reaction: item.reaction,
        severity: item.severity,
        isActive: item.isActive,
      },
    });
    created += 1;
  }

  for (const [i, item] of PROCEDURES.entries()) {
    await prisma.procedure.create({
      data: {
        clinicId,
        patientId: forPatient(i),
        name: item.name,
        code: item.code,
        category: item.category,
        performedAt: day(item.performedAt),
        provider: item.provider,
        status: item.status,
        notes: item.notes,
      },
    });
    created += 1;
  }

  for (const [i, item] of DOCUMENTS.entries()) {
    const patientId = forPatient(i);
    const safe = item.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
    await prisma.patientDocument.create({
      data: {
        clinicId,
        patientId,
        category: item.category,
        fileName: item.fileName,
        storageKey: `patients/${patientId}/demo-${safe}`,
        mimeType: item.mimeType,
        sizeBytes: 128000,
        notes: item.notes,
      },
    });
    created += 1;
  }

  for (const [i, item] of REFERRALS.entries()) {
    await prisma.referral.create({
      data: {
        clinicId,
        patientId: forPatient(i),
        type: item.type,
        toFacility: item.toFacility,
        toDepartment: item.toDepartment,
        reason: item.reason,
        status: item.status,
        requestedAt: day(item.requestedAt) ?? new Date(),
        respondedAt: day(item.respondedAt),
        notes: item.notes,
      },
    });
    created += 1;
  }

  console.log(
    `Seeded ${created} patient profile records across ${patients.length} patient(s).`,
  );
}

main().finally(() => prisma.$disconnect());