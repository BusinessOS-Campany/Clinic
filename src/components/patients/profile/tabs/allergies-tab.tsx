import { TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadAllergies } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import type { BadgeVariant } from "@/components/patients/profile/profile-records";
import {
  ProfileEmpty,
  ProfileRecordList,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadAllergies>>[number];

const SEVERITY_BADGE: Record<string, BadgeVariant> = {
  MILD: "secondary",
  MODERATE: "warning",
  SEVERE: "destructive",
};

export async function AllergiesTab({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const t = await getTranslations("patients");

  const records: ProfileRecord[] = items.map((item) => ({
    id: item.id,
    title: item.allergen,
    subtitle: item.notedAt ? fmtDate(item.notedAt, locale) : null,
    badges: [
      { label: t(`allergyType_${item.type}`), variant: "outline" as const },
      {
        label: t(`severity_${item.severity}`),
        variant: SEVERITY_BADGE[item.severity] ?? "secondary",
      },
      ...(item.isActive
        ? []
        : [{ label: t("resolvedLabel"), variant: "secondary" as const }]),
    ],
    note: item.reaction,
  }));

  const hasActive = items.some((item) => item.isActive);

  return (
    <div className="flex flex-col gap-4">
      {records.length === 0 ? (
        <ProfileEmpty
          icon={TriangleAlert}
          title={t("noAllergies")}
          description={t("noAllergiesHint")}
        />
      ) : (
        <>
          {!hasActive && (
            <p className="rounded-xl border border-dashed bg-success/5 p-3 text-sm text-muted-foreground">
              {t("allergiesResolvedAll")}
            </p>
          )}
          <ProfileRecordList records={records} />
        </>
      )}
    </div>
  );
}