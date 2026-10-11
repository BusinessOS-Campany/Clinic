import { Scan } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadImaging } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import type { BadgeVariant } from "@/components/patients/profile/profile-records";
import {
  ProfileEmpty,
  ProfileRecordList,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadImaging>>[number];

const STATUS_BADGE: Record<string, BadgeVariant> = {
  PENDING: "secondary",
  PERFORMED: "info",
  REPORTED: "success",
  CANCELLED: "destructive",
};

export async function ImagingTab({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const t = await getTranslations("patients");

  const records: ProfileRecord[] = items.map((item) => ({
    id: item.id,
    title: item.order?.name ?? item.modality ?? t("imagingRequest"),
    subtitle: fmtDate(item.createdAt, locale),
    badges: [
      ...(item.modality
        ? [{ label: item.modality, variant: "outline" as const }]
        : []),
      {
        label: t(`imagingStatus_${item.status}`),
        variant: STATUS_BADGE[item.status] ?? "secondary",
      },
    ],
    facts: [
      ...(item.order?.instructions
        ? [{ label: t("indication"), value: item.order.instructions }]
        : []),
      ...(item.reportedAt
        ? [{ label: t("reportedOn"), value: fmtDate(item.reportedAt, locale) }]
        : []),
    ],
    note: item.findings,
  }));

  if (records.length === 0) {
    return <ProfileEmpty icon={Scan} title={t("noImaging")} />;
  }

  return <ProfileRecordList records={records} />;
}