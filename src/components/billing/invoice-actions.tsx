"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { addInvoiceItem, applyPayment, voidInvoice } from "@/app/[locale]/(app)/billing/actions";
import { BILLING_KINDS, PAYMENT_METHODS } from "@/app/[locale]/(app)/billing/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InvoiceActions({ invoiceId }: { invoiceId: string }) {
  const t = useTranslations("billing");
  const router = useRouter();
  const [item, setItem] = useState({ kind: "SERVICE", description: "", quantity: "1", unitPrice: "" });
  const [pay, setPay] = useState({ method: "CASH", amount: "", reference: "" });
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, successKey: string) {
    setBusy(true);
    try {
      const res = await fn();
      if (res && typeof res === "object" && "ok" in res && (res as { ok: boolean }).ok) {
        toast.success(t(successKey));
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>{t("addItem")}</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[150px_1fr_90px_120px_auto]">
          <Select value={item.kind} onValueChange={(v) => setItem((s) => ({ ...s, kind: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BILLING_KINDS.map((k) => (
                <SelectItem key={k} value={k}>{t(`kind_${k}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={t("description")}
            value={item.description}
            onChange={(e) => setItem((s) => ({ ...s, description: e.target.value }))}
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.quantity}
            onChange={(e) => setItem((s) => ({ ...s, quantity: e.target.value }))}
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => setItem((s) => ({ ...s, unitPrice: e.target.value }))}
          />
          <Button
            disabled={busy}
            onClick={() =>
              run(
                () =>
                  addInvoiceItem(invoiceId, {
                    kind: item.kind,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                  }),
                "itemAdded",
              )
            }
          >
            <Plus />
            {t("addItem")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("payment")}</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[150px_120px_1fr_auto]">
          <Select value={pay.method} onValueChange={(v) => setPay((s) => ({ ...s, method: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>{t(`paymentMethod_${m}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder={t("amount")}
            value={pay.amount}
            onChange={(e) => setPay((s) => ({ ...s, amount: e.target.value }))}
          />
          <Input
            placeholder={t("reference")}
            value={pay.reference}
            onChange={(e) => setPay((s) => ({ ...s, reference: e.target.value }))}
          />
          <Button
            variant="success"
            disabled={busy}
            onClick={() =>
              run(
                () =>
                  applyPayment(invoiceId, {
                    method: pay.method,
                    amount: pay.amount,
                    reference: pay.reference,
                  }),
                "paymentRecorded",
              )
            }
          >
            {t("pay")}
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={async () => {
            const res = await voidInvoice(invoiceId);
            if (res.ok) {
              toast.success(t("voided"));
              router.push("/billing");
            } else {
              toast.error(t("actionFailed"));
            }
          }}
        >
          <Ban />
          {t("void")}
        </Button>
      </div>
    </div>
  );
}