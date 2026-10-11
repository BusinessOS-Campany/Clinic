"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Eraser, Plus, Trash2, Pen, AlertTriangle, Clock, FilePenLine } from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import {
  addDiagnosis,
  addOrder,
  cancelOrder,
  completeEncounter,
  encounterAction,
  removeDiagnosis,
  saveEncounterDraft,
  updateEncounter,
  updateDiagnosis,
  updateDiagnosisStatus,
  signEncounter,
  amendEncounter,
} from "@/app/[locale]/(app)/encounters/actions";
import {
  ENCOUNTER_TYPES,
  MODALITIES,
  DIAGNOSIS_STATUSES,
  DIAGNOSIS_CLASSIFICATIONS,
  DIAGNOSIS_COURSES,
  LATERALITIES,
  SEVERITIES,
  DURATION_UNITS,
  SYMPTOM_OPTIONS,
  CONFIDENCES,
} from "@/app/[locale]/(app)/encounters/schema";
import { DiagnosisPicker } from "@/components/encounters/diagnosis-picker";
import { HistoryForm } from "@/components/encounters/history-form";
import { ExamForm } from "@/components/encounters/exam-form";
import { PlanForm } from "@/components/encounters/plan-form";
import type {
  HistoryFormValues,
  ExamFormValues,
  PlanFormValues,
} from "@/app/[locale]/(app)/encounters/schema";
import { fmtDate, fmtTime, toNumber } from "@/lib/format";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export type ChartOrder = {
  id: string;
  kind: string;
  name: string;
  instructions: string | null;
  dosage: string | null;
  frequency: string | null;
  durationDays: number | null;
  quantity: string | null;
  unit: string | null;
  status: string;
  labRequestId: string | null;
  labRequestStatus: string | null;
  labResults: { testName: string; resultValue: string | null; unit: string | null; isAbnormal: boolean | null }[];
  imagingRequestId: string | null;
  imagingRequestStatus: string | null;
  imagingModality: string | null;
  imagingFindings: string | null;
  imagingImpression: string | null;
  dispensedAt: string | null;
  // Prescription fields
  drugCatalogId: string | null;
  genericName: string | null;
  brandName: string | null;
  strength: string | null;
  dosageForm: string | null;
  route: string | null;
  dose: number | null;
  doseUnit: string | null;
  frequencyCode: string | null;
  startDate: string | null;
  endDate: string | null;
  refills: number | null;
  dispenseAsWritten: boolean | null;
  clinicalIndication: string | null;
  prescriptionStatus: string | null;
  priority: string | null;
};

export type ChartDiagnosis = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  classification: string | null;
  codeSystem: string | null;
  status: string;
  course: string;
  laterality: string;
  onsetDate: string | null;
  isPrimary: boolean;
  isDifferential: boolean;
  parentDiagnosisId: string | null;
  diagnosedBy: string | null;
  diagnosedAt: string | null;
  clinicalFindings: string | null;
  supportingLabResultIds: string[] | null;
  supportingImagingIds: string[] | null;
  treatmentPlan: string | null;
  followUp: string | null;
  notes: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  confidence: string | null;
};

export type ChartEncounter = {
  id: string;
  status: string;
  appointmentId: string | null;
  patientId: string;
  patientName: string;
  mrn: string;
  doctorName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  type: string;
  chiefComplaint: string | null;
  symptomOnset: string | null;
  symptomDurationValue: number | null;
  symptomDurationUnit: string | null;
  severity: string | null;
  symptoms: string[];
  physicalExamination: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  temperature: number | null;
  pulse: number | null;
  respRate: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  spO2: number | null;
  height: number | null;
  weight: number | null;
  painLocation: string | null;
  symptomNature: string | null;
  aggravatingFactors: string | null;
  alleviatingFactors: string | null;
  history: unknown;
  examination: unknown;
  treatmentPlan: unknown;
  diagnoses: ChartDiagnosis[];
  orders: ChartOrder[];
};

const emptyForm = {
  type: "CONSULTATION",
  chiefComplaint: "",
  symptomOnset: "",
  symptomDurationValue: "",
  symptomDurationUnit: "",
  severity: "",
  symptoms: [] as string[],
  subjective: "",
  objective: "",
  physicalExamination: "",
  assessment: "",
  plan: "",
  temperature: "",
  pulse: "",
  respRate: "",
  bpSystolic: "",
  bpDiastolic: "",
  spO2: "",
  height: "",
  weight: "",
};

const ORDER_STATUS_BADGE: Record<string, "secondary" | "default" | "success" | "destructive" | "info"> = {
  PENDING: "secondary",
  ACTIVE: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const PRESCRIPTION_STATUS_BADGE: Record<string, "secondary" | "default" | "success" | "destructive" | "info" | "warning"> = {
  ACTIVE: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
  ON_HOLD: "warning",
  EXPIRED: "secondary",
};

const DIAGNOSIS_STATUS_BADGE: Record<string, "secondary" | "default" | "success" | "destructive" | "info" | "warning"> = {
  SUSPECTED: "secondary",
  PROVISIONAL: "warning",
  CONFIRMED: "success",
  RULED_OUT: "destructive",
  RESOLVED: "default",
  CHRONIC: "info",
};

const toStr = (v: number | null) => (v == null ? "" : String(v));

export function EncounterChart({
  encounter,
  canWrite,
  labTests,
  canSign,
  canAmend,
}: {
  encounter: ChartEncounter;
  canWrite: boolean;
  labTests: { id: string; label: string }[];
  canSign: boolean;
  canAmend: boolean;
}) {
  const t = useTranslations("encounters");
  const tc = useTranslations("common");
  const ta = useTranslations("appointments");
  const ti = useTranslations("imaging");
  const tl = useTranslations("lab");
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    ...emptyForm,
    type: encounter.type,
    chiefComplaint: encounter.chiefComplaint ?? "",
    symptomOnset: encounter.symptomOnset ?? "",
    symptomDurationValue: toStr(encounter.symptomDurationValue),
    symptomDurationUnit: encounter.symptomDurationUnit ?? "",
    severity: encounter.severity ?? "",
    symptoms: encounter.symptoms ?? [],
    subjective: encounter.subjective ?? "",
    objective: encounter.objective ?? "",
    physicalExamination: encounter.physicalExamination ?? "",
    assessment: encounter.assessment ?? "",
    plan: encounter.plan ?? "",
    temperature: toStr(encounter.temperature),
    pulse: toStr(encounter.pulse),
    respRate: toStr(encounter.respRate),
    bpSystolic: toStr(encounter.bpSystolic),
    bpDiastolic: toStr(encounter.bpDiastolic),
    spO2: toStr(encounter.spO2),
    height: toStr(encounter.height),
    weight: toStr(encounter.weight),
  });
  const [busy, setBusy] = useState(false);
  const [dx, setDx] = useState({
    code: "",
    name: "",
    description: "",
    classification: "ICD10",
    codeSystem: "",
    status: "PROVISIONAL",
    course: "ACUTE",
    laterality: "NOT_APPLICABLE",
    onsetDate: "",
    isPrimary: false,
    isDifferential: false,
    treatmentPlan: "",
    followUp: "",
    notes: "",
    confidence: "MEDIUM",
  });
  const [editingDxId, setEditingDxId] = useState<string | null>(null);
  const [editDx, setEditDx] = useState<(typeof dx) & { id: string } | null>(null);
  const [order, setOrder] = useState({
    kind: "MEDICATION",
    name: "",
    instructions: "",
    dosage: "",
    frequency: "",
    durationDays: "",
    quantity: "",
    unit: "",
    modality: "XRAY",
    labTestIds: [] as string[],
    // Prescription fields
    drugCatalogId: "",
    genericName: "",
    brandName: "",
    strength: "",
    dosageForm: "",
    route: "",
    dose: "",
    doseUnit: "",
    frequencyCode: "",
    startDate: "",
    endDate: "",
    refills: "",
    dispenseAsWritten: false,
    clinicalIndication: "",
    prescriptionStatus: "ACTIVE",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const setDxField = (k: keyof typeof dx, value: string | boolean) =>
    setDx((d) => ({ ...d, [k]: value }));

  const setEditDxField = (k: keyof typeof dx, value: string | boolean) =>
    setEditDx((d) => (d ? { ...d, [k]: value } : d));

  const setSymptoms = (s: string[]) =>
    setForm((f) => ({ ...f, symptoms: s }));

  async function save() {
    setBusy(true);
    try {
      const res = await updateEncounter(encounter.id, form);
      if (res.ok) {
        toast.success(t("saved"));
        setEdit(false);
        router.refresh();
      } else {
        toast.error(t("savedFailed"));
      }
    } catch {
      toast.error(t("savedFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    setBusy(true);
    try {
      const res = await saveEncounterDraft(encounter.id, form);
      if (res.ok) {
        toast.success(t("savedDraft"));
        router.refresh();
      } else {
        toast.error(t("savedFailed"));
      }
    } catch {
      toast.error(t("savedFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    const res = await encounterAction("complete", encounter.id);
    if (res.ok) {
      toast.success(t("visitCompleted"));
      router.push("/encounters");
    } else {
      toast.error(t("savedFailed"));
    }
  }

  async function sign() {
    setBusy(true);
    try {
      const res = await signEncounter(encounter.id);
      if (res.ok) {
        toast.success(t("signed"));
        router.refresh();
      } else {
        toast.error(t("savedFailed"));
      }
    } catch {
      toast.error(t("savedFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function addDx() {
    if (!dx.name.trim()) return;
    const res = await addDiagnosis(encounter.id, {
      code: dx.code || null,
      name: dx.name,
      description: dx.description,
      classification: dx.classification,
      codeSystem: dx.codeSystem,
      status: dx.status,
      course: dx.course,
      laterality: dx.laterality,
      onsetDate: dx.onsetDate,
      isPrimary: dx.isPrimary,
      isDifferential: dx.isDifferential,
      treatmentPlan: dx.treatmentPlan,
      followUp: dx.followUp,
      notes: dx.notes,
      confidence: dx.confidence || null,
    });
    if (res.ok) {
      setDx({ code: "", name: "", description: "", classification: "ICD10", codeSystem: "", status: "PROVISIONAL", course: "ACUTE", laterality: "NOT_APPLICABLE", onsetDate: "", isPrimary: false, isDifferential: false, treatmentPlan: "", followUp: "", notes: "", confidence: "MEDIUM" });
      toast.success(t("saved"));
      router.refresh();
    } else {
      toast.error(t("savedFailed"));
    }
  }

  async function updateDx(diagnosisId: string) {
    if (!editDx || !editDx.name.trim()) return;
    const res = await updateDiagnosis(diagnosisId, {
      code: editDx.code || null,
      name: editDx.name,
      description: editDx.description,
      classification: editDx.classification,
      codeSystem: editDx.codeSystem,
      status: editDx.status,
      course: editDx.course,
      laterality: editDx.laterality,
      onsetDate: editDx.onsetDate,
      isPrimary: editDx.isPrimary,
      isDifferential: editDx.isDifferential,
      treatmentPlan: editDx.treatmentPlan,
      followUp: editDx.followUp,
      notes: editDx.notes,
      confidence: editDx.confidence || null,
    });
    if (res.ok) {
      setEditingDxId(null);
      setEditDx(null);
      toast.success(t("saved"));
      router.refresh();
    } else {
      toast.error(t("savedFailed"));
    }
  }

  async function updateDxStatus(diagnosisId: string, status: ChartDiagnosis["status"]) {
    const res = await updateDiagnosisStatus(diagnosisId, status as any);
    if (res.ok) {
      toast.success(t("saved"));
      router.refresh();
    } else {
      toast.error(t("savedFailed"));
    }
  }

  async function delDx(id: string) {
    const res = await removeDiagnosis(id);
    if (res.ok) router.refresh();
  }

  async function submitOrder() {
    if (!order.name.trim()) return;
    const res = await addOrder(encounter.id, {
      kind: order.kind,
      name: order.name,
      instructions: order.instructions,
      dosage: order.dosage,
      frequency: order.frequency,
      durationDays: order.durationDays,
      quantity: order.quantity,
      unit: order.unit,
      modality: order.modality,
      labTestIds: order.labTestIds,
      drugCatalogId: order.drugCatalogId || null,
      genericName: order.genericName || null,
      brandName: order.brandName || null,
      strength: order.strength || null,
      dosageForm: order.dosageForm || null,
      route: order.route || null,
      dose: order.dose ? Number(order.dose) : null,
      doseUnit: order.doseUnit || null,
      frequencyCode: order.frequencyCode || null,
      startDate: order.startDate || null,
      endDate: order.endDate || null,
      refills: order.refills ? Number(order.refills) : null,
      dispenseAsWritten: order.dispenseAsWritten,
      clinicalIndication: order.clinicalIndication || null,
      prescriptionStatus: order.prescriptionStatus,
    });
    if (res.ok) {
      toast.success(t("orderAdded"));
      setOrder({
        kind: "MEDICATION",
        name: "",
        instructions: "",
        dosage: "",
        frequency: "",
        durationDays: "",
        quantity: "",
        unit: "",
        modality: "XRAY",
        labTestIds: [],
        drugCatalogId: "",
        genericName: "",
        brandName: "",
        strength: "",
        dosageForm: "",
        route: "",
        dose: "",
        doseUnit: "",
        frequencyCode: "",
        startDate: "",
        endDate: "",
        refills: "",
        dispenseAsWritten: false,
        clinicalIndication: "",
        prescriptionStatus: "ACTIVE",
      });
      router.refresh();
    } else if (res.error === "not-allowed") {
      toast.error(tc("failed"));
    } else {
      toast.error(t("savedFailed"));
    }
  }

  async function handleAmend() {
    const reason = prompt(t("amendReasonPrompt"));
    if (!reason) return;
    setBusy(true);
    try {
      const res = await amendEncounter(encounter.id, form, reason);
      if (res.ok) {
        toast.success(t("amended"));
        setEdit(false);
        router.refresh();
      } else {
        toast.error(t("savedFailed"));
      }
    } catch {
      toast.error(t("savedFailed"));
    } finally {
      setBusy(false);
    }
  }

  type FormKey = keyof typeof form;
  const num = (k: Extract<FormKey, "temperature" | "pulse" | "respRate" | "bpSystolic" | "bpDiastolic" | "spO2" | "height" | "weight">) => ({
    value: form[k],
    onChange: set(k),
    type: "number",
  } as const);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={
            encounter.status === "COMPLETED" ? "success" :
            encounter.status === "SIGNED" ? "info" :
            encounter.status === "AMENDED" ? "warning" :
            "warning"
          }>
            {encounter.status === "COMPLETED" ? t("completed") :
             encounter.status === "SIGNED" ? t("signed") :
             encounter.status === "AMENDED" ? t("amended") :
             t("inProgress")}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {encounter.doctorName ?? "—"}
          </span>
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            {encounter.status === "IN_PROGRESS" || encounter.status === "DRAFT" ? (
              <>
                <Button variant="outline" size="sm" onClick={saveDraft} disabled={busy}>
                  <FilePenLine />
                  {t("saveDraft")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEdit((e) => !e)}>
                  {edit ? tc("cancel") : tc("edit")}
                </Button>
                <Button size="sm" variant="success" onClick={complete} disabled={busy}>
                  <CheckCircle2 />
                  {t("completeVisit")}
                </Button>
              </>
            ) : encounter.status === "COMPLETED" ? (
              <Button size="sm" variant="outline" onClick={() => setEdit(true)} disabled={busy}>
                <Pen />
                {t("amend")}
              </Button>
            ) : encounter.status === "SIGNED" && canAmend ? (
              <Button size="sm" variant="outline" onClick={handleAmend} disabled={busy}>
                <Pen />
                {t("amend")}
              </Button>
            ) : encounter.status === "AMENDED" && canAmend ? (
              <Button size="sm" variant="outline" onClick={handleAmend} disabled={busy}>
                <Pen />
                {t("amend")}
              </Button>
            ) : null}
            {canSign && (encounter.status === "COMPLETED" || encounter.status === "IN_PROGRESS") && (
              <Button size="sm" variant="success" onClick={sign} disabled={busy}>
                <CheckCircle2 />
                {t("signNote")}
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="soap">
        <TabsList className="w-full flex-wrap justify-start">
          <TabsTrigger value="soap">{t("tabSoap")}</TabsTrigger>
          <TabsTrigger value="history">{t("tabHistory")}</TabsTrigger>
          <TabsTrigger value="exam">{t("tabExam")}</TabsTrigger>
          <TabsTrigger value="plan">{t("tabPlan")}</TabsTrigger>
          <TabsTrigger value="vitals">{t("tabVitals")}</TabsTrigger>
          <TabsTrigger value="diagnoses">{t("tabDiagnoses")}</TabsTrigger>
          <TabsTrigger value="orders">{t("tabOrders")}</TabsTrigger>
          <TabsTrigger value="safety">{t("tabSafety")}</TabsTrigger>
          <TabsTrigger value="amendments">{t("tabAmendments")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("tabTimeline")}</TabsTrigger>
        </TabsList>

        <TabsContent value="soap" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex flex-col gap-2">
                <Label>{t("chiefComplaint")}</Label>
                {edit ? (
                  <Input value={form.chiefComplaint} onChange={set("chiefComplaint")} />
                ) : (
                  <p className="text-sm">
                    {encounter.chiefComplaint ?? <span className="text-muted-foreground">—</span>}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("symptomOnset")}</Label>
                {edit ? (
                  <Input type="datetime-local" value={form.symptomOnset} onChange={set("symptomOnset")} />
                ) : (
                  <p className="text-sm">
                    {encounter.symptomOnset ? (
                      <span>{fmtDate(new Date(encounter.symptomOnset))} {fmtTime(new Date(encounter.symptomOnset))}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label>{t("symptomDuration")}</Label>
                  {edit ? (
                    <div className="flex items-center gap-2">
                      <Input type="number" min={1} value={form.symptomDurationValue} onChange={set("symptomDurationValue")} />
                      <Select value={form.symptomDurationUnit} onValueChange={(v) => setForm((f) => ({ ...f, symptomDurationUnit: v }))}>
                        <SelectTrigger className="w-36"><SelectValue placeholder={t("durationUnit")} /></SelectTrigger>
                        <SelectContent>
                          {DURATION_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>{t(`durationUnit_${u}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="text-sm">
                      {encounter.symptomDurationValue != null && encounter.symptomDurationUnit
                        ? `${encounter.symptomDurationValue} ${t(`durationUnit_${encounter.symptomDurationUnit}`)}`
                        : <span className="text-muted-foreground">—</span>}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t("severity")}</Label>
                  {edit ? (
                    <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                      <SelectTrigger><SelectValue placeholder={t("severityPlaceholder")} /></SelectTrigger>
                      <SelectContent>
                        {SEVERITIES.map((s) => (
                          <SelectItem key={s} value={s}>{t(`severity_${s}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">
                      {encounter.severity ? t(`severity_${encounter.severity}`) : <span className="text-muted-foreground">—</span>}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t("symptoms")}</Label>
                  {edit ? (
                    <div className="flex flex-wrap gap-1">
                      {SYMPTOM_OPTIONS.map((s) => {
                        const active = form.symptoms.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setSymptoms(active ? form.symptoms.filter((x) => x !== s) : [...form.symptoms, s])
                            }
                            className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                              active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
                            }`}
                          >
                            {t(`symptom_${s}`)}
                          </button>
                        );
                      })}
                    </div>
                  ) : encounter.symptoms.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {encounter.symptoms.map((s) => (
                        <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {t(`symptom_${s}`)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("physicalExamination")}</Label>
                {edit ? (
                  <Textarea rows={3} value={form.physicalExamination} onChange={set("physicalExamination")} />
                ) : (
                  <p className="whitespace-pre-wrap text-sm">
                    {encounter.physicalExamination ?? <span className="text-muted-foreground">—</span>}
                  </p>
                )}
              </div>
              {(["subjective", "objective", "assessment", "plan"] as const).map((k) => (
                <div key={k} className="flex flex-col gap-2">
                  <Label>{t(k)}</Label>
                  {edit ? (
                    <Textarea rows={3} value={form[k]} onChange={set(k)} />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">
                      {encounter[k] ?? <span className="text-muted-foreground">—</span>}
                    </p>
                  )}
                </div>
              ))}
              {edit && canWrite && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEdit(false)}>
                    {tc("cancel")}
                  </Button>
                  <Button onClick={save} disabled={busy}>
                    {t("save")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryForm
            encounterId={encounter.id}
            initial={(encounter.history ?? {}) as HistoryFormValues}
            readOnly={!canWrite}
          />
        </TabsContent>

        <TabsContent value="exam" className="mt-4">
          <ExamForm
            encounterId={encounter.id}
            initial={(encounter.examination ?? {}) as ExamFormValues}
            readOnly={!canWrite}
          />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <PlanForm
            encounterId={encounter.id}
            initial={(encounter.treatmentPlan ?? {}) as PlanFormValues}
            readOnly={!canWrite}
          />
        </TabsContent>

        <TabsContent value="vitals" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {(["temperature", "pulse", "respRate", "spO2"] as const).map((k) => (
                  <div key={k} className="flex flex-col gap-2">
                    <Label>{t(k)}</Label>
                    {edit ? (
                      <Input {...num(k)} />
                    ) : (
                      <p className="text-sm font-medium">
                        {encounter[k] != null ? encounter[k] : "—"}
                      </p>
                    )}
                  </div>
                ))}
                <div className="flex flex-col gap-2">
                  <Label>{t("bp")}</Label>
                  {edit ? (
                    <div className="flex items-center gap-1">
                      <Input {...num("bpSystolic")} placeholder={t("bpSystolic")} />
                      <span>/</span>
                      <Input {...num("bpDiastolic")} placeholder={t("bpDiastolic")} />
                    </div>
                  ) : (
                    <p className="text-sm font-medium">
                      {encounter.bpSystolic != null && encounter.bpDiastolic != null
                        ? `${encounter.bpSystolic}/${encounter.bpDiastolic}`
                        : "—"}
                    </p>
                  )}
                </div>
                {(["height", "weight"] as const).map((k) => (
                  <div key={k} className="flex flex-col gap-2">
                    <Label>{t(k)}</Label>
                    {edit ? (
                      <Input {...num(k)} />
                    ) : (
                      <p className="text-sm font-medium">
                        {encounter[k] != null ? encounter[k] : "—"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {edit && canWrite && (
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEdit(false)}>
                    {tc("cancel")}
                  </Button>
                  <Button onClick={save} disabled={busy}>
                    {t("save")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnoses" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {encounter.diagnoses.length === 0 && (
                <p className="text-sm text-muted-foreground">—</p>
              )}
              {encounter.diagnoses.map((d) => (
                <div key={d.id} className="flex flex-col gap-2 rounded-lg border px-3 py-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {d.isPrimary && <Badge variant="info">{t("primaryDx")}</Badge>}
                      {d.isDifferential && <Badge variant="secondary">{t("differentialDx")}</Badge>}
                      <span className="text-sm font-medium">{d.name}</span>
                      {d.code && (
                        <span className="font-mono text-xs text-muted-foreground">{d.code}</span>
                      )}
                      <Badge variant={DIAGNOSIS_STATUS_BADGE[d.status] ?? "secondary"}>
                        {t(`diagnosisStatus_${(d.status ?? "PROVISIONAL").toLowerCase()}`)}
                      </Badge>
                      {d.confidence && (
                        <Badge variant="secondary">{t(`confidence_${d.confidence}`)}</Badge>
                      )}
                    </div>
                    {canWrite && encounter.status !== "COMPLETED" && encounter.status !== "SIGNED" && (
                      <div className="flex items-center gap-1">
                        <Select value={d.status} onValueChange={(v) => updateDxStatus(d.id, v as any)}>
                          <SelectTrigger className="w-auto"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DIAGNOSIS_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{t(`diagnosisStatus_${s.toLowerCase()}`)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => {
                            if (editingDxId === d.id) {
                              setEditingDxId(null);
                              setEditDx(null);
                            } else {
                              setEditingDxId(d.id);
                              setEditDx({
                                id: d.id,
                                code: d.code || "",
                                name: d.name,
                                description: d.description || "",
                                classification: d.classification || "ICD10",
                                codeSystem: d.codeSystem || "",
                                status: d.status || "PROVISIONAL",
                                course: d.course || "ACUTE",
                                laterality: d.laterality || "NOT_APPLICABLE",
                                onsetDate: d.onsetDate ? d.onsetDate.slice(0, 16) : "",
                                isPrimary: d.isPrimary,
                                isDifferential: d.isDifferential,
                                treatmentPlan: d.treatmentPlan || "",
                                followUp: d.followUp || "",
                                notes: d.notes || "",
                                confidence: d.confidence || "MEDIUM",
                              });
                            }
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pen className="size-4" />
                        </button>
                        <button onClick={() => delDx(d.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {(d.description || d.treatmentPlan || d.followUp || d.notes || editingDxId === d.id) && (
                    <div className="ml-6 flex flex-col gap-2 text-sm">
                      {editingDxId === d.id ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-2 sm:col-span-2">
                            <Label>{t("diagnosisName")}</Label>
                            <DiagnosisPicker
                              value={editDx ? { code: editDx.code, name: editDx.name, classification: editDx.classification, codeSystem: editDx.codeSystem } : null}
                              onChange={(entry) =>
                                setEditDx((e) => {
                                  if (!e) return e;
                                  if (!entry) return { ...e, code: "", classification: "ICD10", codeSystem: "" };
                                  return { ...e, code: entry.code, name: entry.name, classification: entry.classification, codeSystem: entry.codeSystem };
                                })
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>{t("status")}</Label>
                            <Select value={editDx?.status || "PROVISIONAL"} onValueChange={(v) => setEditDxField("status", v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {DIAGNOSIS_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>{t(`diagnosisStatus_${s.toLowerCase()}`)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>{t("confidence")}</Label>
                            <Select value={editDx?.confidence || "MEDIUM"} onValueChange={(v) => setEditDxField("confidence", v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {CONFIDENCES.map((c) => (
                                  <SelectItem key={c} value={c}>{t(`confidence_${c}`)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>{t("course")}</Label>
                            <Select value={editDx?.course || "ACUTE"} onValueChange={(v) => setEditDxField("course", v)}>
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
                            <Select value={editDx?.laterality || "NOT_APPLICABLE"} onValueChange={(v) => setEditDxField("laterality", v)}>
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
                            <Input type="datetime-local" value={editDx?.onsetDate || ""} onChange={(e) => setEditDxField("onsetDate", e.target.value)} />
                          </div>
                          <div className="flex flex-col gap-2 sm:col-span-2">
                            <Label>{t("description")}</Label>
                            <Textarea rows={2} value={editDx?.description || ""} onChange={(e) => setEditDxField("description", e.target.value)} />
                          </div>
                          <div className="flex flex-col gap-2 sm:col-span-2">
                            <Label>{t("treatmentPlan")}</Label>
                            <Textarea rows={2} value={editDx?.treatmentPlan || ""} onChange={(e) => setEditDxField("treatmentPlan", e.target.value)} />
                          </div>
                          <div className="flex flex-col gap-2 sm:col-span-2">
                            <Label>{t("followUp")}</Label>
                            <Textarea rows={2} value={editDx?.followUp || ""} onChange={(e) => setEditDxField("followUp", e.target.value)} />
                          </div>
                          <div className="flex flex-col gap-2 sm:col-span-2">
                            <Label>{t("notes")}</Label>
                            <Textarea rows={2} value={editDx?.notes || ""} onChange={(e) => setEditDxField("notes", e.target.value)} />
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={Boolean(editDx?.isPrimary)} onChange={(e) => setEditDxField("isPrimary", e.target.checked)} />
                              {t("primaryDx")}
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={Boolean(editDx?.isDifferential)} onChange={(e) => setEditDxField("isDifferential", e.target.checked)} />
                              {t("differentialDx")}
                            </label>
                          </div>
                          <div className="flex justify-end sm:col-span-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setEditingDxId(null); setEditDx(null); }}>
                              {tc("cancel")}
                            </Button>
                            <Button size="sm" onClick={() => updateDx(d.id)} disabled={busy}>
                              {t("save")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {d.description && <p className="text-muted-foreground">{t("description")}: {d.description}</p>}
                          {d.course && <p className="text-muted-foreground">{t("course")}: {t(`course_${d.course}`)}</p>}
                          {d.laterality && d.laterality !== "NOT_APPLICABLE" && <p className="text-muted-foreground">{t("laterality")}: {t(`laterality_${d.laterality}`)}</p>}
                          {d.onsetDate && <p className="text-muted-foreground">{t("onsetDate")}: {fmtDate(new Date(d.onsetDate))} {fmtTime(new Date(d.onsetDate))}</p>}
                          {d.treatmentPlan && <p className="text-muted-foreground">{t("treatmentPlan")}: {d.treatmentPlan}</p>}
                          {d.followUp && <p className="text-muted-foreground">{t("followUp")}: {d.followUp}</p>}
                          {d.notes && <p className="text-muted-foreground">{t("notes")}: {d.notes}</p>}
                          {d.clinicalFindings && <p className="text-muted-foreground">{t("clinicalFindings")}: {d.clinicalFindings}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {canWrite && encounter.status !== "COMPLETED" && encounter.status !== "SIGNED" && (
                <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
                      <Label>{t("diagnosisName")}</Label>
                      <DiagnosisPicker
                        value={{ code: dx.code, name: dx.name, classification: dx.classification, codeSystem: dx.codeSystem }}
                        onChange={(entry) =>
                          setDx((d) => {
                            if (!entry) return { ...d, code: "", classification: "ICD10", codeSystem: "" };
                            return { ...d, code: entry.code, name: entry.name, classification: entry.classification, codeSystem: entry.codeSystem };
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>{t("status")}</Label>
                      <Select value={dx.status} onValueChange={(v) => setDxField("status", v)}>
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
                      <Select value={dx.classification} onValueChange={(v) => setDxField("classification", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIAGNOSIS_CLASSIFICATIONS.map((c) => (
                            <SelectItem key={c} value={c}>{t(`classification_${c}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>{t("confidence")}</Label>
                      <Select value={dx.confidence} onValueChange={(v) => setDxField("confidence", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CONFIDENCES.map((c) => (
                            <SelectItem key={c} value={c}>{t(`confidence_${c}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>{t("course")}</Label>
                      <Select value={dx.course} onValueChange={(v) => setDxField("course", v)}>
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
                      <Select value={dx.laterality} onValueChange={(v) => setDxField("laterality", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LATERALITIES.map((l) => (
                            <SelectItem key={l} value={l}>{t(`laterality_${l}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
                      <Label>{t("onsetDate")}</Label>
                      <Input type="datetime-local" value={dx.onsetDate} onChange={(e) => setDxField("onsetDate", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
                      <Label>{t("description")}</Label>
                      <Textarea rows={2} placeholder={t("description")} value={dx.description} onChange={(e) => setDxField("description", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
                      <Label>{t("treatmentPlan")}</Label>
                      <Textarea rows={2} placeholder={t("treatmentPlan")} value={dx.treatmentPlan} onChange={(e) => setDxField("treatmentPlan", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
                      <Label>{t("followUp")}</Label>
                      <Textarea rows={2} placeholder={t("followUp")} value={dx.followUp} onChange={(e) => setDxField("followUp", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
                      <Label>{t("notes")}</Label>
                      <Textarea rows={2} placeholder={t("notes")} value={dx.notes} onChange={(e) => setDxField("notes", e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={dx.isPrimary} onChange={(e) => setDxField("isPrimary", e.target.checked)} />
                        {t("primaryDx")}
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={dx.isDifferential} onChange={(e) => setDxField("isDifferential", e.target.checked)} />
                        {t("differentialDx")}
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={addDx}>
                      <Plus />
                      {t("addDiagnosis")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {encounter.orders.length === 0 && (
                <p className="text-sm text-muted-foreground">—</p>
              )}
              {encounter.orders.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{t(`kind_${o.kind}`)}</Badge>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{o.name}</span>
                      {(o.dosage || o.frequency || o.dose) && (
                        <span className="text-xs text-muted-foreground">
                          {[
                            o.dosage,
                            o.frequency,
                            o.dose ? `${o.dose} ${o.doseUnit || ""}` : null,
                            o.frequencyCode,
                            o.durationDays ? `${o.durationDays}d` : null,
                            o.refills !== null && o.refills !== undefined ? `Refills: ${o.refills}` : null,
                            o.route,
                            o.prescriptionStatus && PRESCRIPTION_STATUS_BADGE[o.prescriptionStatus] ? <Badge variant={PRESCRIPTION_STATUS_BADGE[o.prescriptionStatus]}>{t(`prescriptionStatus_${o.prescriptionStatus}`)}</Badge> : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                      {o.instructions && (
                        <span className="text-xs text-muted-foreground">{o.instructions}</span>
                      )}
                      {o.clinicalIndication && (
                        <span className="text-xs text-muted-foreground">{t("indication")}: {o.clinicalIndication}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.kind === "MEDICATION" ? (
                      <Badge variant={o.prescriptionStatus ? (PRESCRIPTION_STATUS_BADGE[o.prescriptionStatus] ?? "secondary") : "secondary"}>
                        {o.prescriptionStatus ? t(`prescriptionStatus_${o.prescriptionStatus}`) : t(`orderStatus_${o.status}`)}
                      </Badge>
                    ) : (
                      <Badge variant={ORDER_STATUS_BADGE[o.status] ?? "secondary"}>
                        {t(`orderStatus_${o.status}`)}
                      </Badge>
                    )}
                    {o.priority === "URGENT" && (
                      <Badge variant="destructive">{t("priority_URGENT")}</Badge>
                    )}
                    {o.kind === "MEDICATION" && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/pharmacy/rx/${o.id}`}>{t("printRx")}</Link>
                      </Button>
                    )}
                    {o.labRequestId && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/lab/requests/${o.labRequestId}`}>{t("kind_LABORATORY")}</Link>
                      </Button>
                    )}
                    {o.imagingRequestId && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/imaging/${o.imagingRequestId}`}>{t("kind_IMAGING")}</Link>
                      </Button>
                    )}
                    {canWrite && o.status === "PENDING" ? (
                      <Button size="sm" variant="ghost" onClick={() => cancelOrder(o.id)}>
                        <Eraser />
                      </Button>
                    ) : null}
                  </div>
                  {o.labResults.length > 0 && (
                    <div className="w-full flex flex-col gap-1.5 rounded-lg bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-muted-foreground">{t("orderResults")}</p>
                      {o.labResults.map((r, ri) => (
                        <div key={ri} className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{r.testName}</span>
                          <span className="tabular-nums">
                            {r.resultValue}
                            {r.unit ? ` ${r.unit}` : ""}
                          </span>
                          {r.isAbnormal === true && (
                            <Badge variant="destructive">{tl("abnormal")}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {o.imagingRequestStatus && (o.imagingFindings || o.imagingImpression) && (
                    <div className="w-full flex flex-col gap-1.5 rounded-lg bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t("orderResults")}
                        {o.imagingModality ? ` · ${ti(`modality_${o.imagingModality}`)}` : ""}
                      </p>
                      {o.imagingImpression && (
                        <p className="text-sm">
                          <span className="font-medium">{t("impression")}: </span>
                          <span className="whitespace-pre-wrap">{o.imagingImpression}</span>
                        </p>
                      )}
                      {o.imagingFindings && (
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{o.imagingFindings}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {canWrite && encounter.status !== "COMPLETED" && encounter.status !== "SIGNED" && (
                <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-2">
                      <Label>{t("orderKind")}</Label>
                      <Select value={order.kind} onValueChange={(v) => setOrder((o) => ({ ...o, kind: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["MEDICATION", "LABORATORY", "IMAGING", "OTHER"] as const).map((k) => (
                            <SelectItem key={k} value={k}>{t(`kind_${k}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>{t("orderName")}</Label>
                      <Input value={order.name} onChange={(e) => setOrder((o) => ({ ...o, name: e.target.value }))} />
                    </div>
                    {order.kind === "MEDICATION" && (
                      <>
                        <div className="flex flex-col gap-2">
                          <Label>{t("genericName")}</Label>
                          <Input value={order.genericName} onChange={(e) => setOrder((o) => ({ ...o, genericName: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("brandName")}</Label>
                          <Input value={order.brandName} onChange={(e) => setOrder((o) => ({ ...o, brandName: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("strength")}</Label>
                          <Input value={order.strength} onChange={(e) => setOrder((o) => ({ ...o, strength: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("dosageForm")}</Label>
                          <Input value={order.dosageForm} onChange={(e) => setOrder((o) => ({ ...o, dosageForm: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("route")}</Label>
                          <Input value={order.route} onChange={(e) => setOrder((o) => ({ ...o, route: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("dose")}</Label>
                          <Input type="number" step="0.1" min="0" value={order.dose} onChange={(e) => setOrder((o) => ({ ...o, dose: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("doseUnit")}</Label>
                          <Input value={order.doseUnit} onChange={(e) => setOrder((o) => ({ ...o, doseUnit: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("frequencyCode")}</Label>
                          <Input value={order.frequencyCode} onChange={(e) => setOrder((o) => ({ ...o, frequencyCode: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("durationDays")}</Label>
                          <Input type="number" min={1} value={order.durationDays} onChange={(e) => setOrder((o) => ({ ...o, durationDays: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("qty")}</Label>
                          <Input value={order.quantity} onChange={(e) => setOrder((o) => ({ ...o, quantity: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("refills")}</Label>
                          <Input type="number" min={0} max={99} value={order.refills} onChange={(e) => setOrder((o) => ({ ...o, refills: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("startDate")}</Label>
                          <Input type="date" value={order.startDate} onChange={(e) => setOrder((o) => ({ ...o, startDate: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("endDate")}</Label>
                          <Input type="date" value={order.endDate} onChange={(e) => setOrder((o) => ({ ...o, endDate: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("clinicalIndication")}</Label>
                          <Input value={order.clinicalIndication} onChange={(e) => setOrder((o) => ({ ...o, clinicalIndication: e.target.value }))} />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={order.dispenseAsWritten} onChange={(e) => setOrder((o) => ({ ...o, dispenseAsWritten: e.target.checked }))} />
                            {t("dispenseAsWritten")}
                          </label>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>{t("prescriptionStatus")}</Label>
                          <Select value={order.prescriptionStatus} onValueChange={(v) => setOrder((o) => ({ ...o, prescriptionStatus: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD", "EXPIRED"] as const).map((s) => (
                                <SelectItem key={s} value={s}>{t(`prescriptionStatus_${s}`)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    {order.kind === "LABORATORY" && labTests.length > 0 && (
                      <div className="flex flex-col gap-2 sm:col-span-2">
                        <Label>{t("selectTests")}</Label>
                        <div className="flex max-h-28 flex-col gap-1 overflow-auto rounded-md border p-2 text-sm">
                          {labTests.map((lt) => (
                            <label key={lt.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={order.labTestIds.includes(lt.id)}
                                onChange={(e) =>
                                  setOrder((o) => ({
                                    ...o,
                                    labTestIds: e.target.checked
                                      ? [...o.labTestIds, lt.id]
                                      : o.labTestIds.filter((x) => x !== lt.id),
                                  }))
                                }
                              />
                              {lt.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {order.kind === "IMAGING" && (
                      <div className="flex flex-col gap-2">
                        <Label>{t("modality")}</Label>
                        <Select value={order.modality} onValueChange={(v) => setOrder((o) => ({ ...o, modality: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MODALITIES.map((m) => (
                              <SelectItem key={m} value={m}>{ti(`modality_${m}`)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
                      <Label>{t("instructions")}</Label>
                      <Input value={order.instructions} onChange={(e) => setOrder((o) => ({ ...o, instructions: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={submitOrder}>
                      <Plus />
                      {t("addOrder")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t("prescriptionSafety")}</h3>
                {canWrite && (
                  <Button size="sm" variant="outline" onClick={() => router.refresh()}>
                    <Clock />
                    {t("refresh")}
                  </Button>
                )}
              </div>
              {/* Prescription alerts would be fetched and displayed here */}
              <p className="text-sm text-muted-foreground">{t("safetyChecksNotImplemented")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amendments" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <h3 className="text-lg font-medium">{t("amendmentHistory")}</h3>
              {/* Amendment history would be fetched and displayed here */}
              <p className="text-sm text-muted-foreground">{t("amendmentHistoryNotImplemented")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("type")}:</span>
                <span className="font-medium">{ta(`type_${encounter.type}`)}</span>
              </div>
              {encounter.createdAt && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("createdAt")}:</span>
                  <span>{fmtDate(new Date(encounter.createdAt))} {fmtTime(new Date(encounter.createdAt))}</span>
                </div>
              )}
              {encounter.startedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("started")}:</span>
                  <span>{fmtDate(new Date(encounter.startedAt))} {fmtTime(new Date(encounter.startedAt))}</span>
                </div>
              )}
              {encounter.completedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("completed")}:</span>
                  <span>{fmtDate(new Date(encounter.completedAt))} {fmtTime(new Date(encounter.completedAt))}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}