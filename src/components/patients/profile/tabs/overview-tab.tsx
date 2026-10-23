import {
  CalendarDays,
  FolderOpen,
  Pill,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Patient } from "@/lib/generated/prisma/client";
import type {
  loadOverview,
  ProfileCounts,
} from "@/lib/patient-profile/queries";
import { calcAge, displayName, formatDate, initials } from "@/lib/patient";
import { fmtDate, fmtMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileEmpty } from "@/components/patients/profile/profile-records";

type OverviewData = Awaited<ReturnType<typeof loadOverview>>;

export async function OverviewTab({
  patient,
  data,
  counts,
  locale,
}: {
  patient: Patient;
  data: OverviewData;
  counts: ProfileCounts;
  locale: string;
}) {
  const t = await getTranslations("patients");
  const age = calcAge(patient.birthDate);

  const stats = [
    { label: t("statVisits"), value: String(data.visitCount), icon: Stethoscope },
    { label: t("statAppointments"), value: String(counts.appointments ?? 0), icon: CalendarDays },
    { label: t("statMedications"), value: String(counts.medications ?? 0), icon: Pill },
    { label: t("statAllergies"), value: String(counts.allergies ?? 0), icon: TriangleAlert },
    { label: t("statDocuments"), value: String(counts.documents ?? 0), icon: FolderOpen },
  ];

  return (
    <div className="flex flex-col gap-4">
      {data.alerts.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-destructive" aria-hidden />
            <p className="text-sm font-semibold text-destructive">
              {t("allergyAlertTitle")}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.alerts.map((alert) => (
              <Badge key={alert.id} variant="destructive">
                {alert.allergen}
                {" · "}
                {t(`severity_${alert.severity}`)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex flex-col gap-1 pt-6">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="size-3.5" aria-hidden />
                  {stat.label}
                </span>
                <span className="text-xl font-semibold tabular-nums">
                  {stat.value}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("lastVisit")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.lastEncounter ? (
              <Link
                href={`/encounters/${data.lastEncounter.id}`}
                className="flex flex-col gap-1 rounded-lg border p-3 text-sm hover:bg-accent/50"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {data.lastEncounter.chiefComplaint ?? t("noChiefComplaint")}
                  </span>
                  <Badge variant="success">{t("completed")}</Badge>
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmtDate(data.lastEncounter.createdAt, locale)}
                  {data.lastEncounter.doctor && ` · ${data.lastEncounter.doctor.name}`}
                </span>
              </Link>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("noVisits")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("nextAppointment")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.nextAppointment ? (
              <Link
                href={`/appointments/${data.nextAppointment.id}`}
                className="flex flex-col gap-1 rounded-lg border p-3 text-sm hover:bg-accent/50"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {t(`appointmentType_${data.nextAppointment.type}`)}
                  </span>
                  <Badge variant="warning">{t("scheduled")}</Badge>
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmtDate(data.nextAppointment.startTime, locale)}
                  {data.nextAppointment.doctor &&
                    ` · ${data.nextAppointment.doctor.name}`}
                </span>
              </Link>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("noUpcomingAppointments")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">{t("recentVisits")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent.length === 0 ? (
              <ProfileEmpty icon={Stethoscope} title={t("noVisits")} />
            ) : (
              <div className="overflow-hidden rounded-lg border">
                {data.recent.map((visit, index) => (
                  <Link
                    key={visit.id}
                    href={`/encounters/${visit.id}`}
                    className={`flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent/50 ${
                      index < data.recent.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <span className="flex-1 font-medium">
                      {visit.chiefComplaint ?? t("noChiefComplaint")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {visit._count.diagnoses} {t("diagnoses")} ·{" "}
                      {visit._count.orders} {t("orders")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(visit.createdAt, locale)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("accountSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{t("invoicedTotal")}</span>
              <span className="font-medium tabular-nums">
                {fmtMoney(data.billing.total)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{t("invoicedPaid")}</span>
              <span className="font-medium tabular-nums">
                {fmtMoney(data.billing.paid)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 border-t pt-3 text-sm">
              <span className="font-medium">{t("outstandingBalance")}</span>
              <span
                className={`font-semibold tabular-nums ${
                  data.billing.balance > 0 ? "text-destructive" : "text-success"
                }`}
              >
                {fmtMoney(data.billing.balance)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3 border-t pt-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                {initials(patient)}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {displayName(patient, locale)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("gender")}:{" "}
                  {t(patient.gender === "FEMALE" ? "female" : "male")}
                  {age !== null && ` · ${t("age")}: ${age}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("dateOfBirth")}: {formatDate(patient.birthDate, locale) || "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailCard title={t("personalInfo")}>
          <Field label={t("dateOfBirth")} value={formatDate(patient.birthDate, locale)} />
          <Field label={t("gender")} value={t(patient.gender === "FEMALE" ? "female" : "male")} />
          <Field label={t("nationalId")} value={patient.nationalId ?? undefined} />
          <Field
            label={t("city")}
            value={patient.city ? t(`city_${patient.city}`) : undefined}
          />
        </DetailCard>
        <DetailCard title={t("contactInfo")}>
          <Field
            label={t("phone")}
            value={patient.phone && <span dir="ltr">{patient.phone}</span>}
          />
          <Field
            label={t("phone2")}
            value={patient.phone2 && <span dir="ltr">{patient.phone2}</span>}
          />
        </DetailCard>
        <DetailCard title={t("clinicalInfo")}>
          <Field
            label={t("registeredAt")}
            value={formatDate(patient.createdAt, locale)}
          />
        </DetailCard>
      </div>

      {patient.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
            {patient.notes}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

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