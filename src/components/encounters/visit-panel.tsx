import { CalendarClock, UserCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/data/status-badge";
import { fmtDate, fmtTime } from "@/lib/format";
import { VisitRouteActions } from "@/components/encounters/visit-route-actions";

export type VisitPanelData = {
  id: string;
  visitNumber: string;
  mrn: string;
  arrivedAt: Date;
  status: string;
  type: string;
  priority: string;
  source: string;
  referralSource: string;
  reason: string | null;
  chiefComplaint: string | null;
  symptomDuration: string | null;
  registrarName: string | null;
  doctorName: string | null;
  departmentName: string | null;
  currentQueue: "TRIAGE" | "DOCTOR";
  queueName: string;
  position: number;
  queueStatus: string;
};

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export async function VisitPanel({
  visit,
  locale,
  canManage,
}: {
  visit: VisitPanelData;
  locale: string;
  canManage: boolean;
}) {
  const t = await getTranslations("visits");

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarClock className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">{t("currentVisit")}</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {visit.visitNumber}
            </span>
            <StatusBadge status={visit.status}>
              {t(`status_${visit.status}`)}
            </StatusBadge>
            <StatusBadge status={visit.priority}>
              {t(`priority_${visit.priority}`)}
            </StatusBadge>
            <StatusBadge status="REGISTERED" tone="muted">
              {t(`type_${visit.type}`)}
            </StatusBadge>
          </div>
          {canManage && (
            <VisitRouteActions visitId={visit.id} current={visit.currentQueue} />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label={t("mrn")} value={<span className="font-mono">{visit.mrn}</span>} />
          <Fact
            label={t("arrivedAt")}
            value={`${fmtDate(visit.arrivedAt, locale)} · ${fmtTime(visit.arrivedAt)}`}
          />
          <Fact
            label={t("registeredBy")}
            value={
              <span className="flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-muted-foreground" aria-hidden />
                {visit.registrarName ?? t("unknown")}
              </span>
            }
          />
          <Fact label={t("source")} value={t(`source_${visit.source}`)} />
          <Fact label={t("department")} value={visit.departmentName ?? t("none")} />
          <Fact label={t("doctor")} value={visit.doctorName ?? t("unassigned")} />
          <Fact label={t("referralSource")} value={t(`referral_${visit.referralSource}`)} />
          <Fact
            label={t("symptomDuration")}
            value={visit.symptomDuration ?? t("none")}
          />
          <Fact
            label={t("queue")}
            value={
              <span className="flex items-center gap-2">
                {visit.queueName}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                  #{visit.position}
                </span>
              </span>
            }
          />
          <Fact label={t("reason")} value={visit.reason ?? t("none")} />
          <Fact
            label={t("chiefComplaint")}
            value={visit.chiefComplaint ?? t("none")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
