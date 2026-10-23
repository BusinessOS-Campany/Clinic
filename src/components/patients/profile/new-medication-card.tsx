"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { addCurrentMedication } from "@/app/[locale]/(app)/patients/profile-actions";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

const EMPTY_MED = {
  name: "",
  genericName: "",
  brandName: "",
  strength: "",
  dosageForm: "",
  route: "",
  dose: "",
  doseUnit: "",
  frequency: "",
  durationDays: "",
  quantity: "",
  unit: "",
  refills: "",
  instructions: "",
  clinicalIndication: "",
};

export function NewMedicationCard({
  patientId,
  encounters,
  defaultEncounterId,
}: {
  patientId: string;
  encounters: EncounterOption[];
  defaultEncounterId: string | null;
}) {
  const tp = useTranslations("patients");
  const ta = useTranslations("appointments");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [encounterId, setEncounterId] = useState(defaultEncounterId ?? "");
  const [listType, setListType] = useState<"current" | "previous">("current");
  const [med, setMed] = useState({ ...EMPTY_MED });

  const noEncounters = encounters.length === 0;

  function set<K extends keyof typeof EMPTY_MED>(key: K, value: string) {
    setMed((m) => ({ ...m, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!encounterId || !med.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await addCurrentMedication(patientId, {
        encounterId,
        listType,
        name: med.name,
        genericName: med.genericName || undefined,
        brandName: med.brandName || undefined,
        strength: med.strength || undefined,
        dosageForm: med.dosageForm || undefined,
        route: med.route || undefined,
        dose: med.dose || undefined,
        doseUnit: med.doseUnit || undefined,
        frequency: med.frequency || undefined,
        durationDays: med.durationDays || undefined,
        quantity: med.quantity || undefined,
        unit: med.unit || undefined,
        refills: med.refills || undefined,
        instructions: med.instructions || undefined,
        clinicalIndication: med.clinicalIndication || undefined,
      });
      if (res.ok) {
        toast.success(tp("recordSaved"));
        setMed({ ...EMPTY_MED });
        setListType("current");
        router.refresh();
      } else {
        toast.error(tp("actionFailed"));
      }
    } catch {
      toast.error(tp("actionFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const formId = `new-medication-${patientId}`;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Plus className="size-4" />
          {tp("newMedication")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <form id={formId} onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-med-encounter">{tp("selectEncounter")}</Label>
            <Select value={encounterId} onValueChange={setEncounterId} disabled={noEncounters}>
              <SelectTrigger id="new-med-encounter">
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
            <Label htmlFor="new-med-list">{tp("medicationListType")}</Label>
            <Select value={listType} onValueChange={(v) => setListType(v as "current" | "previous")}>
              <SelectTrigger id="new-med-list">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">{tp("currentMedications")}</SelectItem>
                <SelectItem value="previous">{tp("previousPrescriptions")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="new-med-name">{tp("medicationName")} *</Label>
            <Input id="new-med-name" dir="ltr" required value={med.name} onChange={(e) => set("name", e.target.value)} placeholder={tp("medicationNamePlaceholder")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-generic">{tp("genericName")}</Label>
              <Input id="new-med-generic" dir="ltr" value={med.genericName} onChange={(e) => set("genericName", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-brand">{tp("brandName")}</Label>
              <Input id="new-med-brand" dir="ltr" value={med.brandName} onChange={(e) => set("brandName", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-strength">{tp("strength")}</Label>
              <Input id="new-med-strength" dir="ltr" value={med.strength} onChange={(e) => set("strength", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-form">{tp("dosageForm")}</Label>
              <Input id="new-med-form" dir="ltr" value={med.dosageForm} onChange={(e) => set("dosageForm", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-route">{tp("route")}</Label>
              <Input id="new-med-route" dir="ltr" value={med.route} onChange={(e) => set("route", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-frequency">{tp("frequency")}</Label>
              <Input id="new-med-frequency" value={med.frequency} onChange={(e) => set("frequency", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-dose">{tp("dose")}</Label>
              <Input id="new-med-dose" type="number" step="any" min="0" dir="ltr" value={med.dose} onChange={(e) => set("dose", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-dose-unit">{tp("doseUnit")}</Label>
              <Input id="new-med-dose-unit" dir="ltr" value={med.doseUnit} onChange={(e) => set("doseUnit", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-duration">{tp("durationDays")}</Label>
              <Input id="new-med-duration" type="number" min="1" dir="ltr" value={med.durationDays} onChange={(e) => set("durationDays", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-refills">{tp("refills")}</Label>
              <Input id="new-med-refills" type="number" min="0" dir="ltr" value={med.refills} onChange={(e) => set("refills", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-quantity">{tp("qty")}</Label>
              <Input id="new-med-quantity" dir="ltr" value={med.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-med-unit">{tp("unit")}</Label>
              <Input id="new-med-unit" dir="ltr" value={med.unit} onChange={(e) => set("unit", e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="new-med-indication">{tp("indication")}</Label>
            <Input id="new-med-indication" value={med.clinicalIndication} onChange={(e) => set("clinicalIndication", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-med-instructions">{tp("instructions")}</Label>
            <Textarea id="new-med-instructions" rows={2} value={med.instructions} onChange={(e) => set("instructions", e.target.value)} />
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button type="submit" form={formId} disabled={submitting || noEncounters} className="w-full">
          {submitting ? tc("saving") : tp("newMedication")}
        </Button>
      </CardFooter>
    </Card>
  );
}
