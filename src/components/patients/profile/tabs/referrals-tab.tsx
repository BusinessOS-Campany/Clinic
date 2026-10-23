import { Share2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadReferrals } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import type { BadgeVariant } from "@/components/patients/profile/profile-records";
import {
  ProfileEmpty,
  ProfileRecordList,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadReferrals>>[number];

const STATUS_BADGE: Record<string, BadgeVariant> = {
  PENDING: "warning",
  ACCEPTED: "info",
  REJECTED: "destructive",
  COMPLETED: "success",
  CANCELLED: "secondary",
};

function destination(item: Item): string {
  return item.toFacility ?? item.toDepartment ?? item.toDoctor ?? "—";
}

export async function ReferralsTab({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const t = await getTranslations("patients");

  const records: ProfileRecord[] = items.map((item) => ({
    id: item.id,
    title: item.reason ?? destination(item),
    subtitle: destination(item),
    badges: [
      { label: t(`referralType_${item.type}`), variant: "outline" as const },
      {
        label: t(`referralStatus_${item.status}`),
        variant: STATUS_BADGE[item.status] ?? "secondary",
      },
    ],
    facts: [
      { label: t("requestedOn"), value: fmtDate(item.requestedAt, locale) },
      ...(item.toDoctor ? [{ label: t("toDoctor"), value: item.toDoctor }] : []),
      ...(item.toDepartment
        ? [{ label: t("toDepartment"), value: item.toDepartment }]
        : []),
      ...(item.respondedAt
        ? [{ label: t("respondedOn"), value: fmtDate(item.respondedAt, locale) }]
        : []),
    ],
    note: item.notes,
  }));

  return (
    <div className="flex flex-col gap-4">
      {records.length === 0 ? (
        <ProfileEmpty icon={Share2} title={t("noReferrals")} />
      ) : (
        <ProfileRecordList records={records} />
      )}
    </div>
  );
}