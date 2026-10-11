"use client";

import { useTranslations } from "next-intl";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenVisitDialog } from "@/components/visits/open-visit-dialog";

export function OpenVisitButton({ patientId }: { patientId: string }) {
  const t = useTranslations("patients");

  return (
    <OpenVisitDialog
      patientId={patientId}
      trigger={
        <Button size="sm">
          <CalendarPlus />
          {t("openVisit")}
        </Button>
      }
    />
  );
}
