import { History } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type {
  loadHistory,
  loadVisitSessions,
} from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import {
  ProfileEmpty,
  ProfileRecordList,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadHistory>>[number];
type Session = Awaited<ReturnType<typeof loadVisitSessions>>[number];

export async function HistoryTab({
  items,
  sessions,
  locale,
}: {
  items: Item[];
  sessions: Session[];
  locale: string;
}) {
  const t = await getTranslations("patients");

  const sessionRecords: ProfileRecord[] = sessions.map((session) => ({
    id: session.id,
    title: session.chiefComplaint || t("visitSession"),
    subtitle: session.doctor?.name,
    badges: [
      { label: t("visitBadge"), variant: "outline" as const },
      {
        label:
          session.status === "COMPLETED"
            ? t("completed")
            : session.status === "IN_PROGRESS"
              ? t("inProgress")
              : t("pending"),
        variant:
          session.status === "COMPLETED" ? ("success" as const) : ("warning" as const),
      },
    ],
    facts: [{ label: t("visitDate"), value: fmtDate(session.createdAt, locale) }],
    note:
      session.subjective ||
      session.plan ||
      t("visitNoDetails"),
  }));

  const records: ProfileRecord[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.occurredAt ? fmtDate(item.occurredAt, locale) : null,
    badges: [{ label: t(`historyType_${item.type}`), variant: "info" as const }],
    note: item.description,
  }));

  const all = [...sessionRecords, ...records];

  return (
    <div className="flex flex-col gap-4">
      {all.length === 0 ? (
        <ProfileEmpty icon={History} title={t("noHistory")} />
      ) : (
        <ProfileRecordList records={all} />
      )}
    </div>
  );
}