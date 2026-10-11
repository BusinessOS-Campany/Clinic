import { UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { NursingRosterEntry } from "@/lib/vitals/queries";
import { displayName } from "@/lib/patient";
import { fmtDate, fmtTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VitalsDialog } from "@/components/nursing/vitals-dialog";

function priorityVariant(
  priority: string,
): "secondary" | "warning" | "destructive" {
  if (priority === "EMERGENCY") return "destructive";
  if (priority === "URGENT") return "warning";
  return "secondary";
}

export async function NursingRoster({
  entries,
  locale,
  canWrite,
}: {
  entries: NursingRosterEntry[];
  locale: string;
  canWrite: boolean;
}) {
  const t = await getTranslations("vitals");

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRound className="size-6" />
          </span>
          <p className="font-medium">{t("noPatients")}</p>
          <p className="text-sm text-muted-foreground">{t("noPatientsHint")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
              <th className="px-4 py-2.5 text-start font-medium">{t("patient")}</th>
              <th className="px-3 py-2.5 text-start font-medium">{t("arrived")}</th>
              <th className="px-3 py-2.5 text-start font-medium">{t("priority")}</th>
              <th className="px-3 py-2.5 text-start font-medium">{t("lastReading")}</th>
              <th className="px-3 py-2.5 text-start font-medium">{t("alerts")}</th>
              <th className="px-3 py-2.5 text-end font-medium" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.visitId} className="border-b last:border-b-0">
                <td className="px-4 py-3 text-start">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {displayName(
                        {
                          firstNameAr: entry.firstNameAr,
                          lastNameAr: entry.lastNameAr,
                          firstNameEn: entry.firstNameEn,
                          lastNameEn: entry.lastNameEn,
                        },
                        locale,
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.mrn}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-start text-muted-foreground">
                  <div className="flex flex-col">
                    <span>{fmtTime(entry.arrivedAt)}</span>
                    <span className="text-xs">{fmtDate(entry.arrivedAt, locale)}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-start">
                  <Badge variant={priorityVariant(entry.priority)}>
                    {t(`priority_${entry.priority}`)}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-start text-muted-foreground">
                  {entry.lastRecordedAt
                    ? fmtDate(entry.lastRecordedAt, locale)
                    : t("notRecorded")}
                </td>
                <td className="px-3 py-3 text-start">
                  {entry.openAlertCount > 0 ? (
                    <Badge variant={entry.criticalAlertCount > 0 ? "destructive" : "warning"}>
                      {entry.criticalAlertCount > 0
                        ? `${entry.openAlertCount} · ${t("criticalAlerts")}`
                        : entry.openAlertCount}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("noAlerts")}</span>
                  )}
                </td>
                <td className="px-3 py-3 text-end">
                  {canWrite ? (
                    <div className="flex justify-end">
                      <VitalsDialog
                        patientId={entry.patientId}
                        patientName={displayName(
                          {
                            firstNameAr: entry.firstNameAr,
                            lastNameAr: entry.lastNameAr,
                            firstNameEn: entry.firstNameEn,
                            lastNameEn: entry.lastNameEn,
                          },
                          locale,
                        )}
                        encounterId={entry.encounterId}
                      />
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
