"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { addDiagnosis } from "@/app/[locale]/(app)/encounters/actions";
import {
  DIAGNOSIS_STATUSES,
  DIAGNOSIS_CLASSIFICATIONS,
  DIAGNOSIS_COURSES,
  LATERALITIES,
} from "@/app/[locale]/(app)/encounters/schema";
import { DiagnosisPicker } from "@/components/encounters/diagnosis-picker";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EncounterOption = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
};

const EMPTY_DX = {
  code: "",
  name: "",
  classification: "ICD10",
  codeSystem: "",
  status: "PROVISIONAL",
  course: "ACUTE",
  laterality: "NOT_APPLICABLE",
  onsetDate: "",
  isPrimary: false,
  isDifferential: false,
  treatmentPlan: "",
  notes: "",
};

export function DiagnosisDialog({
  patientId,
  encounters,
  defaultEncounterId,
}: {
  patientId: string;
  encounters: EncounterOption[];
  defaultEncounterId: string | null;
}) {
  const t = useTranslations("encounters");
  const tp = useTranslations("patients");
  const ta = useTranslations("appointments");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [encounterId, setEncounterId] = useState(defaultEncounterId ?? "");
  const [dx, setDx] = useState({ ...EMPTY_DX });

  const noEncounters = encounters.length === 0;

  function handleOpenChange(next: boolean) {
    if (next) {
      setEncounterId(defaultEncounterId ?? "");
      setDx({ ...EMPTY_DX });
    }
    setOpen(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!encounterId || !dx.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await addDiagnosis(encounterId, {
        code: dx.code || undefined,
        name: dx.name,
        classification: dx.classification || undefined,
        codeSystem: dx.codeSystem || undefined,
        status: dx.status,
        course: dx.course,
        laterality: dx.laterality,
        onsetDate: dx.onsetDate || undefined,
        isPrimary: dx.isPrimary,
        isDifferential: dx.isDifferential,
        treatmentPlan: dx.treatmentPlan || undefined,
        notes: dx.notes || undefined,
      });
      if (res.ok) {
        toast.success(t("saved"));
        setOpen(false);
        setDx({ ...EMPTY_DX });
        router.refresh();
      } else {
        toast.error(t("savedFailed"));
      }
    } catch {
      toast.error(t("savedFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const formId = `diagnosis-form-${patientId}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={noEncounters} title={noEncounters ? tp("noEncounters") : undefined}>
          <Plus />
          {tp("addDiagnosis")}
        </Button>
      </DialogTrigger>
      <DialogContent size="default" className="flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{tp("addDiagnosis")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pe-2">
          <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dx-encounter">{tp("selectEncounter")}</Label>
              <Select value={encounterId} onValueChange={setEncounterId} disabled={noEncounters}>
                <SelectTrigger id="dx-encounter">
                  <SelectValue placeholder={tp("selectEncounterPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {encounters.map((enc) => (
                    <SelectItem key={enc.id} value={enc.id}>
                      {fmtDate(new Date(enc.createdAt), locale)} · {ta(`type_${enc.type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("diagnosisName")}</Label>
              <DiagnosisPicker
                value={{
                  code: dx.code,
                  name: dx.name,
                  classification: dx.classification,
                  codeSystem: dx.codeSystem,
                }}
                onChange={(entry) =>
                  setDx((d) =>
                    entry
                      ? {
                          ...d,
                          code: entry.code,
                          name: entry.name,
                          classification: entry.classification || d.classification,
                          codeSystem: entry.codeSystem,
                        }
                      : { ...d, code: "", classification: "ICD10", codeSystem: "" },
                  )
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("status")}</Label>
                <Select value={dx.status} onValueChange={(v) => setDx((d) => ({ ...d, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIAGNOSIS_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{t(`diagnosisStatus_${s.toLowerCase()}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("classification")}</Label>
                <Select value={dx.classification} onValueChange={(v) => setDx((d) => ({ ...d, classification: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIAGNOSIS_CLASSIFICATIONS.map((c) => (
                      <SelectItem key={c} value={c}>{t(`classification_${c}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("course")}</Label>
                <Select value={dx.course} onValueChange={(v) => setDx((d) => ({ ...d, course: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIAGNOSIS_COURSES.map((c) => (
                      <SelectItem key={c} value={c}>{t(`course_${c}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("laterality")}</Label>
                <Select value={dx.laterality} onValueChange={(v) => setDx((d) => ({ ...d, laterality: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LATERALITIES.map((l) => (
                      <SelectItem key={l} value={l}>{t(`laterality_${l}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("onsetDate")}</Label>
                <Input type="datetime-local" value={dx.onsetDate} onChange={(e) => setDx((d) => ({ ...d, onsetDate: e.target.value }))} />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={dx.isPrimary} onChange={(e) => setDx((d) => ({ ...d, isPrimary: e.target.checked }))} />
                  {t("primaryDx")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={dx.isDifferential} onChange={(e) => setDx((d) => ({ ...d, isDifferential: e.target.checked }))} />
                  {t("differentialDx")}
                </label>
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("treatmentPlan")}</Label>
                <Textarea rows={2} value={dx.treatmentPlan} onChange={(e) => setDx((d) => ({ ...d, treatmentPlan: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("notes")}</Label>
                <Textarea rows={2} value={dx.notes} onChange={(e) => setDx((d) => ({ ...d, notes: e.target.value }))} />
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={submitting || noEncounters}>
            {submitting ? tc("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
