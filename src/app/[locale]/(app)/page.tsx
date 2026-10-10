import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/core/auth/session";
import { addDays, parseISODate, toISODate, weekDates } from "@/lib/dates";
import { fmtMoney, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import {
  CalendarPlus,
  ClipboardList,
  UserPlus,
  UsersRound,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const user = await requireUser();
  const clinicId = user.currentClinicId ?? "";

  const todayStart = parseISODate(toISODate(new Date()));
  const todayEnd = addDays(todayStart, 1);
  const twoWeeksAgo = addDays(todayStart, -13);

  const [todayCount, waiting, inService, completedToday, revenueAgg, openInvoices, pendingOrders, revenueRows] =
    await Promise.all([
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
    ]);

  const outstanding = openInvoices.reduce((sum, inv) => sum + Math.max(0, toNumber(inv.total) - toNumber(inv.paidAmount)), 0);
  const revenueToday = toNumber(revenueAgg._sum.amount);

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
  const appt7d = apptWindows.map((d) => ({ label: dayLabel(d), count: apptByDay.get(toISODate(d)) ?? 0 }));

  const stats = [
    { label: t("todayAppointments"), value: todayCount },
    { label: t("waitingPatients"), value: waiting },
    { label: t("inService"), value: inService },
    { label: t("completedToday"), value: completedToday },
    { label: t("revenueToday"), value: fmtMoney(revenueToday) },
    { label: t("outstandingBalances"), value: fmtMoney(outstanding) },
  ];

  const quick = [
    { label: t("registerPatient"), href: "/patients/new", icon: UserPlus },
    { label: t("newAppointment"), href: "/appointments/new", icon: CalendarPlus },
    { label: t("checkInPatient"), href: "/reception", icon: ClipboardList },
    { label: t("viewLiveQueue"), href: "/reception", icon: ArrowRight },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("welcome")}
        actions={
          pendingOrders > 0 ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/pharmacy">
                <ClipboardList />
                {t("pendingOrders")}: {pendingOrders}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="px-6 py-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 truncate text-2xl font-semibold" dir="ltr">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardCharts
        rev14d={rev14d}
        appt7d={appt7d}
        labels={{
          revenueTrend: t("revenueTrend"),
          appointmentsTrend: t("appointmentsTrend"),
          noData: t("noData"),
        }}
      />

      <div className="flex flex-wrap gap-2">
        {quick.map((q) => {
          const Icon = q.icon;
          return (
            <Button key={q.label} asChild variant="outline" size="sm">
              <Link href={q.href}>
                <Icon />
                {q.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}