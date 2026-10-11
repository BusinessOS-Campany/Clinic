"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { addLabTest } from "@/app/[locale]/(app)/lab/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddTestForm() {
  const t = useTranslations("lab");
  const router = useRouter();
  const [f, setF] = useState({ code: "", nameAr: "", nameEn: "", category: "", unit: "", referenceRange: "", price: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await addLabTest(f);
      if (res.ok) {
        toast.success(t("testAdded"));
        setF({ code: "", nameAr: "", nameEn: "", category: "", unit: "", referenceRange: "", price: "" });
        router.refresh();
      } else {
        toast.error(t("testAdded"));
      }
    } catch {
      toast.error(t("testAdded"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t("addTest")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder={t("code")} value={f.code} onChange={(e) => setF((s) => ({ ...s, code: e.target.value }))} />
          <Input placeholder={t("nameAr")} value={f.nameAr} onChange={(e) => setF((s) => ({ ...s, nameAr: e.target.value }))} />
          <Input placeholder={t("nameEn")} value={f.nameEn} onChange={(e) => setF((s) => ({ ...s, nameEn: e.target.value }))} />
          <Input placeholder={t("unit")} value={f.unit} onChange={(e) => setF((s) => ({ ...s, unit: e.target.value }))} />
          <Input placeholder={t("referenceRange")} value={f.referenceRange} onChange={(e) => setF((s) => ({ ...s, referenceRange: e.target.value }))} />
          <Input type="number" min="0" step="0.01" placeholder={t("price")} value={f.price} onChange={(e) => setF((s) => ({ ...s, price: e.target.value }))} />
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" disabled={busy}>
              <Plus />
              {t("addTest")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}