"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Plus, Printer, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  cancelPrescription,
  checkPrescriptionSafety,
  createPrescription,
  signPrescription,
  type SafetyAlert,
} from "@/app/[locale]/(app)/prescriptions/actions";
import type { PrescriptionItemValues } from "@/app/[locale]/(app)/prescriptions/schema";
import { Badge } from "@/components/ui/badge";
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

export type ComposerMedication = {
  id: string;
  code: string;
  genericName: string;
  brandName: string | null;
  strength: string | null;
  strengthUnit: string | null;
  form: string;
  route: string;
};

export type EncounterPrescription = {
  id: string;
  prescriptionNo: string;
  status: string;
  items: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    quantity: string;
    unit: string | null;
  }[];
};

const SEVERITY_STYLE: Record<string, string> = {
  MINOR: "border-sky-300 bg-sky-50 text-sky-800",
  MODERATE: "border-amber-300 bg-amber-50 text-amber-800",
  MAJOR: "border-orange-400 bg-orange-50 text-orange-900",
  CONTRAINDICATED: "border-red-400 bg-red-50 text-red-900",
};

const STATUS_BADGE: Record<string, "secondary" | "info" | "success" | "warning" | "destructive"> = {
  DRAFT: "secondary",
  SIGNED: "info",
  PARTIALLY_DISPENSED: "warning",
  DISPENSED: "success",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export function PrescriptionPanel({
  encounterId,
  patientId,
  medications,
  prescriptions,
  canPrescribe,
}: {
  encounterId: string;
  patientId: string;
  medications: ComposerMedication[];
  prescriptions: EncounterPrescription[];
  canPrescribe: boolean;
}) {
  const t = useTranslations("prescriptions");
  const router = useRouter();

  const [medId, setMedId] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [itemInstructions, setItemInstructions] = useState("");
  const [cart, setCart] = useState<PrescriptionItemValues[]>([]);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [overrideReason, setOverrideReason] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [busy, setBusy] = useState(false);

  const overrideRequired = useMemo(
    () => alerts.some((a) => a.severity === "MAJOR" || a.severity === "CONTRAINDICATED"),
    [alerts],
  );

  useEffect(() => {
    let active = true;
    if (cart.length === 0 || !canPrescribe) {
      setAlerts([]);
      return;
    }
    checkPrescriptionSafety({
      patientId,
      items: cart.map((it) => ({
        medicationId: it.medicationId,
        medicationName: it.medicationName,
        genericName: it.genericName ?? null,
      })),
    })
      .then((res) => {
        if (active) setAlerts(res.alerts);
      })
      .catch(() => {
        if (active) setAlerts([]);
      });
    return () => {
      active = false;
    };
  }, [cart, patientId, canPrescribe]);

  const medicationById = useMemo(
    () => new Map(medications.map((m) => [m.id, m])),
    [medications],
  );

  function addToCart() {
    const med = medicationById.get(medId);
    if (!med) {
      toast.error(t("selectMedication"));
      return;
    }
    if (!dosage.trim() || !frequency.trim()) {
      toast.error(t("dosageRequired"));
      return;
    }
    const label = med.brandName ? `${med.genericName} (${med.brandName})` : med.genericName;
    setCart((c) => [
      ...c,
      {
        medicationId: med.id,
        medicationName: label,
        genericName: med.genericName,
        strength: med.strength
          ? `${med.strength} ${med.strengthUnit ?? ""}`.trim()
          : undefined,
        form: med.form as PrescriptionItemValues["form"],
        route: med.route as PrescriptionItemValues["route"],
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        durationDays: durationDays ? Number(durationDays) : undefined,
        quantity: quantity ? Number(quantity) : 0,
        unit: unit.trim() || undefined,
        instructions: itemInstructions.trim() || undefined,
      },
    ]);
    setMedId("");
    setDosage("");
    setFrequency("");
    setDurationDays("");
    setQuantity("");
    setUnit("");
    setItemInstructions("");
  }

  async function save(sign: boolean) {
    if (cart.length === 0) return;
    if (overrideRequired && !overrideReason.trim()) {
      toast.error(t("overrideRequired"));
      return;
    }
    setBusy(true);
    const res = await createPrescription({
      encounterId,
      patientId,
      items: cart,
      followUpDate: followUpDate || undefined,
      notes: notes.trim() || undefined,
      overrideReason: overrideReason.trim() || undefined,
      sign,
    });
    setBusy(false);
    if (!res.ok) {
      if (res.error === "override-required") {
        toast.error(t("overrideRequired"));
      } else {
        toast.error(t("saveFailed"));
      }
      return;
    }
    toast.success(sign ? t("signedOk") : t("draftOk"));
    setCart([]);
    setAlerts([]);
    setOverrideReason("");
    setNotes("");
    setFollowUpDate("");
    router.refresh();
  }

  async function handleSign(id: string) {
    const res = await signPrescription(id);
    if (res.ok) router.refresh();
    else toast.error(t("saveFailed"));
  }

  async function handleCancel(id: string) {
    const reason = window.prompt(t("cancelReasonPrompt"));
    if (reason === null) return;
    const res = await cancelPrescription(id, reason);
    if (res.ok) router.refresh();
    else toast.error(t("saveFailed"));
  }

  return (
    <div className="flex flex-col gap-4">
      {prescriptions.length > 0 && (
        <ul className="flex flex-col divide-y rounded-xl border">
          {prescriptions.map((rx) => (
            <li key={rx.id} className="flex flex-col gap-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium">{rx.prescriptionNo}</span>
                <Badge variant={STATUS_BADGE[rx.status] ?? "secondary"}>
                  {t(`status_${rx.status}`)}
                </Badge>
                <span className="flex-1 text-xs text-muted-foreground">
                  {rx.items.length} {t("itemsCount")}
                </span>
                <Button asChild size="sm" variant="outline">
                  <a href={`/prescriptions/${rx.id}`} target="_blank" rel="noreferrer">
                    <Printer />
                    {t("print")}
                  </a>
                </Button>
                {canPrescribe && rx.status === "DRAFT" && (
                  <Button size="sm" onClick={() => handleSign(rx.id)}>
                    {t("sign")}
                  </Button>
                )}
                {canPrescribe &&
                  rx.status !== "CANCELLED" &&
                  rx.status !== "DISPENSED" &&
                  rx.status !== "COMPLETED" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCancel(rx.id)}
                    >
                      <Trash2 />
                    </Button>
                  )}
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {rx.items.map((it) => (
                  <li key={it.id}>
                    {it.medicationName} — {it.dosage} · {it.frequency}
                    {it.quantity && Number(it.quantity) > 0
                      ? ` · ${it.quantity} ${it.unit ?? ""}`.trimEnd()
                      : ""}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {canPrescribe && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("medication")}</Label>
                <Select value={medId} onValueChange={setMedId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectMedication")} />
                  </SelectTrigger>
                  <SelectContent>
                    {medications.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.genericName}
                        {m.brandName ? ` (${m.brandName})` : ""}
                        {m.strength ? ` · ${m.strength} ${m.strengthUnit ?? ""}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("dosage")}</Label>
                <Input
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder={t("dosagePlaceholder")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("frequency")}</Label>
                <Input
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder={t("frequencyPlaceholder")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("duration")}</Label>
                <Input
                  inputMode="numeric"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-2">
                  <Label>{t("quantity")}</Label>
                  <Input
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t("unit")}</Label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("itemInstructions")}</Label>
                <Input
                  value={itemInstructions}
                  onChange={(e) => setItemInstructions(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={addToCart}>
                <Plus />
                {t("addItem")}
              </Button>
            </div>

            {cart.length > 0 && (
              <ul className="flex flex-col divide-y rounded-md border">
                {cart.map((it, idx) => (
                  <li key={`${it.medicationId}-${idx}`} className="flex items-center gap-2 p-2 text-sm">
                    <span className="flex-1">
                      {it.medicationName} — {it.dosage} · {it.frequency}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setCart((c) => c.filter((_, i) => i !== idx))}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {alerts.length > 0 && (
              <ul className="flex flex-col gap-2">
                {alerts.map((a, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-2 rounded-md border p-2 text-sm ${
                      SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.MODERATE
                    }`}
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <strong>{t(`alert_${a.kind}`)}</strong> — {a.medication} / {a.against}
                      {a.detail ? `: ${a.detail}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {overrideRequired && (
              <div className="flex flex-col gap-2">
                <Label>{t("overrideReason")}</Label>
                <Textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("followUp")}</Label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("notes")}</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={busy || cart.length === 0}
                onClick={() => save(false)}
              >
                {t("saveDraft")}
              </Button>
              <Button disabled={busy || cart.length === 0} onClick={() => save(true)}>
                {t("saveAndSign")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
