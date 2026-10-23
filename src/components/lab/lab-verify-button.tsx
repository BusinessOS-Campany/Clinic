"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cancelRequest, verifyResults } from "@/app/[locale]/(app)/lab/actions";
import { Button } from "@/components/ui/button";

export function LabVerifyButton({ requestId, resultCount }: { requestId: string; resultCount: number }) {
  const t = useTranslations("lab");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={async () => {
          const res = await cancelRequest(requestId);
          if (res.ok) router.refresh();
        }}
      >
        {t("status_CANCELLED")}
      </Button>
      <Button
        size="sm"
        variant="success"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const res = await verifyResults(requestId);
          if (res.ok) {
            toast.success(t("resultVerified"));
            router.refresh();
          } else {
            toast.error(t("resultVerified"));
          }
          setBusy(false);
        }}
      >
        <CheckCircle2 />
        {t("verifyResults")} ({resultCount})
      </Button>
    </div>
  );
}