import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { PatientVisitForm } from "@/components/patients/patient-visit-form";

export default async function PatientPrintFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("patients:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("patients");
  const clinicId = user.currentClinicId ?? "";

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId },
  });
  if (!patient) notFound();

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { nameAr: true, nameEn: true },
  });

  const visit = await prisma.visit.findFirst({
    where: { patientId: id, clinicId },
    orderBy: { arrivedAt: "desc" },
    select: {
      type: true,
      priority: true,
      referralSource: true,
      reason: true,
      notes: true,
      arrivedAt: true,
    },
  });

  return (
    <PatientVisitForm
      clinicName={(locale === "ar" ? clinic?.nameAr : clinic?.nameEn) ?? ""}
      patientId={patient.id}
      visit={
        visit
          ? {
              type: visit.type,
              priority: visit.priority,
              referralSource: visit.referralSource,
              reason: visit.reason ?? "",
              notes: visit.notes ?? "",
            }
          : null
      }
      initial={{
        mrn: patient.mrn,
        firstName: patient.firstNameAr,
        secondName: patient.secondNameAr ?? "",
        familyName: patient.lastNameAr,
        gender: t(patient.gender === "FEMALE" ? "female" : "male"),
        birthDate: patient.birthDate ? patient.birthDate.toISOString().slice(0, 10) : "",
        city: patient.city ? t(`city_${patient.city}`) : "",
        phone: patient.phone ?? "",
        alternatePhone: patient.phone2 ?? "",
        address: patient.address ?? "",
        price: patient.price ? String(patient.price) : "",
        visitDate: visit ? visit.arrivedAt.toISOString().slice(0, 10) : "",
      }}
    />
  );
}
