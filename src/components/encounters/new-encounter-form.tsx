"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { createEncounter } from "@/app/[locale]/(app)/encounters/actions";
import { VISIT_TYPES } from "@/app/[locale]/(app)/encounters/schema";
import { PatientPicker } from "@/components/appointments/patient-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export function NewEncounterForm() {
  const t = useTranslations("encounters");
  const ta = useTranslations("appointments");
  const [patientId, setPatientId] = useState("");
  const [patientLabel, setPatientLabel] = useState("");
  const [visitType, setVisitType] = useState("NEW_CONSULTATION");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setInvalid(true);
      return;
    }
    setBusy(true);
    try {
      const res = await createEncounter({
        patientId,
        visitType,
        chiefComplaint,
        referralSource,
      });
      if (res.ok) {
        toast.success(t("saved"));
        router.push(`/encounters/${res.id}`);
      } else {
        toast.error(t("savedFailed"));
      }
    } catch {
      toast.error(t("savedFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{ta("patient")}</Label>
            <PatientPicker
              value={patientId}
              onChange={(id, label) => {
                setPatientId(id);
                setPatientLabel(label);
                if (id) setInvalid(false);
              }}
              initialLabel={patientLabel}
              invalid={invalid}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("type")}</Label>
            <Select value={visitType} onValueChange={setVisitType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIT_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`visit_${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("chiefComplaint")}</Label>
            <Input value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("referralSource")}</Label>
            <Textarea
              rows={2}
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {t("startEncounter")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}