import { Stethoscope, ReceiptText, FolderOpen, Printer } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { loadEncounterSummary } from "@/lib/encounter-summary";
import { EncounterChart } from "@/components/encounters/encounter-chart";
import { serializeEncounter } from "@/components/encounters/serialize";
import { PatientSummaryHeader } from "@/components/encounters/patient-summary-header";
import { ResultsReviewBanner } from "@/components/encounters/results-review-banner";
import { VisitClosure } from "@/components/encounters/visit-closure";
import { VisitPanel } from "@/components/encounters/visit-panel";
import { PatientInfoCard } from "@/components/encounters/patient-info-card";
import { EncounterInvoiceButton } from "@/components/billing/encounter-invoice-button";
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
  const canAmend = await can(user, "encounters:amend");
  const canBill = await can(user, "billing:write");
  const canViewPatient = await can(user, "patients:read");
  const tp = await getTranslations("patients");
  const tb = await getTranslations("billing");
  const tv = await getTranslations("visits");

  const encounter = await prisma.encounter.findFirst({
    where: { id, clinicId },
    include: {
      patient: true,
      doctor: { select: { name: true } },
      diagnoses: true,
      orders: {
        include: {
          labRequest: {
            select: {
              id: true,
              status: true,
              tests: {
                where: { status: { in: ["RESULTED", "VERIFIED"] } },
                select: { testName: true, resultValue: true, unit: true, isAbnormal: true },
                orderBy: { createdAt: "asc" },
              },
            },
          },
          imagingRequest: {
            select: { id: true, status: true, modality: true, findings: true, impression: true },
          },
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

  const visit = await prisma.visit.findFirst({
    where: { encounterId: id, clinicId },
    include: {
      registeredBy: { select: { name: true, nameAr: true } },
      doctor: { select: { name: true } },
      department: { select: { nameAr: true, nameEn: true } },
      queueEntries: {
        where: { status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          queue: { select: { nameAr: true, nameEn: true, kind: true } },
        },
      },
    },
  });

  const canManageVisit = canWrite || (await can(user, "queue:write"));

  const visitPanel = visit
    ? {
        id: visit.id,
        visitNumber: visit.visitNumber,
        mrn: visit.mrn,
        arrivedAt: visit.arrivedAt,
        status: visit.status,
        type: visit.type,
        priority: visit.priority,
        source: visit.source,
        referralSource: visit.referralSource,
        reason: visit.reason,
        chiefComplaint: visit.chiefComplaint,
        symptomDuration: visit.symptomDurationValue
          ? `${visit.symptomDurationValue} ${tv(
              `durationUnit_${visit.symptomDurationUnit ?? "DAYS"}`,
            )}`
          : null,
        registrarName: visit.registeredBy
          ? visit.registeredBy.nameAr || visit.registeredBy.name
          : null,
        doctorName: visit.doctor?.name ?? null,
        departmentName: visit.department
          ? locale === "ar"
            ? visit.department.nameAr
            : visit.department.nameEn
          : null,
        currentQueue: (visit.queueEntries[0]?.queue.kind === "TRIAGE"
          ? "TRIAGE"
          : "DOCTOR") as "TRIAGE" | "DOCTOR",
        queueName: visit.queueEntries[0]
          ? locale === "ar"
            ? visit.queueEntries[0].queue.nameAr
            : visit.queueEntries[0].queue.nameEn
          : "",
        position: visit.queueEntries[0]?.position ?? 0,
        queueStatus: visit.queueEntries[0]?.status ?? "WAITING",
      }
    : null;

  const chart = serializeEncounter(encounter);
  const summary = await loadEncounterSummary(clinicId, encounter.patientId);
  const hasPendingOrders = encounter.orders.some((o) => o.status === "PENDING");
  const encounterClosed =
    encounter.status === "COMPLETED" || encounter.status === "SIGNED" || encounter.status === "AMENDED";
  const encounterInvoice = await prisma.invoice.findFirst({
    where: { encounterId: id, clinicId },
    select: { id: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={displayName(encounter.patient, locale)}
        icon={Stethoscope}
        description={`${encounter.patient.mrn} · ${t("visit")}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/encounters/${id}/report`} target="_blank">
                <Printer />
                {t("printReport")}
              </Link>
            </Button>
            {canViewPatient ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/patients/${encounter.patientId}`}>
                  <FolderOpen />
                  {tp("profile")}
                </Link>
              </Button>
            ) : null}
            <EncounterInvoiceButton
              encounterId={id}
              hasInvoice={!!encounterInvoice}
              invoiceId={encounterInvoice?.id ?? null}
              canBill={canBill}
            />
            {canBill ? (
              <Button asChild size="sm">
                <Link href={`/billing/new?patient=${encounter.patientId}`}>
                  <ReceiptText />
                  {tb("fromEncounter")}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />
      <PatientSummaryHeader
        patientName={displayName(encounter.patient, locale)}
        mrn={encounter.patient.mrn}
        photo={encounter.patient.photo}
        birthDate={encounter.patient.birthDate}
        bloodType={encounter.patient.bloodType}
        insuranceCompany={encounter.patient.insuranceCompany}
        insurancePolicyNumber={encounter.patient.insurancePolicyNumber}
        summary={summary}
        locale={locale}
      />
      {visitPanel && (
        <VisitPanel visit={visitPanel} locale={locale} canManage={canManageVisit} />
      )}
      {visit?.status === "AWAITING_RESULTS" && (
        <ResultsReviewBanner encounterId={id} show />
      )}
      <PatientInfoCard
        patient={{
          gender: encounter.patient.gender,
          birthDate: encounter.patient.birthDate,
          phone: encounter.patient.phone,
          phone2: encounter.patient.phone2,
          city: encounter.patient.city,
          price: encounter.patient.price,
          notes: encounter.patient.notes,
        }}
        locale={locale}
      />
      <EncounterChart
        encounter={chart}
        canWrite={canWrite}
        canSign={canSign}
        canAmend={canAmend}
        labTests={labTests.map((lt) => ({
          id: lt.id,
          label: `${lt.code} — ${lt.nameAr || lt.nameEn}`,
        }))}
      />
      {!encounterClosed && (
        <div className="flex justify-end">
          <VisitClosure
            encounterId={id}
            readOnly={!canWrite}
            hasPendingOrders={hasPendingOrders}
          />
        </div>
      )}
    </div>
  );
}