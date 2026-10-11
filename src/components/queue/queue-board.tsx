"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/data/status-badge";
import { callNextEntry } from "@/app/[locale]/(app)/visits/actions";
import { QueueEntryActions } from "@/components/queue/queue-entry-actions";

export type QueueEntryItem = {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  time: string;
  status: string;
  priority: string;
  position: number;
  doctorName: string | null;
  encounterId: string | null;
  canViewEncounter: boolean;
};

export type QueueColumn = {
  id: string;
  name: string;
  kind: string;
  entries: QueueEntryItem[];
};

export function QueueBoard({
  columns,
  canWrite,
}: {
  columns: QueueColumn[];
  canWrite: boolean;
}) {
  const t = useTranslations("queue");
  const router = useRouter();
  const [busyQueue, setBusyQueue] = useState<string | null>(null);

  async function callNext(queueId: string) {
    setBusyQueue(queueId);
    try {
      const res = await callNextEntry(queueId);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(t("emptyQueue"));
      }
    } catch {
      toast.error(t("actionFailed"));
    } finally {
      setBusyQueue(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {columns.map((queue) => (
        <section key={queue.id} className="overflow-hidden rounded-xl border bg-card">
          <header className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{queue.name}</h2>
              <span className="rounded-full bg-background px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                {queue.entries.length}
              </span>
            </div>
            {canWrite && (
              <Button
                variant="outline"
                size="sm"
                disabled={busyQueue === queue.id || queue.entries.length === 0}
                onClick={() => callNext(queue.id)}
              >
                {t("callNext")}
              </Button>
            )}
          </header>
          {queue.entries.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("emptyColumn")}
            </p>
          ) : (
            <div className="flex flex-col">
              {queue.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
                    {entry.position}
                  </span>
                  <div className="min-w-32 flex-1">
                    <Link
                      href={`/patients/${entry.patientId}`}
                      className="font-medium hover:underline"
                    >
                      {entry.patientName}
                    </Link>
                    <span className="ms-2 font-mono text-xs text-muted-foreground">
                      {entry.mrn}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                    {entry.time}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {entry.doctorName ?? "—"}
                  </span>
                  {entry.priority !== "NORMAL" && (
                    <StatusBadge status={entry.priority}>
                      {t(`priority_${entry.priority}`)}
                    </StatusBadge>
                  )}
                  <StatusBadge status={entry.status}>
                    {t(`entryStatus_${entry.status}`)}
                  </StatusBadge>
                  <div className="ms-auto flex items-center gap-2">
                    {entry.encounterId && entry.canViewEncounter && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/encounters/${entry.encounterId}`}>{t("openFile")}</Link>
                      </Button>
                    )}
                    {canWrite && (
                      <QueueEntryActions entryId={entry.id} status={entry.status} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
