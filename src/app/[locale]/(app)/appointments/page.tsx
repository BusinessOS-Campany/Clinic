import { ArrowLeft, ArrowRight, CalendarClock, Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { addDays, parseISODate, toISODate, weekDates } from "@/lib/dates";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AppointmentWeekGrid } from "@/components/appointments/appointment-week-grid";

const STATUS_BADGE = {
  SCHEDULED: "secondary",
  CONFIRMED: "info",
  ARRIVED: "warning",
  IN_SERVICE: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "outline",
} as const;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requirePermission("appointments:read");
  const { date } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("appointments");
  const clinicId = user.currentClinicId ?? "";

  const anchor = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? parseISODate(date) : new Date();
  const days = weekDates(anchor);
  const weekRangeStart = days[0];
  const weekRangeEnd = addDays(days[6]!, 1);
  const todayIso = toISODate(new Date());

  const rows = await prisma.appointment.findMany({
    where: {
      clinicId,
      startTime: { gte: weekRangeStart, lt: weekRangeEnd },
    },
    include: {
      patient: { select: { id: true, firstNameAr: true, lastNameAr: true, firstNameEn: true, lastNameEn: true } },
      doctor: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const appointments = rows.map((a) => ({
    id: a.id,
    start: a.startTime.toISOString(),
    end: a.endTime.toISOString(),
    patientName: displayName(a.patient, locale),
    doctorName: a.doctor?.name ?? null,
    status: a.status,
  }));

  const canWrite = await can(user, "appointments:write");

  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const rangeLabel = `${fmt.format(weekRangeStart)} – ${fmt.format(weekRangeEnd)}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        icon={CalendarClock}
        description={rangeLabel}
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/appointments/new">
                <Plus />
                {t("newAppointment")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/appointments?date=${toISODate(addDays(anchor, -7))}`}>
              <ArrowRight />
              {t("prevWeek")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/appointments?date=${todayIso}`}>{t("today")}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/appointments?date=${toISODate(addDays(anchor, 7))}`}>
              {t("nextWeek")}
              <ArrowLeft />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{t("legend")}:</span>
          {(["SCHEDULED", "CONFIRMED", "ARRIVED", "IN_SERVICE", "COMPLETED", "CANCELLED", "NO_SHOW"] as const).map(
            (s) => (
              <span key={s} className="inline-flex items-center gap-1">
                <span className={badgeDot(STATUS_BADGE[s])} />
                {t(`status_${s.toLowerCase()}`)}
              </span>
            ),
          )}
        </div>
      </div>

      <AppointmentWeekGrid
        days={days.map((d) => ({
          iso: toISODate(d),
          year: d.getUTCFullYear(),
          month: d.getUTCMonth(),
          day: d.getUTCDate(),
          today: toISODate(d) === todayIso,
        }))}
        appointments={appointments}
      />
    </div>
  );
}

function badgeDot(variant: string) {
  const map: Record<string, string> = {
    secondary: "bg-secondary",
    info: "bg-info",
    warning: "bg-warning",
    default: "bg-primary",
    success: "bg-success",
    destructive: "bg-destructive",
    outline: "bg-muted-foreground",
  };
  return `size-2 rounded-full ${map[variant] ?? "bg-muted-foreground"}`;
}