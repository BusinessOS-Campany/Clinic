"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReceptionStatusActions } from "@/components/reception/reception-status-actions";
import type { AppointmentStatusValue } from "@/app/[locale]/(app)/appointments/schema";

export type ReceptionItem = {
  id: string;
  patientName: string;
  patientId: string;
  mrn: string;
  doctorName: string | null;
  status: AppointmentStatusValue;
  time: string;
  type: string;
};

const STATUS_BADGE: Record<string, "secondary" | "info" | "warning" | "default" | "success" | "destructive" | "outline"> = {
  SCHEDULED: "secondary",
  CONFIRMED: "info",
  ARRIVED: "warning",
  IN_SERVICE: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "outline",
};

function Row({
  item,
  canWrite,
  ta,
}: {
  item: ReceptionItem;
  canWrite: boolean;
  ta: ReturnType<typeof useTranslations<"appointments">>;
}) {
  const t = useTranslations("reception");
  const isReturn = item.type === "FOLLOW_UP";

  return (
    <div className="flex flex-wrap items-center gap-3 border-b px-3 py-2.5 text-sm last:border-b-0">
      <div className="min-w-40 flex-1">
        <Link
          href={`/patients/${item.patientId}`}
          className="font-medium hover:underline"
        >
          {item.patientName}
        </Link>
        <span className="ms-2 font-mono text-xs text-muted-foreground">
          {item.mrn}
        </span>
        <span className="ms-2 inline-flex flex-wrap gap-1.5 align-middle">
          {isReturn ? (
            <Badge variant="info">{t("returnBadge")}</Badge>
          ) : (
            <Badge variant="success">{t("newPatient")}</Badge>
          )}
        </span>
      </div>
      <span className="font-mono text-xs text-muted-foreground" dir="ltr">
        {item.time}
      </span>
      <span className="hidden text-sm text-muted-foreground sm:block">
        {item.doctorName ?? "—"}
      </span>
      <Badge variant={STATUS_BADGE[item.status] ?? "secondary"}>
        {ta(`status_${item.status.toLowerCase()}`)}
      </Badge>
      <div className="ms-auto flex items-center gap-2">
        {!isReturn && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/patients/${item.patientId}/chart`}>
              {t("openFile")}
            </Link>
          </Button>
        )}
        {canWrite ? (
          <ReceptionStatusActions id={item.id} current={item.status} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

export function ReceptionBoard({
  returns,
  waiting,
  inService,
  completed,
  unattended,
  canWrite,
}: {
  returns: ReceptionItem[];
  waiting: ReceptionItem[];
  inService: ReceptionItem[];
  completed: ReceptionItem[];
  unattended: ReceptionItem[];
  canWrite: boolean;
}) {
  const t = useTranslations("reception");
  const ta = useTranslations("appointments");

  const Section = ({
    title,
    items,
    empty,
  }: {
    title: string;
    items: ReceptionItem[];
    empty: string;
  }) => (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </header>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => (
            <Row key={item.id} item={item} canWrite={canWrite} ta={ta} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section
        title={t("sectionReturns")}
        items={returns}
        empty={t("emptyReturns")}
      />
      <Section
        title={t("sectionWaiting")}
        items={waiting}
        empty={t("emptyWaiting")}
      />
      <Section
        title={t("sectionInService")}
        items={inService}
        empty={t("emptyInService")}
      />
      <Section
        title={t("sectionCompleted")}
        items={completed}
        empty={t("emptyCompleted")}
      />
      <Section
        title={t("sectionUnattended")}
        items={unattended}
        empty={t("emptyUnattended")}
      />
    </div>
  );
}