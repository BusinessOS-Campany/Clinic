"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { saveEncounterExamination } from "@/app/[locale]/(app)/encounters/actions";
import { EXAM_SECTIONS, type ExamFormValues } from "@/app/[locale]/(app)/encounters/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SECTIONS = [...EXAM_SECTIONS, "examNotes" as const];

export function ExamForm({
  encounterId,
  initial,
  readOnly,
}: {
  encounterId: string;
  initial: ExamFormValues;
  readOnly: boolean;
}) {
  const t = useTranslations("encounters");
  const tc = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(SECTIONS.map((s) => [s, initial[s] ?? ""])),
  );

  async function save() {
    setBusy(true);
    const res = await saveEncounterExamination(encounterId, form as ExamFormValues);
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
        {SECTIONS.map((s) => (
          <div
            key={s}
            className={s === "additional" || s === "examNotes" ? "flex flex-col gap-2 lg:col-span-2" : "flex flex-col gap-2"}
          >
            <Label>{t(`section_${s}`)}</Label>
            <Textarea
              rows={s === "examNotes" || s === "additional" ? 2 : 3}
              value={form[s]}
              onChange={(e) => setForm({ ...form, [s]: e.target.value })}
              disabled={readOnly}
            />
          </div>
        ))}
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