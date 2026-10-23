"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { saveEncounterHistory } from "@/app/[locale]/(app)/encounters/actions";
import { SYMPTOM_NATURES, type HistoryFormValues } from "@/app/[locale]/(app)/encounters/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function HistoryForm({
  encounterId,
  initial,
  readOnly,
}: {
  encounterId: string;
  initial: HistoryFormValues;
  readOnly: boolean;
}) {
  const t = useTranslations("encounters");
  const tc = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<HistoryFormValues>({
    painLocation: initial.painLocation ?? "",
    symptomNature: initial.symptomNature ?? undefined,
    aggravatingFactors: initial.aggravatingFactors ?? "",
    alleviatingFactors: initial.alleviatingFactors ?? "",
    hpi: initial.hpi ?? "",
    pastHistory: initial.pastHistory ?? "",
    familyHistory: initial.familyHistory ?? "",
    socialHistory: initial.socialHistory ?? "",
    ros: initial.ros ?? "",
    historyNotes: initial.historyNotes ?? "",
  });

  const set = (k: keyof HistoryFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function save() {
    setBusy(true);
    const res = await saveEncounterHistory(encounterId, form);
    setBusy(false);
    if (res.ok) {
      toast.success(t("sectionSaved"));
      router.refresh();
    } else {
      toast.error(tc("failed"));
    }
  }

  return (
    <Card>
      <CardContent className="grid gap-4 pt-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>{t("painLocation")}</Label>
          <Input value={form.painLocation ?? ""} onChange={set("painLocation")} disabled={readOnly} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("symptomNature")}</Label>
          <Select
            value={form.symptomNature}
            onValueChange={(v) => setForm({ ...form, symptomNature: v as HistoryFormValues["symptomNature"] })}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("symptomNaturePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {SYMPTOM_NATURES.map((n) => (
                <SelectItem key={n} value={n}>
                  {t(`nature_${n}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("aggravatingFactors")}</Label>
          <Textarea rows={2} value={form.aggravatingFactors ?? ""} onChange={set("aggravatingFactors")} disabled={readOnly} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("alleviatingFactors")}</Label>
          <Textarea rows={2} value={form.alleviatingFactors ?? ""} onChange={set("alleviatingFactors")} disabled={readOnly} />
        </div>
        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label>{t("hpi")}</Label>
          <Textarea
            rows={4}
            placeholder={t("hpiPlaceholder")}
            value={form.hpi ?? ""}
            onChange={set("hpi")}
            disabled={readOnly}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("pastHistory")}</Label>
          <Textarea rows={3} value={form.pastHistory ?? ""} onChange={set("pastHistory")} disabled={readOnly} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("familyHistory")}</Label>
          <Textarea rows={3} value={form.familyHistory ?? ""} onChange={set("familyHistory")} disabled={readOnly} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("socialHistory")}</Label>
          <Textarea rows={3} value={form.socialHistory ?? ""} onChange={set("socialHistory")} disabled={readOnly} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("ros")}</Label>
          <Textarea rows={3} placeholder={t("rosPlaceholder")} value={form.ros ?? ""} onChange={set("ros")} disabled={readOnly} />
        </div>
        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label>{t("historyNotes")}</Label>
          <Textarea rows={2} value={form.historyNotes ?? ""} onChange={set("historyNotes")} disabled={readOnly} />
        </div>
        {!readOnly && (
          <div className="lg:col-span-2 flex justify-end">
            <Button onClick={save} disabled={busy}>
              {t("saveSection")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}