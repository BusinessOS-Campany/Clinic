"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { dispensePrescriptionItem } from "@/app/[locale]/(app)/prescriptions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PrescriptionDispense({
  prescriptionItemId,
  remaining,
  items,
}: {
  prescriptionItemId: string;
  remaining: number;
  items: { id: string; label: string; disabled: boolean }[];
}) {
  const t = useTranslations("prescriptions");
  const tp = useTranslations("pharmacy");
  const router = useRouter();
  const [quantity, setQuantity] = useState(String(remaining));
  const [inventoryItemId, setInventoryItemId] = useState("none");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await dispensePrescriptionItem({
      prescriptionItemId,
      quantity: Number(quantity),
      inventoryItemId: inventoryItemId === "none" ? null : inventoryItemId,
    });
    setBusy(false);
    if (res.ok) {
      toast.success(tp("dispensedOk"));
      router.refresh();
    } else {
      toast.error(tp("dispenseFailed"));
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Input
        className="w-20"
        inputMode="numeric"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      {items.length > 0 && (
        <Select value={inventoryItemId} onValueChange={setInventoryItemId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{tp("noStockMatch")}</SelectItem>
            {items.map((i) => (
              <SelectItem key={i.id} value={i.id} disabled={i.disabled}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button size="sm" onClick={submit} disabled={busy}>
        {tp("dispense")}
      </Button>
    </div>
  );
}
