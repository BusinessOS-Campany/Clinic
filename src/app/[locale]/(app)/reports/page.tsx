import { BarChart3 } from "lucide-react";
import { addDays, startOfDay } from "date-fns";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { round2, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ReportsCharts } from "@/components/reports/reports-charts";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await requirePermission("reports:read");
  const t = await getTranslations("reports");
  const ta = await getTranslations("appointments");
  const tb = await getTranslations("billing");
  const clinicId = user.currentClinicId ?? "";

  const todayStart = startOfDay(new Date());
  const weekStart = addDays(todayStart, -13);
  const weekAhead = addDays(todayStart, 7);

  const dayLabel = (d: Date) =>
    new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(d);

  const [patientsToday, apptToday, encountersToday, payments, appts, genderRows, items, encounterRows] =
    await Promise.all([
      prisma.patient.count({ where: { clinicId, createdAt: { gte: todayStart } } }),
      prisma.appointment.count({
        where: { clinicId, startTime: { gte: todayStart }, status: { not: "CANCELLED" } },
      }),
      prisma.encounter.count({
        where: { clinicId, status: "COMPLETED", completedAt: { gte: todayStart } },
      }),
      prisma.payment.findMany({
        where: { invoice: { clinicId }, paidAt: { gte: weekStart } },
        select: { paidAt: true, amount: true },
      }),
      prisma.appointment.findMany({
        where: { clinicId, startTime: { gte: todayStart, lt: weekAhead } },
        select: { startTime: true, status: true },
      }),
      prisma.patient.groupBy({
        by: ["gender"],
        where: { clinicId },
        _count: { _all: true },
      }),
      prisma.invoiceItem.findMany({
        where: { invoice: { clinicId, status: { not: "VOID" } } },
        select: { kind: true, total: true },
      }),
      prisma.encounter.groupBy({
        by: ["doctorId"],
        where: { clinicId, status: "COMPLETED" },
        _count: { _all: true },
      }),
    ]);

  const revenueToday = payments
    .filter((p) => p.paidAt >= todayStart)
    .reduce((s, p) => s + toNumber(p.amount), 0);

  const revByDay = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    revByDay.set(dayLabel(addDays(todayStart, i - 13)), 0);
  }
  for (const p of payments) {
    const key = dayLabel(p.paidAt);
    revByDay.set(key, round2((revByDay.get(key) ?? 0) + toNumber(p.amount)));
  }
  const rev14d = [...revByDay.entries()].map(([label, value]) => ({ label, value }));

  const apptByDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) apptByDay.set(dayLabel(addDays(todayStart, i)), 0);
  for (const a of appts) {
    const key = dayLabel(a.startTime);
    apptByDay.set(key, (apptByDay.get(key) ?? 0) + 1);
  }
  const appt7d = [...apptByDay.entries()].map(([label, count]) => ({ label, count }));

  const statusNames: Record<string, string> = {};
  for (const s of ["SCHEDULED", "CONFIRMED", "ARRIVED", "IN_SERVICE", "COMPLETED"] as const) {
    statusNames[s] = ta(`status_${s.toLowerCase()}`);
  }
  const statusSplit = appts.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusSplitData = Object.entries(statusSplit).map(([name, value]) => ({
    name: statusNames[name] ?? name,
    value,
  }));

  const genderSplitData = genderRows.map((g) => ({
    name: g.gender === "MALE" ? "♂" : "♀",
    value: g._count._all,
  }));

  const kindTotals = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.kind] = round2((acc[it.kind] ?? 0) + toNumber(it.total));
    return acc;
  }, {});
  const topServices = Object.entries(kindTotals)
    .map(([kind, value]) => ({ name: tb(`kind_${kind}`), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const doctorIds = encounterRows.map((r) => r.doctorId).filter((x): x is string => Boolean(x));
  const doctorNames = doctorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, name: true },
      })
    : [];
  const doctorNameById = new Map(doctorNames.map((d) => [d.id, d.name]));
  const visitsByDoctor = encounterRows.map((r) => ({
    name: doctorNameById.get(r.doctorId ?? "") ?? "—",
    count: r._count._all,
  }));

  const cards = [
    { icon: "users" as const, label: t("cardsPatients"), value: patientsToday, tone: "primary" as const, format: "int" as const },
    { icon: "calendarCheck" as const, label: t("cardsAppointments"), value: apptToday, tone: "info" as const, format: "int" as const },
    { icon: "stethoscope" as const, label: t("cardsEncounter"), value: encountersToday, tone: "violet" as const, format: "int" as const },
    { icon: "dollarSign" as const, label: t("cardsRevenue"), value: revenueToday, tone: "success" as const, format: "money" as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} icon={BarChart3} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s, i) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            format={s.format}
            tone={s.tone}
            index={i}
          />
        ))}
      </div>

      <ReportsCharts
        rev14d={rev14d}
        appt7d={appt7d}
        statusSplit={statusSplitData}
        genderSplit={genderSplitData}
        topServices={topServices}
        visitsByDoctor={visitsByDoctor}
        labels={{
          rev: t("rev14d"),
          appt: t("appt7d"),
          status: t("statusSplit"),
          gender: t("genderSplit"),
          services: t("topServices"),
          doctor: t("wardsByDoctor"),
          noData: t("noData"),
        }}
      />
    </div>
  );
}