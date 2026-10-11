import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { dateInputFrom } from "@/lib/patient";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PatientForm } from "@/components/patients/patient-form";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("patients:write");
  const { id } = await params;
  const t = await getTranslations("patients");

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: user.currentClinicId ?? "" },
  });
  if (!patient) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("editPatient")} icon={Pencil} description={patient.mrn} />
      <Card>
        <CardContent className="pt-2">
          <PatientForm
            patientId={patient.id}
            initial={{
              firstNameAr: patient.firstNameAr,
              secondNameAr: patient.secondNameAr ?? undefined,
              lastNameAr: patient.lastNameAr,
              gender: patient.gender,
              birthDate: dateInputFrom(patient),
              phone: patient.phone ?? undefined,
              phone2: patient.phone2 ?? undefined,
              nationalId: patient.nationalId ?? undefined,
              price: patient.price.toNumber(),
              city: patient.city ?? undefined,
notes: patient.notes ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}