import { CalendarClock, CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadAppointments } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import type { BadgeVariant } from "@/components/patients/profile/profile-records";
import {
  ProfileEmpty,
  ProfileRecordList,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadAppointments>>[number];

export type FollowUpVisit = {
  id: string;
  visitNumber: string;
  arrivedAt: Date;
  status: string;
  reason: string | null;
  doctor: { name: string } | null;
  queueEntries: { status: string }[];
};

const STATUS_BADGE: Record<string, BadgeVariant> = {
  SCHEDULED: "outline",
  CONFIRMED: "info",
  ARRIVED: "warning",
  IN_SERVICE: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "secondary",
};

export async function AppointmentsTab({
  items,
  visits = [],
  locale,
  followUpOnly,
}: {
  items: Item[];
  visits?: FollowUpVisit[];
  locale: string;
  followUpOnly: boolean;
}) {
  const t = await getTranslations("patients");

  if (items.length === 0 && (visits?.length ?? 0) === 0) {
    return (
      <ProfileEmpty
        icon={followUpOnly ? CalendarClock : CalendarDays}
        title={followUpOnly ? t("noFollowUps") : t("noAppointments")}
      />
    );
  }

  const now = Date.now();
  const scoped = followUpOnly ? items.filter((item) => item.type === "FOLLOW_UP") : items;
  const upcoming = scoped
    .filter(
      (item) =>
        item.startTime.getTime() >= now &&
        item.status !== "CANCELLED" &&
        item.status !== "COMPLETED",
    )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const pastAppts = scoped.filter((item) => !upcoming.includes(item));
  const past = [
    ...pastAppts.map((a) => ({ kind: "appt" as const, date: a.startTime, item: a })),
    ...(visits ?? []).map((v) => ({ kind: "visit" as const, date: v.arrivedAt, visit: v })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  function toVisitRecord(v: FollowUpVisit): ProfileRecord {
    const q = v.queueEntries?.[0];
    const status = q?.status ?? "WAITING";
    return {
      id: v.id,
      title: v.reason || t("visitType_FOLLOW_UP"),
      subtitle: `${fmtDate(v.arrivedAt, locale)}${v.doctor ? ` · ${v.doctor.name}` : ""}`,
      badges: [
        { label: t("visitType_FOLLOW_UP"), variant: "outline" as const },
        { label: t(`entryStatus_${status}`) || status, variant: "secondary" as const },
      ],
      facts: [{ label: t("visitNumber") || "Visit", value: v.visitNumber }],
    };
  }

  function toRecord(item: Item): ProfileRecord {
    return {
      id: item.id,
      title: item.reason ?? t(`appointmentType_${item.type}`),
      subtitle: `${fmtDate(item.startTime, locale)}${
        item.doctor ? ` · ${item.doctor.name}` : ""
      }`,
      badges: [
        { label: t(`appointmentType_${item.type}`), variant: "outline" as const },
        {
          label: t(`appointmentStatus_${item.status}`),
          variant: STATUS_BADGE[item.status] ?? "secondary",
        },
      ],
      facts: item.department
        ? [
            {
              label: t("department"),
              value:
                locale === "ar" ? item.department.nameAr : item.department.nameEn,
            },
          ]
        : [],
      note: item.notes,
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{t("upcomingAppointments")}</h3>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t("noUpcomingAppointments")}
          </p>
        ) : (
          <ProfileRecordList records={upcoming.map(toRecord)} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{t("pastAppointments")}</h3>
        {past.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t("noPastAppointments")}
          </p>
        ) : (
          <ProfileRecordList
            records={past.map((p) =>
              p.kind === "visit" ? toVisitRecord(p.visit) : toRecord(p.item),
            )}
          />
        )}
      </section>
    </div>
  );
}