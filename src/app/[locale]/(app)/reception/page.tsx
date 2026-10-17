import { ClipboardList, Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { addDays, parseISODate, toISODate } from "@/lib/dates";
import {
  ReceptionBoard,
  type ReceptionItem,
} from "@/components/reception/reception-board";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";

const ACTIVE_WAITING = ["SCHEDULED", "CONFIRMED", "ARRIVED"];

function toClock(d: Date) {
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default async function ReceptionPage() {
  const user = await requirePermission("reception:read");
  const locale = await getLocale();
  const t = await getTranslations("reception");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "reception:write");

  const todayStart = parseISODate(toISODate(new Date()));
  const tomorrow = addDays(todayStart, 1);

  const rows = await prisma.appointment.findMany({
    where: {
      clinicId,
      startTime: { gte: todayStart, lt: tomorrow },
    },
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
      doctor: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const items: ReceptionItem[] = rows.map((a) => ({
    id: a.id,
    patientName: displayName(a.patient, locale),
    patientId: a.patient.id,
    mrn: a.patient.mrn,
    doctorName: a.doctor?.name ?? null,
    status: a.status,
    time: toClock(a.startTime),
    type: a.type,
  }));

  // عودة = موعد متابعة (FOLLOW_UP). أي نوع آخر يُعامل كزيارة أولى/عيادة.
  const returns = items.filter((i) => i.type === "FOLLOW_UP");
  const standard = items.filter((i) => i.type !== "FOLLOW_UP");

  const waiting = standard.filter((i) => ACTIVE_WAITING.includes(i.status));
  const inService = standard.filter((i) => i.status === "IN_SERVICE");
  const completed = standard.filter((i) => i.status === "COMPLETED");
  const unattended = standard.filter(
    (i) => i.status === "CANCELLED" || i.status === "NO_SHOW",
  );

  const todayIso = toISODate(new Date());

  const stats = [
    { icon: "users" as const, label: t("statWaiting"), value: waiting.length, tone: "warning" as const, format: "int" as const },
    { icon: "users" as const, label: t("statReturns"), value: returns.length, tone: "info" as const, format: "int" as const },
    { icon: "users" as const, label: t("statInService"), value: inService.length, tone: "violet" as const, format: "int" as const },
    { icon: "checkCircle" as const, label: t("statCompleted"), value: completed.length, tone: "success" as const, format: "int" as const },
    { icon: "xCircle" as const, label: t("statUnattended"), value: unattended.length, tone: "danger" as const, format: "int" as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        icon={ClipboardList}
        actions={
          canWrite ? (
            <Button asChild>
              <Link href={`/appointments/new?date=${todayIso}`}>
                <Plus />
                {t("walkIn")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s, i) => (
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

      <ReceptionBoard
        returns={returns}
        waiting={waiting}
        inService={inService}
        completed={completed}
        unattended={unattended}
        canWrite={canWrite}
      />
    </div>
  );
}