"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Activity, Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { recordVitals } from "@/app/[locale]/(app)/nursing/actions";
import {
  VITAL_CONSCIOUSNESS,
  GLUCOSE_TYPES,
  VITAL_POSITIONS,
} from "@/app/[locale]/(app)/nursing/schema";
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

const NONE = "none";

const EMPTY = {
  temperature: "",
  pulse: "",
  respRate: "",
  bpSystolic: "",
  bpDiastolic: "",
  spO2: "",
  height: "",
  weight: "",
  painScore: "",
  consciousness: NONE,
  glucose: "",
  glucoseType: NONE,
  glucoseTiming: "",
  position: NONE,
  device: "",
  notes: "",
};

function trim(v: string) {
  return v.trim() ? v : undefined;
}

function enumOrUndef(v: string) {
  return v && v !== NONE ? v : undefined;
}

export function VitalsDialog({
  patientId,
  patientName,
  encounterId,
}: {
  patientId: string;
  patientName: string;
  encounterId: string | null;
}) {
  const t = useTranslations("vitals");
  const tc = useTranslations("common");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleOpenChange(next: boolean) {
    if (next) setForm({ ...EMPTY });
    setOpen(next);
  }

  const hasMeasurement =
    form.temperature.trim() !== "" ||
    form.pulse.trim() !== "" ||
    form.respRate.trim() !== "" ||
    form.bpSystolic.trim() !== "" ||
    form.bpDiastolic.trim() !== "" ||
    form.spO2.trim() !== "" ||
    form.height.trim() !== "" ||
    form.weight.trim() !== "" ||
    form.painScore.trim() !== "" ||
    form.consciousness !== NONE ||
    form.glucose.trim() !== "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasMeasurement) {
      toast.error(t("errorEmpty"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await recordVitals(patientId, {
        encounterId: encounterId ?? undefined,
        temperature: trim(form.temperature),
        pulse: trim(form.pulse),
        respRate: trim(form.respRate),
        bpSystolic: trim(form.bpSystolic),
        bpDiastolic: trim(form.bpDiastolic),
        spO2: trim(form.spO2),
        height: trim(form.height),
        weight: trim(form.weight),
        painScore: trim(form.painScore),
        consciousness: enumOrUndef(form.consciousness),
        glucose: trim(form.glucose),
        glucoseType: enumOrUndef(form.glucoseType),
        glucoseTiming: trim(form.glucoseTiming),
        position: enumOrUndef(form.position),
        device: trim(form.device),
        notes: trim(form.notes),
      });
      if (res.ok) {
        toast.success(t("saved"));
        for (const alert of res.alerts) {
          if (alert.severity === "CRITICAL") toast.error(alert.message);
          else toast.warning(alert.message);
        }
        setOpen(false);
        setForm({ ...EMPTY });
        router.refresh();
      } else if (res.error === "empty") {
        toast.error(t("errorEmpty"));
      } else {
        toast.error(tc("failed"));
      }
    } catch {
      toast.error(tc("failed"));
    } finally {
      setSubmitting(false);
    }
  }

  const formId = `vitals-form-${patientId}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          {t("recordVitals")}
        </Button>
      </DialogTrigger>
      <DialogContent size="default" className="flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            {t("recordTitle")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{patientName}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pe-2">
          <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">{t("optionalHint")}</p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-temp">
                  {t("temperature")} <span className="text-muted-foreground">({t("unitTemp")})</span>
                </Label>
                <Input id="vt-temp" dir="ltr" type="number" step="0.1" min={25} max={45} value={form.temperature} onChange={(e) => set("temperature", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-pulse">
                  {t("pulse")} <span className="text-muted-foreground">({t("unitPulse")})</span>
                </Label>
                <Input id="vt-pulse" dir="ltr" type="number" min={20} max={300} value={form.pulse} onChange={(e) => set("pulse", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-resp">
                  {t("respRate")} <span className="text-muted-foreground">({t("unitResp")})</span>
                </Label>
                <Input id="vt-resp" dir="ltr" type="number" min={4} max={80} value={form.respRate} onChange={(e) => set("respRate", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-sys">{t("bpSystolic")}</Label>
                <Input id="vt-sys" dir="ltr" type="number" min={50} max={300} value={form.bpSystolic} onChange={(e) => set("bpSystolic", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-dia">{t("bpDiastolic")}</Label>
                <Input id="vt-dia" dir="ltr" type="number" min={20} max={200} value={form.bpDiastolic} onChange={(e) => set("bpDiastolic", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-spo2">
                  {t("spO2")} <span className="text-muted-foreground">({t("unitSpo2")})</span>
                </Label>
                <Input id="vt-spo2" dir="ltr" type="number" min={40} max={100} value={form.spO2} onChange={(e) => set("spO2", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-height">
                  {t("height")} <span className="text-muted-foreground">({t("unitHeight")})</span>
                </Label>
                <Input id="vt-height" dir="ltr" type="number" step="0.1" min={20} max={250} value={form.height} onChange={(e) => set("height", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-weight">
                  {t("weight")} <span className="text-muted-foreground">({t("unitWeight")})</span>
                </Label>
                <Input id="vt-weight" dir="ltr" type="number" step="0.1" min={0.5} max={500} value={form.weight} onChange={(e) => set("weight", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-pain">
                  {t("painScore")} <span className="text-muted-foreground">({t("painScale")})</span>
                </Label>
                <Input id="vt-pain" dir="ltr" type="number" min={0} max={10} value={form.painScore} onChange={(e) => set("painScore", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("consciousness")}</Label>
                <Select value={form.consciousness} onValueChange={(v) => set("consciousness", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{tc("none")}</SelectItem>
                    {VITAL_CONSCIOUSNESS.map((c) => (
                      <SelectItem key={c} value={c}>{t(`consciousness_${c}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-glucose">
                  {t("glucose")} <span className="text-muted-foreground">({t("unitGlucose")})</span>
                </Label>
                <Input id="vt-glucose" dir="ltr" type="number" step="0.1" min={10} max={1000} value={form.glucose} onChange={(e) => set("glucose", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("glucoseType")}</Label>
                <Select value={form.glucoseType} onValueChange={(v) => set("glucoseType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{tc("none")}</SelectItem>
                    {GLUCOSE_TYPES.map((g) => (
                      <SelectItem key={g} value={g}>{t(`glucoseType_${g}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="vt-glucose-timing">{t("glucoseTiming")}</Label>
                <Input id="vt-glucose-timing" value={form.glucoseTiming} placeholder={t("glucoseTimingPlaceholder")} onChange={(e) => set("glucoseTiming", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("position")}</Label>
                <Select value={form.position} onValueChange={(v) => set("position", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{tc("none")}</SelectItem>
                    {VITAL_POSITIONS.map((p) => (
                      <SelectItem key={p} value={p}>{t(`position_${p}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="vt-device">{t("device")}</Label>
              <Input id="vt-device" value={form.device} onChange={(e) => set("device", e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="vt-notes">{t("notes")}</Label>
              <Textarea id="vt-notes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </form>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={submitting}>
            {submitting ? tc("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
