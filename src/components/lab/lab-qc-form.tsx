"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { addQcRecord } from "@/app/[locale]/(app)/lab/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LabQcForm({ tests }: { tests: { id: string; name: string }[] }) {
  const t = useTranslations("lab");
  const router = useRouter();
  const [f, setF] = useState({
    testId: "",
    testName: "",
    level: "",
    lotNumber: "",
    expected: "",
    observed: "",
    passed: true,
    equipment: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await addQcRecord({
        ...f,
        testId: f.testId || undefined,
        testName: f.testName || "—",
      });
      if (res.ok) {
        toast.success(t("qcAdded"));
        setF({ testId: "", testName: "", level: "", lotNumber: "", expected: "", observed: "", passed: true, equipment: "", notes: "" });
        router.refresh();
      } else toast.error(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t("addQc")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Input placeholder={t("testName")} value={f.testName} onChange={(e) => setF((s) => ({ ...s, testName: e.target.value }))} required />
          <Input placeholder={t("qcLevel")} value={f.level} onChange={(e) => setF((s) => ({ ...s, level: e.target.value }))} />
          <Input placeholder={t("lotNumber")} value={f.lotNumber} onChange={(e) => setF((s) => ({ ...s, lotNumber: e.target.value }))} />
          <Input placeholder={t("equipmentName")} value={f.equipment} onChange={(e) => setF((s) => ({ ...s, equipment: e.target.value }))} />
          <Input placeholder={t("expected")} value={f.expected} onChange={(e) => setF((s) => ({ ...s, expected: e.target.value }))} />
          <Input placeholder={t("observed")} value={f.observed} onChange={(e) => setF((s) => ({ ...s, observed: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.passed} onChange={(e) => setF((s) => ({ ...s, passed: e.target.checked }))} />
            {t("qcPassed")}
          </label>
          <Input placeholder={t("notes")} value={f.notes} onChange={(e) => setF((s) => ({ ...s, notes: e.target.value }))} />
          <div className="sm:col-span-3 lg:col-span-4">
            <Button type="submit" disabled={busy}>
              <Plus />
              {t("addQc")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
