import { Pill, AlertTriangle, History } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type {
  loadCurrentMedications,
  loadPreviousPrescriptions,
} from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ProfileEmpty,
  ProfileRecordList,
  type BadgeVariant,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadCurrentMedications>>[number];

const STATUS_BADGE: Record<string, BadgeVariant> = {
  PENDING: "secondary",
  ACTIVE: "success",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  ON_HOLD: "warning",
  EXPIRED: "destructive",
};

const PRESCRIPTION_STATUS_BADGE: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  ON_HOLD: "warning",
  EXPIRED: "destructive",
};

export async function MedicationsTab({
  currentItems,
  previousItems,
  locale,
  alerts = [],
}: {
  currentItems: Item[];
  previousItems: Item[];
  locale: string;
  alerts?: { type: string; severity: string; message: string }[];
}) {
  const t = await getTranslations("patients");
  const te = await getTranslations("encounters");

  function buildRecords(items: Item[], showDispensed: boolean): ProfileRecord[] {
    return items.map((item) => {
      const isMedication = item.kind === "MEDICATION";
      const prescriptionStatus = item.prescriptionStatus || item.status;
      const badgeVariant = isMedication
        ? PRESCRIPTION_STATUS_BADGE[prescriptionStatus] ?? "secondary"
        : STATUS_BADGE[item.status] ?? "secondary";

      return {
        id: item.id,
        title: item.name,
        subtitle: item.encounter
          ? `${fmtDate(item.encounter.createdAt, locale)}${
              item.encounter.doctor ? ` · ${item.encounter.doctor.name}` : ""
            }`
          : null,
        badges: [
          {
            label: isMedication
              ? te(`prescriptionStatus_${prescriptionStatus}`)
              : t(`orderStatus_${item.status}`),
            variant: badgeVariant,
          },
          ...(item.genericName ? [{ label: t("genericName"), variant: "outline" as const }] : []),
          ...(item.drugCatalogId ? [{ label: t("catalogued"), variant: "info" as const }] : []),
        ],
        facts: [
          ...(item.genericName ? [{ label: t("genericName"), value: item.genericName }] : []),
          ...(item.brandName ? [{ label: t("brandName"), value: item.brandName }] : []),
          ...(item.strength ? [{ label: t("strength"), value: item.strength }] : []),
          ...(item.dosageForm ? [{ label: t("dosageForm"), value: item.dosageForm }] : []),
          ...(item.route ? [{ label: t("route"), value: item.route }] : []),
          ...(item.dose !== null && item.dose !== undefined
            ? [{ label: t("dose"), value: `${item.dose} ${item.doseUnit ?? ""}`.trim() }]
            : []),
          ...(item.dosage ? [{ label: t("dosage"), value: item.dosage }] : []),
          ...(item.frequencyCode ? [{ label: t("frequencyCode"), value: item.frequencyCode }] : []),
          ...(item.frequency ? [{ label: t("frequency"), value: item.frequency }] : []),
          ...(item.durationDays
            ? [{ label: t("durationDays"), value: `${item.durationDays}` }]
            : []),
          ...(item.quantity
            ? [{ label: t("qty"), value: `${item.quantity} ${item.unit ?? ""}`.trim() }]
            : []),
          ...(item.refills !== null && item.refills !== undefined
            ? [{ label: t("refills"), value: `${item.refills}` }]
            : []),
          ...(item.clinicalIndication
            ? [{ label: t("indication"), value: item.clinicalIndication }]
            : []),
          ...(showDispensed && item.dispensedAt
            ? [{ label: t("dispensedAt"), value: fmtDate(item.dispensedAt, locale) }]
            : []),
        ],
        note: item.instructions,
      };
    });
  }

  const currentRecords = buildRecords(currentItems, true);
  const previousRecords = buildRecords(previousItems, false);

  return (
    <div className="flex flex-col gap-4">
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" />
            <span className="font-medium">{t("safetyAlerts")}</span>
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-sm">
              <span className="font-medium">{t(`alertType_${a.type}`)}</span>: {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="size-4 text-muted-foreground" />
              {t("previousPrescriptions")}
              {previousRecords.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({previousRecords.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {previousRecords.length === 0 ? (
              <ProfileEmpty
                icon={History}
                title={t("noPreviousPrescriptions")}
                description={t("noPreviousPrescriptionsHint")}
              />
            ) : (
              <ProfileRecordList records={previousRecords} />
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Pill className="size-4 text-[var(--violet)]" />
              {t("currentMedications")}
              {currentRecords.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({currentRecords.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {currentRecords.length === 0 ? (
              <ProfileEmpty icon={Pill} title={t("noCurrentMedications")} />
            ) : (
              <ProfileRecordList records={currentRecords} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
