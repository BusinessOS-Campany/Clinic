"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BadgeCheck } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { markResultsReviewed } from "@/app/[locale]/(app)/encounters/actions";
import { Button } from "@/components/ui/button";

export function ResultsReviewBanner({
  encounterId,
  show,
}: {
  encounterId: string;
  show: boolean;
}) {
  const t = useTranslations("encounters");
  const tc = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!show) return null;

  async function review() {
    setBusy(true);
    const res = await markResultsReviewed(encounterId);
    setBusy(false);
    if (res.ok) {
      toast.success(t("reviewed"));
      router.refresh();
    } else {
      toast.error(tc("failed"));
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
      <p className="text-sm font-medium">{t("reviewBanner")}</p>
      <Button size="sm" onClick={review} disabled={busy}>
        <BadgeCheck />
        {t("markReviewed")}
      </Button>
    </div>
  );
}