import { Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadDiagnoses } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import {
  ProfileEmpty,
  ProfileRecordList,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadDiagnoses>>[number];

export async function DiagnosesTab({
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
    subtitle: `${fmtDate(item.encounterDate, locale)}${
      item.doctor ? ` · ${item.doctor}` : ""
    }`,
    badges: [
      ...(item.isPrimary
        ? [{ label: t("primaryDiagnosis"), variant: "info" as const }]
        : []),
      ...(item.code ? [{ label: item.code, variant: "outline" as const }] : []),
    ],
    note: item.description ?? undefined,
  }));

  return (
    <div className="flex flex-col gap-4">
      {records.length === 0 ? (
        <ProfileEmpty icon={Stethoscope} title={t("noDiagnoses")} />
      ) : (
        <ProfileRecordList records={records} />
      )}
    </div>
  );
}
