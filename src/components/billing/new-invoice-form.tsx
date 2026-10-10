"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { createInvoice } from "@/app/[locale]/(app)/billing/actions";
import { BILLING_KINDS } from "@/app/[locale]/(app)/billing/schema";
import { round2, toNumber } from "@/lib/format";
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

type Line = {
  kind: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export function NewInvoiceForm({
  initialPatient,
}: {
  initialPatient?: { id: string; label: string };
}) {
  const t = useTranslations("billing");
  const ta = useTranslations("appointments");
  const [patientId, setPatientId] = useState(initialPatient?.id ?? "");
  const [patientLabel, setPatientLabel] = useState(initialPatient?.label ?? "");
  const [lines, setLines] = useState<Line[]>([
    { kind: "SERVICE", description: "", quantity: "1", unitPrice: "" },
  ]);
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const router = useRouter();

  const subtotal = round2(
    lines.reduce((s, l) => s + toNumber(l.quantity) * toNumber(l.unitPrice), 0),
  );
  const total = round2((subtotal - toNumber(discount)) * (1 + toNumber(taxRate) / 100));

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setInvalid(true);
      return;
    }
    setBusy(true);
    try {
      const res = await createInvoice({
        patientId,
        items: lines.map((l) => ({
          kind: l.kind,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        discount,
        taxRate,
        notes,
      });
      if (res.ok) {
        toast.success(t("invoiceCreated"));
        router.push(`/billing/${res.id}`);
      } else {
        toast.error(t("actionFailed"));
      }
    } catch {
      toast.error(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="flex flex-col gap-5">
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
            <Label>{t("items")}</Label>
            <div className="flex flex-col gap-2">
              <div className="hidden grid-cols-[1fr_3fr_90px_110px_auto] gap-2 px-1 text-xs text-muted-foreground sm:grid">
                <span>{t("kind")}</span>
                <span>{t("description")}</span>
                <span>{t("qty")}</span>
                <span>{t("unitPrice")}</span>
                <span />
              </div>
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_3fr_90px_110px_auto]">
                  <Select value={l.kind} onValueChange={(v) => setLine(i, { kind: v })}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>{t(`kind_${k}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="text-sm"
                    placeholder={t("description")}
                    value={l.description}
                    onChange={(e) => setLine(i, { description: e.target.value })}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={l.quantity}
                    onChange={(e) => setLine(i, { quantity: e.target.value })}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={l.unitPrice}
                    onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                  />
                  <div className="flex items-center justify-end">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setLines((ls) => [...ls, { kind: "SERVICE", description: "", quantity: "1", unitPrice: "" }])
                }
              >
                <Plus />
                {t("addItem")}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label>{t("discount")}</Label>
              <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("taxRate")}</Label>
              <Input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </div>
            <div className="flex flex-col justify-end gap-1">
              <span className="text-xs text-muted-foreground">{t("subtotal")}: {round2(subtotal)}</span>
              <span className="text-sm">{t("total")}: <strong dir="ltr">{total}</strong></span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("notes")}</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {t("newInvoice")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}