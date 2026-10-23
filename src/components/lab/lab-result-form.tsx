"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { enterResults } from "@/app/[locale]/(app)/lab/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Row = { id: string; name: string; unit: string | null; value: string | null; isAbnormal: boolean | null };

export function LabResultForm({ requestId, tests }: { requestId: string; tests: Row[] }) {
  const t = useTranslations("lab");
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(tests.map((r) => ({ ...r, value: r.value ?? "" })));
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await enterResults(
        requestId,
        rows.map((r) => ({ resultId: r.id, value: r.value ?? "", isAbnormal: r.isAbnormal ?? false })),
      );
      if (res.ok) {
        toast.success(t("resultSaved"));
        router.refresh();
      } else {
        toast.error(t("resultSaved"));
      }
    } catch {
      toast.error(t("resultSaved"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t("enterResults")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div key={row.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_90px_auto] sm:items-center">
              <div className="flex flex-col gap-1">
                <Label>{row.name}</Label>
                {row.unit && <span className="text-xs text-muted-foreground">{row.unit}</span>}
              </div>
              <Input
                value={row.value ?? ""}
                onChange={(e) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.isAbnormal ?? false}
                  onChange={(e) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, isAbnormal: e.target.checked } : r)))}
                />
                {t("abnormal")}
              </label>
            </div>
          ))}
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              <Save />
              {t("resultSaved")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}