import { Syringe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadProcedures } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import type { BadgeVariant } from "@/components/patients/profile/profile-records";
import {
  ProfileEmpty,
  ProfileRecordList,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadProcedures>>[number];

const STATUS_BADGE: Record<string, BadgeVariant> = {
  PLANNED: "outline",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export async function ProceduresTab({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const t = await getTranslations("patients");

  const records: ProfileRecord[] = items.map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: item.performedAt ? fmtDate(item.performedAt, locale) : null,
    badges: [
      {
        label: t(`procedureStatus_${item.status}`),
        variant: STATUS_BADGE[item.status] ?? "secondary",
      },
      ...(item.code ? [{ label: item.code, variant: "outline" as const }] : []),
    ],
    facts: [
      ...(item.category ? [{ label: t("category"), value: item.category }] : []),
      ...(item.provider ? [{ label: t("provider"), value: item.provider }] : []),
    ],
    note: item.notes,
  }));

  return (
    <div className="flex flex-col gap-4">
      {records.length === 0 ? (
        <ProfileEmpty icon={Syringe} title={t("noProcedures")} />
      ) : (
        <ProfileRecordList records={records} />
      )}
    </div>
  );
}