"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { refundPayment } from "@/app/[locale]/(app)/billing/actions";
import { Button } from "@/components/ui/button";

export function RefundPaymentButton({ paymentId }: { paymentId: string }) {
  const t = useTranslations("billing");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function refund() {
    if (!window.confirm(t("confirmRefund"))) return;
    setBusy(true);
    const res = await refundPayment(paymentId);
    setBusy(false);
    if (res.ok) {
      toast.success(t("refunded"));
      router.refresh();
    } else {
      toast.error(t("actionFailed"));
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={refund} disabled={busy} title={t("refund")}>
      <Undo2 />
      {t("refund")}
    </Button>
  );
}