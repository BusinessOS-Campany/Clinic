"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { saveEncounterTreatmentPlan } from "@/app/[locale]/(app)/encounters/actions";
import type { PlanFormValues } from "@/app/[locale]/(app)/encounters/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PlanForm({
  encounterId,
  initial,
  readOnly,
}: {
  encounterId: string;
  initial: PlanFormValues;
  readOnly: boolean;
}) {
  const t = useTranslations("encounters");
  const tc = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<PlanFormValues>({
    plan: initial.plan ?? "",
    clinicProcedures: initial.clinicProcedures ?? "",
    homeAdvice: initial.homeAdvice ?? "",
    dietActivity: initial.dietActivity ?? "",
    redFlags: initial.redFlags ?? "",
    referralTo: initial.referralTo ?? "",
    urgent: Boolean(initial.urgent),
    sickLeaveDays: initial.sickLeaveDays ?? undefined,
    followUpNeeded: Boolean(initial.followUpNeeded),
    followUpDate: initial.followUpDate ?? "",
    patientNotes: initial.patientNotes ?? "",
  });

  const set = (k: keyof PlanFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function save() {
    setBusy(true);
    const res = await saveEncounterTreatmentPlan(encounterId, form);
    setBusy(false);
    if (res.ok) {
      toast.success(t("sectionSaved"));
      router.refresh();
    } else {
      toast.error(tc("failed"));
    }
  }

  const rows = (k: keyof PlanFormValues, label: string, placeholder?: string, r = 2) => (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Textarea
        rows={r}
        placeholder={placeholder}
        value={String(form[k] ?? "")}
        onChange={set(k)}
        disabled={readOnly}
      />
    </div>
  );

  return (
    <Card>
      <CardContent className="grid gap-4 pt-6 lg:grid-cols-2">
        {rows("plan", t("planOverview"))}
        {rows("clinicProcedures", t("clinicProcedures"))}
        {rows("homeAdvice", t("homeAdvice"))}
        {rows("dietActivity", t("dietActivity"))}
        <div className="flex flex-col gap-2 lg:col-span-2">
          {rows("redFlags", t("redFlags"))}
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("planReferral")}</Label>
          <div className="flex items-center gap-2">
            <Input value={form.referralTo ?? ""} onChange={set("referralTo")} disabled={readOnly} />
            <label className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={Boolean(form.urgent)}
                onCheckedChange={(on) => setForm({ ...form, urgent: Boolean(on) })}
                disabled={readOnly}
              />
              {t("urgent")}
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("sickLeave")}</Label>
          <Input
            type="number"
            min={0}
            value={form.sickLeaveDays ?? ""}
            onChange={(e) =>
              setForm({ ...form, sickLeaveDays: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            disabled={readOnly}
          />
        </div>
        <div className="flex flex-col gap-2 lg:col-span-2">
          <label className="flex items-center gap-1.5 text-sm">
            <Checkbox
              checked={Boolean(form.followUpNeeded)}
              onCheckedChange={(on) => setForm({ ...form, followUpNeeded: Boolean(on) })}
              disabled={readOnly}
            />
            {t("followUpNeeded")}
          </label>
          {form.followUpNeeded ? (
            <Input
              type="date"
              value={form.followUpDate ?? ""}
              onChange={set("followUpDate")}
              disabled={readOnly}
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-2 lg:col-span-2">
          {rows("patientNotes", t("patientNotes"))}
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