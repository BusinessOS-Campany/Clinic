"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { routeVisit } from "@/app/[locale]/(app)/visits/actions";
import { Button } from "@/components/ui/button";

export function VisitRouteActions({
  visitId,
  current,
}: {
  visitId: string;
  current: "TRIAGE" | "DOCTOR";
}) {
  const t = useTranslations("visits");
  const router = useRouter();
  const [busy, setBusy] = useState<"TRIAGE" | "DOCTOR" | null>(null);

  async function move(destination: "TRIAGE" | "DOCTOR") {
    if (destination === current) return;
    setBusy(destination);
    try {
      const res = await routeVisit(visitId, { destination });
      if (res.ok) {
        toast.success(t("routeSuccess"));
        router.refresh();
      } else {
        toast.error(t("actionFailed"));
      }
    } catch {
      toast.error(t("actionFailed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={current === "TRIAGE" ? "default" : "outline"}
        size="sm"
        disabled={busy !== null}
        onClick={() => move("TRIAGE")}
      >
        {t("sendToTriage")}
      </Button>
      <Button
        type="button"
        variant={current === "DOCTOR" ? "default" : "outline"}
        size="sm"
        disabled={busy !== null}
        onClick={() => move("DOCTOR")}
      >
        {t("sendToDoctor")}
      </Button>
    </div>
  );
}
