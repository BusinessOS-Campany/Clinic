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
import { Card, CardContent } from "@/components/ui/card";

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
          secondNameAr: true,
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
  }));

  const waiting = items.filter((i) => ACTIVE_WAITING.includes(i.status));
  const inService = items.filter((i) => i.status === "IN_SERVICE");
  const completed = items.filter((i) => i.status === "COMPLETED");
  const unattended = items.filter(
    (i) => i.status === "CANCELLED" || i.status === "NO_SHOW",
  );

  const stats = [
    { count: waiting.length, label: t("statWaiting") },
    { count: inService.length, label: t("statInService") },
    { count: completed.length, label: t("statCompleted") },
    { count: unattended.length, label: t("statUnattended") },
  ];

  const todayIso = toISODate(new Date());

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-1 py-3">
              <span className="text-2xl font-bold">{s.count}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReceptionBoard
        waiting={waiting}
        inService={inService}
        completed={completed}
        unattended={unattended}
        canWrite={canWrite}
      />
    </div>
  );
}