import { Mail, Pencil, Phone, Stethoscope, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { calcAge, displayName, formatDate, initials } from "@/lib/patient";
import { PageHeader } from "@/components/layout/page-header";
import { RecordPatientView } from "@/components/patients/record-patient-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MedicalHistoryTab,
  type MedicalHistoryRow,
} from "@/components/patients/medical-history-tab";
import {
  DiagnosisTab,
  type DiagnosisRow,
} from "@/components/patients/diagnosis-tab";
import {
  AllergiesTab,
  type AllergyRow,
} from "@/components/patients/allergies-tab";
import {
  VitalSignsTab,
  type VitalSignRow,
} from "@/components/patients/vital-signs-tab";
import {
  AuditSection,
  AppointmentsTable,
  ClinicalNotesSection,
  ImagingSection,
  InvoicesSection,
  LaboratorySection,
  OrdersSection,
} from "@/components/patients/read-sections";
import {
  DocumentsTab,
  type DocumentRow,
} from "@/components/patients/documents-tab";
import {
  ReferralsTab,
  type ReferralRow,
} from "@/components/patients/referrals-tab";
import {
  ConsentFormsTab,
  type ConsentFormRow,
} from "@/components/patients/consent-forms-tab";

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">
        {value ?? <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("patients:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("patients");
  const tp = await getTranslations("profile");
  const canWrite = await can(user, "patients:write");
  const canDxWrite = await can(user, "diagnoses:write");
  const canDxManage = await can(user, "diagnoses:manage");
  const clinicId = user.currentClinicId ?? "";

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId },
  });
  if (!patient) notFound();

  const [creator, histories, allergies, vitals] = await Promise.all([
    patient.createdBy && patient.createdBy !== user.id
      ? prisma.user.findUnique({
          where: { id: patient.createdBy },
          select: { name: true },
        })
      : null,
    prisma.medicalHistory.findMany({
      where: { patientId: id, clinicId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.allergy.findMany({
      where: { patientId: id, clinicId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vitalSign.findMany({
      where: { patientId: id, clinicId },
      orderBy: { measuredAt: "desc" },
      take: 100,
    }),
  ]);

  const [
    diagnoses,
    appointments,
    labResults,
    imaging,
    orders,
    encounters,
    invoices,
    auditLogs,
  ] = await Promise.all([
    prisma.diagnosis.findMany({
      where: { clinicId, patientId: id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.appointment.findMany({
      where: { patientId: id, clinicId },
      include: {
        doctor: { select: { name: true } },
        department: { select: { nameAr: true, nameEn: true } },
      },
      orderBy: { startTime: "desc" },
      take: 100,
    }),
    prisma.labResult.findMany({
      where: { request: { patientId: id, clinicId } },
      include: { request: { select: { createdAt: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.imagingRequest.findMany({
      where: { patientId: id, clinicId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.medicalOrder.findMany({
      where: { patientId: id, clinicId, kind: { in: ["MEDICATION", "OTHER"] } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.encounter.findMany({
      where: { patientId: id, clinicId },
      include: { doctor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.invoice.findMany({
      where: { patientId: id, clinicId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.auditLog.findMany({
      where: { entity: "Patient", entityId: id },
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const [documents, referrals, consentForms] = await Promise.all([
    prisma.patientDocument.findMany({
      where: { patientId: id, clinicId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.referral.findMany({
      where: { patientId: id, clinicId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.consentForm.findMany({
      where: { patientId: id, clinicId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const actorIds = [
    ...new Set(
      [
        ...histories.map((h) => h.reviewedBy),
        ...diagnoses.map((d) => d.updatedBy),
      ].filter((v): v is string => Boolean(v)),
    ),
  ];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(actors.map((a) => [a.id, a.name]));

  const historyRows: MedicalHistoryRow[] = histories.map((h) => ({
    id: h.id,
    category: h.category,
    condition: h.condition,
    detail: h.detail,
    medication: h.medication,
    diagnosis: h.diagnosis,
    notes: h.notes,
    startedOn: h.startedOn ? h.startedOn.toISOString() : null,
    resolvedOn: h.resolvedOn ? h.resolvedOn.toISOString() : null,
    status: h.status,
    verification: h.verification,
    source: h.source,
    sourceName: h.sourceName,
    isAlert: h.isAlert,
    alertNote: h.alertNote,
    reviewedByName: h.reviewedBy ? nameById.get(h.reviewedBy) ?? null : null,
    reviewedAt: h.reviewedAt ? h.reviewedAt.toISOString() : null,
    updatedAt: h.updatedAt.toISOString(),
  }));

  const allergyRows: AllergyRow[] = allergies.map((a) => ({
    id: a.id,
    allergen: a.allergen,
    reaction: a.reaction,
    severity: a.severity,
    notes: a.notes,
  }));

  const vitalRows: VitalSignRow[] = vitals.map((v) => ({
    id: v.id,
    measuredAt: v.measuredAt.toISOString(),
    temperature: v.temperature != null ? String(v.temperature) : null,
    pulse: v.pulse,
    respRate: v.respRate,
    bpSystolic: v.bpSystolic,
    bpDiastolic: v.bpDiastolic,
    spO2: v.spO2,
    height: v.height != null ? String(v.height) : null,
    weight: v.weight != null ? String(v.weight) : null,
    bmi: v.bmi != null ? String(v.bmi) : null,
    notes: v.notes,
  }));

  const deptName = (d: { nameAr: string; nameEn: string } | null) =>
    d ? (locale === "ar" ? d.nameAr : d.nameEn) : null;

  const diagnosisRows: DiagnosisRow[] = diagnoses.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    codeSystem: d.codeSystem,
    description: d.description,
    type: d.type,
    status: d.status,
    symptoms: d.symptoms,
    clinicalFindings: d.clinicalFindings,
    supportiveResults: d.supportiveResults,
    diagnosedOn: d.diagnosedOn ? d.diagnosedOn.toISOString() : null,
    diagnosedBy: d.diagnosedBy,
    treatmentPlan: d.treatmentPlan,
    followUp: d.followUp,
    notes: d.notes,
    isChronic: d.isChronic,
    updatedByName: d.updatedBy ? nameById.get(d.updatedBy) ?? null : null,
    updatedAt: d.updatedAt.toISOString(),
  }));

  const appointmentRows = appointments.map((a) => ({
    id: a.id,
    startTime: a.startTime,
    type: a.type,
    status: a.status,
    doctor: a.doctor?.name ?? null,
    department: deptName(a.department),
  }));

  const labRows = labResults.map((r) => ({
    id: r.id,
    testName: r.testName,
    resultValue: r.resultValue,
    unit: r.unit,
    referenceRange: r.referenceRange,
    isAbnormal: r.isAbnormal,
    status: r.status,
    date: r.request.createdAt,
  }));

  const imagingRows = imaging.map((r) => ({
    id: r.id,
    modality: r.modality,
    status: r.status,
    findings: r.findings,
    date: r.createdAt,
  }));

  const toOrderRow = (o: (typeof orders)[number]) => ({
    id: o.id,
    name: o.name,
    dosage: o.dosage,
    frequency: o.frequency,
    durationDays: o.durationDays,
    quantity: o.quantity,
    unit: o.unit,
    status: o.status,
    date: o.createdAt,
  });
  const orderRow = (o: (typeof orders)[number]) => ({
    id: o.id,
    name: o.name,
    dosage: o.dosage,
    frequency: o.frequency,
    durationDays: o.durationDays,
    status: o.status,
    date: o.createdAt,
    quantity: o.quantity,
    unit: o.unit,
  });
  const medicationRows = orders
    .filter((o) => o.kind === "MEDICATION")
    .map(orderRow);
  const treatmentRows = orders.filter((o) => o.kind === "OTHER").map(orderRow);

  const clinicalNoteRows = encounters.map((e) => ({
    id: e.id,
    date: e.createdAt,
    doctor: e.doctor?.name ?? null,
    subjective: e.subjective,
    objective: e.objective,
    assessment: e.assessment,
    plan: e.plan,
  }));

  const invoiceRows = invoices.map((inv) => {
    const total = Number(inv.total);
    const paid = Number(inv.paidAmount);
    return {
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      status: inv.status,
      total: total.toFixed(2),
      paid: paid.toFixed(2),
      balance: (total - paid).toFixed(2),
      date: inv.createdAt,
    };
  });

  const auditRows = auditLogs.map((l) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    actor: l.actor?.name ?? null,
    date: l.createdAt,
  }));

  const documentRows: DocumentRow[] = documents.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    fileName: d.fileName,
    url: d.url,
    notes: d.notes,
  }));

  const referralRows: ReferralRow[] = referrals.map((r) => ({
    id: r.id,
    referredTo: r.referredTo,
    reason: r.reason,
    status: r.status,
    notes: r.notes,
  }));

  const consentRows: ConsentFormRow[] = consentForms.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    status: c.status,
    signedBy: c.signedBy,
    content: c.content,
    notes: c.notes,
  }));

  const labels = {
    empty: tp("empty"),
    date: tp("date"),
    diagnoses: tp("diagnoses"),
    code: tp("code"),
    primary: tp("primary"),
    visitType: tp("visitType"),
    doctor: tp("doctor"),
    department: tp("department"),
    status: tp("status"),
    result: tp("result"),
    unit: tp("unit"),
    referenceRange: tp("referenceRange"),
    modality: tp("modality"),
    findings: tp("findings"),
    name: tp("name"),
    dosage: tp("dosage"),
    frequency: tp("frequency"),
    invoiceNo: tp("invoiceNo"),
    total: tp("total"),
    paid: tp("paid"),
    balance: tp("balance"),
    action: tp("action"),
    actor: tp("actor"),
    subjective: tp("subjective"),
    objective: tp("objective"),
    assessment: tp("assessment"),
    plan: tp("plan"),
  };

  const age = calcAge(patient.birthDate);
  const name = displayName(patient, locale);

  return (
    <div className="flex flex-col gap-6">
      <RecordPatientView patientId={patient.id} />
      <PageHeader
        title={name}
        icon={Users}
        description={`${t("patientId")}: ${patient.patientId} · ${t("mrn")}: ${patient.mrn}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/patients/${patient.id}/chart`}>
              <Stethoscope />
              {t("chart")}
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="overview">{tp("overview")}</TabsTrigger>
          <TabsTrigger value="medicalHistory">{tp("medicalHistory")}</TabsTrigger>
          <TabsTrigger value="diagnoses">{tp("diagnoses")}</TabsTrigger>
          <TabsTrigger value="allergies">{tp("allergies")}</TabsTrigger>
          <TabsTrigger value="currentMedications">
            {tp("currentMedications")}
          </TabsTrigger>
          <TabsTrigger value="prescriptions">{tp("prescriptions")}</TabsTrigger>
          <TabsTrigger value="appointments">{tp("appointments")}</TabsTrigger>
          <TabsTrigger value="laboratory">{tp("laboratory")}</TabsTrigger>
          <TabsTrigger value="imaging">{tp("imaging")}</TabsTrigger>
          <TabsTrigger value="treatments">{tp("treatments")}</TabsTrigger>
          <TabsTrigger value="clinicalNotes">{tp("clinicalNotes")}</TabsTrigger>
          <TabsTrigger value="vitalSigns">{tp("vitalSigns")}</TabsTrigger>
          <TabsTrigger value="invoices">{tp("invoices")}</TabsTrigger>
          <TabsTrigger value="followUps">{tp("followUps")}</TabsTrigger>
          <TabsTrigger value="referrals">{tp("referrals")}</TabsTrigger>
          <TabsTrigger value="documents">{tp("documents")}</TabsTrigger>
          <TabsTrigger value="consentForms">{tp("consentForms")}</TabsTrigger>
          <TabsTrigger value="auditHistory">{tp("auditHistory")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                    {initials(patient)}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {t("patientId")}: {patient.patientId} · {t("mrn")}: {patient.mrn}
                      </span>
                      <Badge variant={patient.status === "ACTIVE" ? "success" : "secondary"}>
                        {t(patient.status === "ACTIVE" ? "statusActive" : "statusInactive")}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("gender")}: {t(patient.gender === "FEMALE" ? "female" : "male")}
                      {age !== null && ` · ${t("age")}: ${age}`}
                    </div>
                  </div>
                </div>
                {canWrite && (
                  <Button asChild variant="outline">
                    <Link href={`/patients/${patient.id}/edit`}>
                      <Pencil />
                      {t("edit")}
                    </Link>
                  </Button>
                )}
              </div>

              <div className="grid gap-6 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="px-0">
                    <CardTitle className="text-sm">{t("personalInfo")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 px-0 text-start">
                    <Field label={t("dateOfBirth")} value={formatDate(patient.birthDate, locale)} />
                    <Field label={t("gender")} value={t(patient.gender === "FEMALE" ? "female" : "male")} />
                    <Field label={t("nationalId")} value={patient.nationalId ?? undefined} />
                    <Field
                      label={t("maritalStatus")}
                      value={patient.maritalStatus ? t(`marital_${patient.maritalStatus}`) : undefined}
                    />
                  </CardContent>
                </Card>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="px-0">
                    <CardTitle className="text-sm">{t("contactInfo")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 px-0 text-start">
                    <Field
                      label={t("phone")}
                      value={patient.phone && <span dir="ltr">{patient.phone}</span>}
                    />
                    <Field
                      label={t("phone2")}
                      value={patient.phone2 && <span dir="ltr">{patient.phone2}</span>}
                    />
                    <Field
                      label={t("email")}
                      value={patient.email && <span dir="ltr">{patient.email}</span>}
                    />
                    <Field label={t("address")} value={patient.address ?? undefined} />
                  </CardContent>
                </Card>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="px-0">
                    <CardTitle className="text-sm">{t("clinicalInfo")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 px-0 text-start">
                    <Field
                      label={t("bloodGroup")}
                      value={patient.bloodType ? t(`bloodType_${patient.bloodType}`) : undefined}
                    />
                    <Field label={t("insuranceCompany")} value={patient.insuranceCompany ?? undefined} />
                    <Field
                      label={t("insurancePolicyNumber")}
                      value={patient.insurancePolicyNumber ?? undefined}
                    />
                  </CardContent>
                </Card>
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="px-0">
                    <CardTitle className="text-sm">{t("emergencyContact")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 px-0 text-start">
                    <Field label={t("emergencyName")} value={patient.emergencyContactName ?? undefined} />
                    <Field
                      label={t("emergencyPhone")}
                      value={
                        patient.emergencyContactPhone && (
                          <span dir="ltr">{patient.emergencyContactPhone}</span>
                        )
                      }
                    />
                  </CardContent>
                </Card>
              </div>

              {patient.notes && (
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="px-0">
                    <CardTitle className="text-sm">{t("notes")}</CardTitle>
                  </CardHeader>
                  <CardContent className="whitespace-pre-wrap px-0 text-sm text-muted-foreground">
                    {patient.notes}
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="px-0">
                  <CardTitle className="text-sm">{t("registeredAt")}</CardTitle>
                </CardHeader>
                <CardContent className="px-0 text-sm text-muted-foreground">
                  {formatDate(patient.createdAt, locale)}
                  {creator && (
                    <span>
                      {" · "}
                      {t("createdBy")}: {creator.name}
                    </span>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medicalHistory">
          <MedicalHistoryTab
            patientId={patient.id}
            rows={historyRows}
            canWrite={canWrite}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="allergies">
          <AllergiesTab
            patientId={patient.id}
            rows={allergyRows}
            canWrite={canWrite}
          />
        </TabsContent>

        <TabsContent value="diagnoses">
          <DiagnosisTab
            patientId={patient.id}
            rows={diagnosisRows}
            canWrite={canDxWrite}
            canManage={canDxManage}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="currentMedications">
          <OrdersSection
            rows={medicationRows.filter((o) => o.status !== "COMPLETED")}
            locale={locale}
            labels={labels}
          />
        </TabsContent>

        <TabsContent value="prescriptions">
          <OrdersSection
            rows={medicationRows.filter((o) => o.status === "COMPLETED")}
            locale={locale}
            labels={labels}
          />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsTable rows={appointmentRows} locale={locale} labels={labels} />
        </TabsContent>

        <TabsContent value="followUps">
          <AppointmentsTable
            rows={appointmentRows.filter((_, i) => appointments[i]?.type === "FOLLOW_UP")}
            locale={locale}
            labels={labels}
          />
        </TabsContent>

        <TabsContent value="laboratory">
          <LaboratorySection rows={labRows} locale={locale} labels={labels} />
        </TabsContent>

        <TabsContent value="imaging">
          <ImagingSection rows={imagingRows} locale={locale} labels={labels} />
        </TabsContent>

        <TabsContent value="treatments">
          <OrdersSection rows={treatmentRows} locale={locale} labels={labels} />
        </TabsContent>

        <TabsContent value="clinicalNotes">
          <ClinicalNotesSection
            rows={clinicalNoteRows}
            locale={locale}
            labels={labels}
          />
        </TabsContent>

        <TabsContent value="vitalSigns">
          <VitalSignsTab
            patientId={patient.id}
            rows={vitalRows}
            canWrite={canWrite}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesSection rows={invoiceRows} locale={locale} labels={labels} />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralsTab
            patientId={patient.id}
            rows={referralRows}
            canWrite={canWrite}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab
            patientId={patient.id}
            rows={documentRows}
            canWrite={canWrite}
          />
        </TabsContent>

        <TabsContent value="consentForms">
          <ConsentFormsTab
            patientId={patient.id}
            rows={consentRows}
            canWrite={canWrite}
          />
        </TabsContent>

        <TabsContent value="auditHistory">
          <AuditSection rows={auditRows} locale={locale} labels={labels} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
