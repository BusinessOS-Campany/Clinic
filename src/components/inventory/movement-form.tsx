"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { addMovement } from "@/app/[locale]/(app)/inventory/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES = ["PURCHASE", "DISPENSE", "ADJUST", "RETURN", "DAMAGE"] as const;

export function MovementForm({ itemId }: { itemId: string }) {
  const t = useTranslations("inventory");
  const router = useRouter();
  const [type, setType] = useState<string>("PURCHASE");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await addMovement({ itemId, type, quantity, unitCost, reference, notes });
      if (res.ok) {
        toast.success(t("movementAdded"));
        setQuantity("1");
        setUnitCost("");
        setReference("");
        setNotes("");
        router.refresh();
      } else if (res.error === "conflict") {
        toast.error(t("movementAdded"));
      } else {
        toast.error(t("movementAdded"));
      }
    } catch {
      toast.error(t("movementAdded"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t("newMovement")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_100px_120px_1fr_auto] sm:items-end">
          <div className="flex flex-col gap-1.5">
            <Label>{t("type")}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((ty) => (
                  <SelectItem key={ty} value={ty}>{t(`type_${ty}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("quantity")}</Label>
            <Input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("price")}</Label>
            <Input type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("reference")}</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy}>
            <Plus />
            {t("movementAdded")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}