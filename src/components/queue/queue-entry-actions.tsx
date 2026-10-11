"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { setQueueEntryStatus } from "@/app/[locale]/(app)/visits/actions";
import type { QueueEntryStatusValue } from "@/app/[locale]/(app)/visits/schema";
import { Button } from "@/components/ui/button";

export function QueueEntryActions({
  entryId,
  status,
}: {
  entryId: string;
  status: string;
}) {
  const t = useTranslations("queue");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(next: QueueEntryStatusValue) {
    setBusy(true);
    try {
      const res = await setQueueEntryStatus(entryId, next);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(t("actionFailed"));
      }
    } catch {
      toast.error(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {status === "WAITING" && (
        <Button variant="outline" size="sm" disabled={busy} onClick={() => set("CALLED")}>
          {t("call")}
        </Button>
      )}
      {(status === "WAITING" || status === "CALLED") && (
        <Button variant="outline" size="sm" disabled={busy} onClick={() => set("IN_PROGRESS")}>
          {t("start")}
        </Button>
      )}
      {status === "IN_PROGRESS" && (
        <Button size="sm" disabled={busy} onClick={() => set("DONE")}>
          {t("done")}
        </Button>
      )}
      {status !== "DONE" && (
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => set("SKIPPED")}>
          {t("skip")}
        </Button>
      )}
    </div>
  );
}
