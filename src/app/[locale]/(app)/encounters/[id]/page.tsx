import { Stethoscope, ReceiptText } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { EncounterChart } from "@/components/encounters/encounter-chart";
import { serializeEncounter } from "@/components/encounters/serialize";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function EncounterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("encounters:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("encounters");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "encounters:write");
  const canSign = await can(user, "encounters:sign");
  const canPrescribe = await can(user, "pharmacy:prescribe");
  const canBill = await can(user, "billing:write");
  const tb = await getTranslations("billing");

  const encounter = await prisma.encounter.findFirst({
    where: { id, clinicId },
    include: {
      patient: true,
      doctor: { select: { name: true } },
      department: { select: { nameAr: true, nameEn: true } },
      diagnoses: true,
      attachments: { orderBy: { createdAt: "desc" } },
      orders: {
        include: {
          labRequest: { select: { id: true } },
          imagingRequest: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!encounter) notFound();

  const labTests = await prisma.labTest.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, nameAr: true, nameEn: true, code: true },
    orderBy: { code: "asc" },
  });

  const medications = canPrescribe
    ? await prisma.medication.findMany({
        where: { clinicId, isActive: true },
        select: {
          id: true,
          code: true,
          genericName: true,
          brandName: true,
          strength: true,
          strengthUnit: true,
          form: true,
          route: true,
        },
        orderBy: { genericName: "asc" },
      })
    : [];

  const rxRows = await prisma.prescription.findMany({
    where: { clinicId, encounterId: encounter.id },
    include: {
      items: {
        select: {
          id: true,
          medicationName: true,
          dosage: true,
          frequency: true,
          quantity: true,
          unit: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const chart = serializeEncounter(encounter);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={displayName(encounter.patient, locale)}
        icon={Stethoscope}
        description={`${encounter.patient.mrn} · ${t("visit")}`}
        actions={
          canBill ? (
            <Button asChild size="sm">
              <Link href={`/billing/new?patient=${encounter.patientId}`}>
                <ReceiptText />
                {tb("fromEncounter")}
              </Link>
            </Button>
          ) : undefined
        }
      />
      <EncounterChart
        encounter={chart}
        canWrite={canWrite}
        canSign={canSign}
        canPrescribe={canPrescribe}
        labTests={labTests.map((lt) => ({
          id: lt.id,
          label: `${lt.code} — ${lt.nameAr || lt.nameEn}`,
        }))}
        medications={medications.map((m) => ({
          id: m.id,
          code: m.code,
          genericName: m.genericName,
          brandName: m.brandName,
          strength: m.strength,
          strengthUnit: m.strengthUnit,
          form: m.form,
          route: m.route,
        }))}
        prescriptions={rxRows.map((rx) => ({
          id: rx.id,
          prescriptionNo: rx.prescriptionNo,
          status: rx.status,
          items: rx.items.map((it) => ({
            id: it.id,
            medicationName: it.medicationName,
            dosage: it.dosage,
            frequency: it.frequency,
            quantity: it.quantity.toString(),
            unit: it.unit,
          })),
        }))}
      />
    </div>
  );
}