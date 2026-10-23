"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ReceiptText, Plus } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { createEncounterInvoice } from "@/app/[locale]/(app)/billing/actions";
import { Button } from "@/components/ui/button";

export function EncounterInvoiceButton({
  encounterId,
  hasInvoice,
  invoiceId,
  canBill,
}: {
  encounterId: string;
  hasInvoice: boolean;
  invoiceId: string | null;
  canBill: boolean;
}) {
  const t = useTranslations("billing");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!canBill) return null;

  async function create() {
    setBusy(true);
    const res = await createEncounterInvoice(encounterId, locale);
    setBusy(false);
    if (res.ok) {
      toast.success(t("invoiceCreated"));
      router.refresh();
    } else if (res.error === "empty") {
      toast.error(t("nothingToBill"));
    } else {
      toast.error(t("actionFailed"));
    }
  }

  if (hasInvoice && invoiceId) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={`/billing/${invoiceId}`}>
          <ReceiptText />
          {t("viewInvoice")}
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={create} disabled={busy}>
      <Plus />
      {t("createInvoice")}
    </Button>
  );
}