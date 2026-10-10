"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Activity, HeartPulse, Stethoscope } from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import {
  recordVitals,
  startConsultationFromTriage,
  type NursingQueueRow,
} from "@/app/[locale]/(app)/nursing/actions";
import { TRIAGE_LEVELS } from "@/app/[locale]/(app)/nursing/schema";
import { fmtDate, fmtTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TRIAGE_BADGE: Record<
  string,
  "destructive" | "warning" | "info" | "success" | "secondary"
> = {
  RESUSCITATION: "destructive",
  EMERGENT: "warning",
  URGENT: "info",
  STANDARD: "success",
  NON_URGENT: "secondary",
};

const STATUS_BADGE: Record<string, "secondary" | "warning" | "info"> = {
  CHECKED_IN: "secondary",
  TRIAGE: "warning",
  IN_CONSULTATION: "info",
};

const emptyVitals = {
  temperature: "",
  pulse: "",
  respRate: "",
  bpSystolic: "",
  bpDiastolic: "",
  spO2: "",
  painScore: "",
  glucose: "",
  height: "",
  weight: "",
  triageLevel: "",
  triageNotes: "",
  notes: "",
};

type VitalsForm = typeof emptyVitals;

export function NursingBoard({
  rows,
  canWrite,
  locale,
}: {
  rows: NursingQueueRow[];
  canWrite: boolean;
  locale: string;
}) {
  const t = useTranslations("nursing");
  const te = useTranslations("encounters");
  const tc = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState<NursingQueueRow | null>(null);
  const [form, setForm] = useState<VitalsForm>(emptyVitals);
  const [saving, setSaving] = useState(false);

  const set =
    (k: keyof VitalsForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function openVitals(row: NursingQueueRow) {
    setEditing(row);
    const v = row.latestVitals;
    setForm({
      temperature: v?.temperature ?? "",
      pulse: v?.pulse != null ? String(v.pulse) : "",
      respRate: v?.respRate != null ? String(v.respRate) : "",
      bpSystolic: v?.bpSystolic != null ? String(v.bpSystolic) : "",
      bpDiastolic: v?.bpDiastolic != null ? String(v.bpDiastolic) : "",
      spO2: v?.spO2 != null ? String(v.spO2) : "",
      painScore: v?.painScore != null ? String(v.painScore) : "",
      glucose: v?.glucose ?? "",
      height: v?.height ?? "",
      weight: v?.weight ?? "",
      triageLevel: row.triageLevel ?? "",
      triageNotes: row.triageNotes ?? "",
      notes: "",
    });
  }

  async function submit() {
    if (!editing) return;
    setSaving(true);
    const res = await recordVitals(editing.encounterId, {
      ...form,
      triageLevel: form.triageLevel || undefined,
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t("saveSuccess"));
      setEditing(null);
      router.refresh();
    } else {
      toast.error(t("saveFailed"));
    }
  }

  async function startConsult(encounterId: string) {
    const res = await startConsultationFromTriage(encounterId);
    if (res.ok) {
      toast.success(t("started"));
      router.refresh();
    } else {
      toast.error(t("saveFailed"));
    }
  }

  const vitalChip = (label: string, value: string | number | null) =>
    value != null && value !== "" ? (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </span>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-0 p-0">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <HeartPulse className="size-4 text-primary" />
              {t("queue")}
            </div>
            <Badge variant="secondary">{rows.length}</Badge>
          </div>

          {rows.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              {t("noRows")}
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {rows.map((row) => (
                <li
                  key={row.encounterId}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-56 flex-1">
                    <Link
                      href={`/encounters/${row.encounterId}`}
                      className="font-medium hover:underline"
                    >
                      {row.patientName}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{row.mrn}</span>
                      <span className="font-mono">{row.encounterNo}</span>
                      <span>· {te(`visit_${row.visitType}`)}</span>
                      {row.doctorName && <span>· {row.doctorName}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={STATUS_BADGE[row.status] ?? "secondary"}>
                      {te(`status_${row.status}`)}
                    </Badge>
                    {row.triageLevel && (
                      <Badge variant={TRIAGE_BADGE[row.triageLevel] ?? "secondary"}>
                        {t(`triage_${row.triageLevel}`)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex min-w-64 flex-1 flex-wrap items-center gap-1.5">
                    {row.latestVitals ? (
                      <>
                        {vitalChip(
                          t("bp"),
                          row.latestVitals.bpSystolic != null &&
                            row.latestVitals.bpDiastolic != null
                            ? `${row.latestVitals.bpSystolic}/${row.latestVitals.bpDiastolic}`
                            : null,
                        )}
                        {vitalChip(t("pulse"), row.latestVitals.pulse)}
                        {vitalChip(t("temp"), row.latestVitals.temperature)}
                        {vitalChip(t("spo2"), row.latestVitals.spO2)}
                        {vitalChip(t("pain"), row.latestVitals.painScore)}
                        <span className="text-xs text-muted-foreground">
                          {fmtTime(new Date(row.latestVitals.measuredAt))}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("noVitals")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <span className="hidden text-xs text-muted-foreground md:inline">
                      {row.checkedInAt
                        ? `${fmtDate(new Date(row.checkedInAt), locale === "ar" ? "ar" : "en")} ${fmtTime(new Date(row.checkedInAt))}`
                        : ""}
                    </span>
                    {canWrite && (
                      <Button size="sm" variant="outline" onClick={() => openVitals(row)}>
                        <Activity />
                        {t("recordVitals")}
                      </Button>
                    )}
                    {canWrite && (
                      <Button size="sm" onClick={() => startConsult(row.encounterId)}>
                        <Stethoscope />
                        {t("startConsultation")}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("recordVitals")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {editing.patientName} · {editing.mrn}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumField label={t("temp")} value={form.temperature} onChange={set("temperature")} />
                <NumField label={t("pulse")} value={form.pulse} onChange={set("pulse")} />
                <NumField label={t("respRate")} value={form.respRate} onChange={set("respRate")} />
                <NumField label={t("bpSystolic")} value={form.bpSystolic} onChange={set("bpSystolic")} />
                <NumField label={t("bpDiastolic")} value={form.bpDiastolic} onChange={set("bpDiastolic")} />
                <NumField label={t("spo2")} value={form.spO2} onChange={set("spO2")} />
                <NumField label={t("pain")} value={form.painScore} onChange={set("painScore")} />
                <NumField label={t("glucose")} value={form.glucose} onChange={set("glucose")} />
                <NumField label={t("height")} value={form.height} onChange={set("height")} />
                <NumField label={t("weight")} value={form.weight} onChange={set("weight")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("triageLevel")}</Label>
                <Select
                  value={form.triageLevel || "NONE"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, triageLevel: v === "NONE" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">{tc("none")}</SelectItem>
                    {TRIAGE_LEVELS.map((lv) => (
                      <SelectItem key={lv} value={lv}>
                        {t(`triage_${lv}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("triageNotes")}</Label>
                <Textarea rows={2} value={form.triageNotes} onChange={set("triageNotes")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("notes")}</Label>
                <Textarea rows={2} value={form.notes} onChange={set("notes")} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  {tc("cancel")}
                </Button>
                <Button onClick={submit} disabled={saving}>
                  {tc("save")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input dir="ltr" inputMode="decimal" value={value} onChange={onChange} />
    </div>
  );
}
