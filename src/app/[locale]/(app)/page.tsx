import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/core/auth/session";
import { can } from "@/core/rbac";
import type { PermissionCode } from "@/core/rbac/catalog";
import { addDays, parseISODate, toISODate, weekDates } from "@/lib/dates";
import { fmtMoney, toNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions, type QuickAction } from "@/components/dashboard/quick-actions";
import { LiveQueue, type QueueItem } from "@/components/dashboard/live-queue";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { ClipboardList } from "lucide-react";

function pctDelta(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? { value: 100, direction: "up" as const } : undefined;
  const change = ((current - previous) / previous) * 100;
  return {
    value: change,
    direction: change > 0.5 ? ("up" as const) : change < -0.5 ? ("down" as const) : ("flat" as const),
  };
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const ta = await getTranslations("appointments");
  const tb = await getTranslations("billing");
  const locale = await getLocale();
  const user = await requireUser();
  const clinicId = user.currentClinicId ?? "";

  const todayStart = parseISODate(toISODate(new Date()));
  const todayEnd = addDays(todayStart, 1);
  const yesterdayStart = addDays(todayStart, -1);
  const twoWeeksAgo = addDays(todayStart, -13);

  const [clinic, todayCount, waiting, inService, completedToday, revenueAgg, openInvoices, pendingOrders, revenueRows, queueRows] =
    await Promise.all([
      prisma.clinic.findUnique({ where: { id: clinicId }, select: { timezone: true } }),
      prisma.appointment.count({ where: { clinicId, startTime: { gte: todayStart, lt: todayEnd } } }),
      prisma.appointment.count({
        where: { clinicId, startTime: { gte: todayStart, lt: todayEnd }, status: "ARRIVED" },
      }),
      prisma.appointment.count({
        where: { clinicId, startTime: { gte: todayStart, lt: todayEnd }, status: "IN_SERVICE" },
      }),
      prisma.appointment.count({
        where: { clinicId, startTime: { gte: todayStart, lt: todayEnd }, status: "COMPLETED" },
      }),
      prisma.payment.aggregate({
        where: { invoice: { clinicId }, paidAt: { gte: todayStart, lt: todayEnd } },
        _sum: { amount: true },
      }),
      prisma.invoice.findMany({
        where: { clinicId, status: "OPEN" },
        select: { total: true, paidAmount: true },
      }),
      prisma.medicalOrder.count({
        where: { clinicId, status: { in: ["PENDING", "ACTIVE"] } },
      }),
      prisma.payment.findMany({
        where: { invoice: { clinicId }, paidAt: { gte: twoWeeksAgo, lt: todayEnd } },
        select: { amount: true, paidAt: true },
      }),
      prisma.appointment.findMany({
        where: {
          clinicId,
          startTime: { gte: todayStart, lt: todayEnd },
          status: { in: ["ARRIVED", "IN_SERVICE", "SCHEDULED", "CONFIRMED"] },
        },
        select: {
          id: true,
          status: true,
          startTime: true,
          patient: { select: { firstNameAr: true, lastNameAr: true, firstNameEn: true, lastNameEn: true } },
        },
        orderBy: { startTime: "asc" },
        take: 6,
      }),
    ]);

  // Yesterday comparison for deltas
  const [yesterdayCount, yesterdayCompleted, yesterdayRevenue] = await Promise.all([
    prisma.appointment.count({ where: { clinicId, startTime: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.appointment.count({
      where: { clinicId, startTime: { gte: yesterdayStart, lt: todayStart }, status: "COMPLETED" },
    }),
    prisma.payment.aggregate({
      where: { invoice: { clinicId }, paidAt: { gte: yesterdayStart, lt: todayStart } },
      _sum: { amount: true },
    }),
  ]);

  // Chart source data (last 30 days)
  const monthStart = addDays(todayStart, -29);
  const [statusRows, typeRows, methodRows, patientRows] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["status"],
      where: { clinicId, startTime: { gte: monthStart, lt: todayEnd } },
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["type"],
      where: { clinicId, startTime: { gte: monthStart, lt: todayEnd } },
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      where: { invoice: { clinicId }, paidAt: { gte: monthStart, lt: todayEnd } },
      _count: { _all: true },
    }),
    prisma.patient.findMany({
      where: { clinicId, createdAt: { gte: monthStart, lt: todayEnd } },
      select: { createdAt: true },
    }),
  ]);

  const outstanding = openInvoices.reduce(
    (sum, inv) => sum + Math.max(0, toNumber(inv.total) - toNumber(inv.paidAmount)),
    0,
  );
  const revenueToday = toNumber(revenueAgg._sum.amount);
  const revenueYesterday = toNumber(yesterdayRevenue._sum.amount);

  const dayLabel = (d: Date) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { day: "numeric", month: "short" }).format(d);

  const byDay = new Map<string, number>();
  for (const p of revenueRows) {
    const iso = toISODate(new Date(p.paidAt));
    byDay.set(iso, (byDay.get(iso) ?? 0) + toNumber(p.amount));
  }
  const rev14d = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(twoWeeksAgo, i);
    return { label: dayLabel(d), value: Math.round((byDay.get(toISODate(d)) ?? 0) * 100) / 100 };
  });

  const apptWindows = weekDates(todayStart);
  const weekStart = apptWindows[0]!;
  const apptByDay = new Map<string, number>();
  const weekAppts = await prisma.appointment.findMany({
    where: { clinicId, startTime: { gte: weekStart, lt: addDays(weekStart, 7) } },
    select: { startTime: true },
  });
  for (const a of weekAppts) {
    const iso = toISODate(new Date(a.startTime));
    apptByDay.set(iso, (apptByDay.get(iso) ?? 0) + 1);
  }
  const appt7d = apptWindows.map((d) => ({ label: dayLabel(d), value: apptByDay.get(toISODate(d)) ?? 0 }));

  const byDayPatients = new Map<string, number>();
  for (const p of patientRows) {
    const iso = toISODate(new Date(p.createdAt));
    byDayPatients.set(iso, (byDayPatients.get(iso) ?? 0) + 1);
  }
  const newPatients = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(monthStart, i);
    return { label: dayLabel(d), value: byDayPatients.get(toISODate(d)) ?? 0 };
  });

  const statusLabels = {
    SCHEDULED: ta("status_scheduled"),
    CONFIRMED: ta("status_confirmed"),
    ARRIVED: ta("status_arrived"),
    IN_SERVICE: ta("status_in_service"),
    COMPLETED: ta("status_completed"),
    CANCELLED: ta("status_cancelled"),
    NO_SHOW: ta("status_no_show"),
  } satisfies Record<string, string>;
  const typeLabels = {
    INITIAL: ta("type_INITIAL"),
    FOLLOW_UP: ta("type_FOLLOW_UP"),
    CONSULTATION: ta("type_CONSULTATION"),
    VACCINATION: ta("type_VACCINATION"),
    PROCEDURE: ta("type_PROCEDURE"),
    RE_EVALUATION: ta("type_RE_EVALUATION"),
  } satisfies Record<string, string>;
  const methodLabels = {
    CASH: tb("paymentMethod_CASH"),
    CARD: tb("paymentMethod_CARD"),
    BANK_TRANSFER: tb("paymentMethod_BANK_TRANSFER"),
    MOBILE_MONEY: tb("paymentMethod_MOBILE_MONEY"),
    INSURANCE: tb("paymentMethod_INSURANCE"),
    OTHER: tb("paymentMethod_OTHER"),
  } satisfies Record<string, string>;

  const byStatus = (["COMPLETED", "IN_SERVICE", "ARRIVED", "CONFIRMED", "SCHEDULED", "CANCELLED", "NO_SHOW"] as const)
    .map((key) => ({
      key,
      label: statusLabels[key],
      value: statusRows.find((r) => r.status === key)?._count._all ?? 0,
    }))
    .filter((s) => s.value > 0);

  const byType = (["CONSULTATION", "FOLLOW_UP", "INITIAL", "PROCEDURE", "VACCINATION", "RE_EVALUATION"] as const)
    .map((key) => ({
      key,
      label: typeLabels[key],
      value: typeRows.find((r) => r.type === key)?._count._all ?? 0,
    }))
    .filter((s) => s.value > 0);

  const byMethod = (["CASH", "CARD", "INSURANCE", "BANK_TRANSFER", "MOBILE_MONEY", "OTHER"] as const)
    .map((key) => ({
      key,
      label: methodLabels[key],
      value: methodRows.find((r) => r.method === key)?._count._all ?? 0,
    }))
    .filter((s) => s.value > 0);

  const patientName = (p: {
    firstNameAr: string;
    lastNameAr: string;
    firstNameEn: string | null;
    lastNameEn: string | null;
  }) =>
    locale === "ar"
      ? `${p.firstNameAr} ${p.lastNameAr}`
      : `${p.firstNameEn ?? p.firstNameAr} ${p.lastNameEn ?? p.lastNameAr}`;

  const nowMs = Date.now();
  const queue: QueueItem[] = queueRows.map((a) => ({
    id: a.id,
    name: patientName(a.patient),
    time: new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(a.startTime)),
    status:
      a.status === "IN_SERVICE" ? "IN_SERVICE" : a.status === "ARRIVED" ? "WAITING" : "UPCOMING",
    meta:
      a.status === "ARRIVED" && new Date(a.startTime).getTime() < nowMs
        ? t("waitingSince")
        : undefined,
  }));

  const greetingHour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: clinic?.timezone ?? undefined,
    }).format(new Date()),
  );
  const greetingKey =
    greetingHour < 12 ? "greetingMorning" : greetingHour < 17 ? "greetingAfternoon" : "greetingEvening";

  const numLocale = locale === "ar" ? "ar-EG" : "en-US";

  const stats = [
    {
      icon: "calendar" as const,
      label: t("todayAppointments"),
      value: todayCount,
      format: "int" as const,
      tone: "primary" as const,
      delta: pctDelta(todayCount, yesterdayCount),
      deltaLabel: t("vsYesterday"),
    },
    {
      icon: "hourglass" as const,
      label: t("waitingPatients"),
      value: waiting,
      format: "int" as const,
      tone: "warning" as const,
    },
    {
      icon: "stethoscope" as const,
      label: t("inService"),
      value: inService,
      format: "int" as const,
      tone: "violet" as const,
    },
    {
      icon: "check" as const,
      label: t("completedToday"),
      value: completedToday,
      format: "int" as const,
      tone: "success" as const,
      delta: pctDelta(completedToday, yesterdayCompleted),
      deltaLabel: t("vsYesterday"),
    },
    {
      icon: "wallet" as const,
      label: t("revenueToday"),
      value: revenueToday,
      format: "money" as const,
      tone: "info" as const,
      delta: pctDelta(revenueToday, revenueYesterday),
      deltaLabel: t("vsYesterday"),
    },
    {
      icon: "trending" as const,
      label: t("outstandingBalances"),
      value: outstanding,
      format: "money" as const,
      tone: "danger" as const,
    },
  ];

  const quickCandidates: (QuickAction & { permission: PermissionCode })[] = [
    { label: t("registerPatient"), href: "/patients/new", icon: "userPlus", tone: "primary", permission: "patients:write" },
    { label: t("newAppointment"), href: "/appointments/new", icon: "calendarPlus", tone: "info", permission: "appointments:write" },
    { label: t("checkInPatient"), href: "/reception", icon: "clipboard", tone: "success", permission: "reception:read" },
    { label: t("newEncounter"), href: "/encounters/new", icon: "stethoscope", tone: "violet", permission: "encounters:write" },
    { label: t("newInvoice"), href: "/billing/new", icon: "receipt", tone: "warning", permission: "billing:write" },
    { label: t("labOrders"), href: "/lab", icon: "flask", tone: "info", permission: "laboratory:read" },
    { label: t("pharmacy"), href: "/pharmacy", icon: "pill", tone: "success", permission: "pharmacy:read" },
    { label: t("reports"), href: "/reports", icon: "chartBar", tone: "primary", permission: "reports:read" },
  ];

  const quick = (
    await Promise.all(
      quickCandidates.map(async ({ permission, ...action }) =>
        (await can(user, permission)) ? action : null,
      ),
    )
  ).filter((a): a is QuickAction => a !== null);

  return (
    <div className="flex flex-col gap-6">
      <DashboardHero
        greeting={t(greetingKey)}
        userName={user.name}
        subtitle={t("welcome")}
        pendingOrders={pendingOrders}
        pendingOrdersLabel={t("pendingOrders")}
        action={
          <Button asChild size="sm" variant="outline" className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <Link href="/pharmacy">
              <ClipboardList />
              {t("pendingOrders")}: {pendingOrders}
            </Link>
          </Button>
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{t("quickActions")}</h2>
        <QuickActions actions={quick} />
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            format={s.format}
            locale={numLocale}
            tone={s.tone}
            delta={s.delta}
            deltaLabel={s.deltaLabel}
            index={i}
          />
        ))}
      </div>

      <DashboardCharts
        rev14d={rev14d}
        appt7d={appt7d}
        newPatients={newPatients}
        byStatus={byStatus}
        byType={byType}
        byMethod={byMethod}
        labels={{
          revenueTrend: t("revenueTrend"),
          appointmentsTrend: t("appointmentsTrend"),
          newPatients: t("newPatients"),
          appointmentStatus: t("appointmentStatus"),
          appointmentTypes: t("appointmentTypes"),
          paymentMethods: t("paymentMethods"),
          noData: t("noData"),
        }}
      />

      <LiveQueue
        items={queue}
        labels={{
          title: t("liveQueue"),
          empty: t("queueEmpty"),
          viewAll: t("viewLiveQueue"),
          status: {
            waiting: t("statusWaiting"),
            inService: t("statusInService"),
            upcoming: t("statusUpcoming"),
          },
        }}
      />
    </div>
  );
}