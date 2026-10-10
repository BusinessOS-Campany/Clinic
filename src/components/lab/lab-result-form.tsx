"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { enterResults } from "@/app/[locale]/(app)/lab/actions";
import { computeFlag, pickRange, type RangeLike } from "@/app/[locale]/(app)/lab/flag";
import { LAB_RESULT_FLAGS } from "@/app/[locale]/(app)/lab/schema";
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

type Row = {
  id: string;
  name: string;
  unit: string | null;
  value: string | null;
  flag: string | null;
  method: string | null;
  comments: string | null;
  ranges: RangeLike[];
};

const FLAG_STYLE: Record<string, string> = {
  CRITICAL_LOW: "text-red-600",
  CRITICAL_HIGH: "text-red-600",
  LOW: "text-amber-600",
  HIGH: "text-amber-600",
  ABNORMAL: "text-amber-600",
  NORMAL: "text-emerald-600",
};

export function LabResultForm({
  requestId,
  tests,
  patientSex,
  patientAgeYears,
}: {
  requestId: string;
  tests: Row[];
  patientSex: string | null;
  patientAgeYears: number | null;
}) {
  const t = useTranslations("lab");
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(
    tests.map((r) => ({ ...r, value: r.value ?? "", flag: r.flag ?? "" })),
  );
  const [busy, setBusy] = useState(false);

  function update(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function preview(row: Row): string | null {
    const n = Number(row.value);
    if (row.value === "" || !Number.isFinite(n)) return null;
    const range = pickRange(row.ranges, patientSex, patientAgeYears);
    return computeFlag(n, range);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await enterResults(
        requestId,
        rows.map((r) => {
          const n = Number(r.value);
          return {
            resultId: r.id,
            value: r.value ?? "",
            valueNumeric: r.value !== "" && Number.isFinite(n) ? n : undefined,
            flag: r.flag ? (r.flag as (typeof LAB_RESULT_FLAGS)[number]) : undefined,
            method: r.method ?? undefined,
            comments: r.comments ?? undefined,
          };
        }),
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
        <form onSubmit={submit} className="flex flex-col gap-4">
          {rows.map((row, i) => {
            const p = preview(row);
            return (
              <div key={row.id} className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[1.2fr_1fr_1fr_1fr]">
                <div className="flex flex-col gap-1">
                  <Label>{row.name}</Label>
                  {row.unit && <span className="text-xs text-muted-foreground">{row.unit}</span>}
                  {p && <span className={`text-xs font-medium ${FLAG_STYLE[p] ?? ""}`}>{t(`flag_${p}`)}</span>}
                </div>
                <Input
                  placeholder={t("resultValue")}
                  value={row.value ?? ""}
                  onChange={(e) => update(i, { value: e.target.value })}
                />
                <Select value={row.flag || "__auto"} onValueChange={(val) => update(i, { flag: val === "__auto" ? "" : val })}>
                  <SelectTrigger size="sm">
                    <SelectValue placeholder={t("autoFlag")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__auto">{t("autoFlag")}</SelectItem>
                    {LAB_RESULT_FLAGS.map((fl) => (
                      <SelectItem key={fl} value={fl}>
                        {t(`flag_${fl}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder={t("method")}
                    value={row.method ?? ""}
                    onChange={(e) => update(i, { method: e.target.value })}
                  />
                  <Input
                    placeholder={t("comments")}
                    value={row.comments ?? ""}
                    onChange={(e) => update(i, { comments: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
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
