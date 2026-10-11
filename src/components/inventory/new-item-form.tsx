"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { createItem } from "@/app/[locale]/(app)/inventory/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewItemForm() {
  const t = useTranslations("inventory");
  const router = useRouter();
  const [f, setF] = useState({
    code: "",
    nameAr: "",
    nameEn: "",
    category: "",
    unit: "",
    quantity: "0",
    reorderLevel: "0",
    price: "0",
    expiryDate: "",
    supplier: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createItem(f);
      if (res.ok) {
        toast.success(t("itemAdded"));
        router.push(`/inventory/${res.id}`);
      } else if (res.error === "conflict") {
        toast.error(t("itemAdded"));
      } else {
        toast.error(t("itemAdded"));
      }
    } catch {
      toast.error(t("itemAdded"));
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t("newItem")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t("code")}</Label>
            <Input value={f.code} onChange={set("code")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("nameAr")}</Label>
            <Input value={f.nameAr} onChange={set("nameAr")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("nameEn")}</Label>
            <Input value={f.nameEn} onChange={set("nameEn")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("category")}</Label>
            <Input value={f.category} onChange={set("category")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("unit")}</Label>
            <Input value={f.unit} onChange={set("unit")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("quantity")}</Label>
            <Input type="number" min="0" step="1" value={f.quantity} onChange={set("quantity")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("reorderLevel")}</Label>
            <Input type="number" min="0" step="1" value={f.reorderLevel} onChange={set("reorderLevel")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("price")}</Label>
            <Input type="number" min="0" step="0.01" value={f.price} onChange={set("price")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("expiry")}</Label>
            <Input type="date" value={f.expiryDate} onChange={set("expiryDate")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("supplier")}</Label>
            <Input value={f.supplier} onChange={set("supplier")} />
          </div>
          <div className="flex items-end lg:col-span-3">
            <Button type="submit" disabled={busy}>
              <Plus />
              {t("newItem")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}