import { FlaskConical } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadLabResults } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import type { BadgeVariant } from "@/components/patients/profile/profile-records";
import {
  ProfileEmpty,
  ProfileRecordList,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadLabResults>>[number];

const STATUS_BADGE: Record<string, BadgeVariant> = {
  PENDING: "secondary",
  SAMPLED: "info",
  IN_PROGRESS: "info",
  RESULTED: "warning",
  VERIFIED: "success",
  CANCELLED: "destructive",
};

export async function LabTab({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const t = await getTranslations("patients");

  const records: ProfileRecord[] = items.map((item) => {
    const abnormal = item.tests.filter((test) => test.isAbnormal);
    return {
      id: item.id,
      title:
        item.tests.map((test) => test.testName).join(" · ") ||
        t("labRequest"),
      subtitle: fmtDate(item.createdAt, locale),
      badges: [
        {
          label: t(`labStatus_${item.status}`),
          variant: STATUS_BADGE[item.status] ?? "secondary",
        },
        ...(abnormal.length > 0
          ? [
              {
                label: `${abnormal.length} ${t("abnormal")}`,
                variant: "destructive" as const,
              },
            ]
          : []),
      ],
      note: item.tests.length
        ? item.tests
            .map((test) => {
              const value = test.resultValue ?? "—";
              const unit = test.unit ? ` ${test.unit}` : "";
              const range = test.referenceRange
                ? ` (${t("reference")}: ${test.referenceRange})`
                : "";
              return `${test.testName}: ${value}${unit}${range}`;
            })
            .join("\n")
        : null,
      trailing: `${item.tests.length} ${t("tests")}`,
    };
  });

  if (records.length === 0) {
    return <ProfileEmpty icon={FlaskConical} title={t("noLabResults")} />;
  }

  return <ProfileRecordList records={records} />;
}