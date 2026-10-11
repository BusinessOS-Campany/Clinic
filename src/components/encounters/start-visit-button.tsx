"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { startEncounter } from "@/app/[locale]/(app)/encounters/actions";
import { Button } from "@/components/ui/button";

export function StartVisitButton({ appointmentId }: { appointmentId: string }) {
  const t = useTranslations("encounters");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function start() {
    setBusy(true);
    try {
      const res = await startEncounter(appointmentId);
      if (res.ok) {
        toast.success(t("startedVisit"));
        router.push(`/encounters/${res.id}`);
      } else {
        toast.error(t("savedFailed"));
      }
    } catch {
      toast.error(t("savedFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={start} disabled={busy}>
      <Stethoscope />
      {t("startVisit")}
    </Button>
  );
}