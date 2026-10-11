import { CalendarClock, Pencil, User } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { PageHeader } from "@/components/layout/page-header";
import { AppointmentStatusActions } from "@/components/appointments/appointment-status-actions";
import { StartVisitButton } from "@/components/encounters/start-visit-button";
import { STATUS_TRANSITIONS } from "@/app/[locale]/(app)/appointments/schema";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VariantProps } from "class-variance-authority";

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

const STATUS_BADGE: Record<
  string,
  NonNullable<VariantProps<typeof badgeVariants>["variant"]>
> = {
  SCHEDULED: "secondary",
  CONFIRMED: "info",
  ARRIVED: "warning",
  IN_SERVICE: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "outline",
};

function toClock(d: Date) {
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("appointments:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("appointments");
  const tc = await getTranslations("common");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "appointments:write");

  const appointment = await prisma.appointment.findFirst({
    where: { id, clinicId },
    include: {
      patient: {
        select: {
          id: true,
          mrn: true,
          firstNameAr: true,
          lastNameAr: true,
          firstNameEn: true,
          lastNameEn: true,
        },
      },
      doctor: { select: { name: true, nameAr: true } },
      department: { select: { nameAr: true, nameEn: true } },
      room: { select: { nameAr: true, nameEn: true } },
    },
  });
  if (!appointment) notFound();

  const patientName = displayName(appointment.patient, locale);
  const doctorName =
    locale === "ar" && appointment.doctor?.nameAr
      ? appointment.doctor.nameAr
      : appointment.doctor?.name;
  const deptName =
    locale === "ar" && appointment.department?.nameAr
      ? appointment.department.nameAr
      : appointment.department?.nameEn;
  const roomName =
    locale === "ar" && appointment.room?.nameAr
      ? appointment.room.nameAr
      : appointment.room?.nameEn;

  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={patientName}
        icon={CalendarClock}
        description={`${dateFmt.format(appointment.startTime)} · ${t("startTime")} ${toClock(appointment.startTime)}`}
        actions={
          <div className="flex items-center gap-2">
            {canWrite && (
              <>
                {appointment.status === "IN_SERVICE" && (
                  <StartVisitButton appointmentId={appointment.id} />
                )}
                <Button asChild variant="outline">
                  <Link href={`/appointments/${appointment.id}/edit`}>
                    <Pencil />
                    {tc("edit")}
                  </Link>
                </Button>
              </>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <User className="size-5 text-primary" />
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{patientName}</span>
                  <Badge variant={STATUS_BADGE[appointment.status] ?? "secondary"}>
                    {t(`status_${appointment.status.toLowerCase()}`)}
                  </Badge>
                </div>
                <Link
                  href={`/patients/${appointment.patient.id}`}
                  className="font-mono text-xs text-muted-foreground hover:underline"
                >
                  {appointment.patient.mrn}
                </Link>
              </div>
            </div>
            <AppointmentStatusActions
              id={appointment.id}
              allowed={STATUS_TRANSITIONS[appointment.status]}
            />
          </div>

          <div className="grid gap-6 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={t("doctor")} value={doctorName} />
            <Field label={t("department")} value={deptName} />
            <Field label={t("room")} value={roomName} />
            <Field
              label={t("duration")}
              value={t(
                `duration_${[15, 30, 45, 60, 90, 120].includes(appointment.durationMinutes) ? appointment.durationMinutes : 30}`,
              )}
            />
            <Field
              label={t("startTime")}
              value={
                <span dir="ltr">
                  {toClock(appointment.startTime)} – {toClock(appointment.endTime)}
                </span>
              }
            />
            <Field label={t("type")} value={t(`type_${appointment.type}`)} />
            <Field label={t("reason")} value={appointment.reason ?? undefined} />
            <Field label={t("notes")} value={appointment.notes ?? undefined} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}