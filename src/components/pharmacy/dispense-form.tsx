"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PackageCheck } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { dispenseOrder } from "@/app/[locale]/(app)/pharmacy/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DispenseForm({
  orderId,
  medicationName,
  orderQuantity,
  orderUnit,
  orderInstructions,
  items,
}: {
  orderId: string;
  medicationName: string;
  orderQuantity: string | null;
  orderUnit: string | null;
  orderInstructions: string | null;
  items: { id: string; label: string; disabled: boolean }[];
}) {
  const t = useTranslations("pharmacy");
  const router = useRouter();
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await dispenseOrder(orderId, { inventoryItemId, quantity, notes });
      if (res.ok) {
        toast.success(t("dispensedOk"));
        router.refresh();
      } else if (res.error === "conflict") {
        toast.error(t("noStockMatch"));
      } else {
        toast.error(t("dispenseFailed"));
      }
    } catch {
      toast.error(t("dispenseFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[1fr_100px_1fr_auto] sm:items-end">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{t("inventoryItem")}</span>
        <Select value={inventoryItemId} onValueChange={setInventoryItemId}>
          <SelectTrigger>
            <SelectValue placeholder={t("selectItem")} />
          </SelectTrigger>
          <SelectContent>
            {items.map((i) => (
              <SelectItem key={i.id} value={i.id} disabled={i.disabled}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{t("qtyToDispense")}</span>
        <Input type="number" min="0.5" step="0.5" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <Input placeholder={t("instructions")} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="submit" variant="success" disabled={busy}>
        <PackageCheck />
        {t("dispense")}
      </Button>
    </form>
  );
}