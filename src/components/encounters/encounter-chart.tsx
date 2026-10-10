"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CheckCircle2,
  Eraser,
  History,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  addAttachment,
  addDiagnosis,
  addOrder,
  amendEncounter,
  cancelOrder,
  completeEncounter,
  listEncounterRevisions,
  removeAttachment,
  removeDiagnosis,
  setEncounterStatus,
  signEncounter,
  updateEncounter,
  type EncounterRevisionRow,
} from "@/app/[locale]/(app)/encounters/actions";
import { VISIT_TYPES, MODALITIES } from "@/app/[locale]/(app)/encounters/schema";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PrescriptionPanel,
  type ComposerMedication,
  type EncounterPrescription,
} from "@/components/prescriptions/prescription-panel";

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
  imagingRequestId: string | null;
  dispensedAt: string | null;
};

export type ChartDiagnosis = {
  id: string;
  code: string | null;
  name: string;
  isPrimary: boolean;
};

export type ChartAttachment = {
  id: string;
  title: string;
  fileName: string | null;
  url: string | null;
  notes: string | null;
  createdAt: string;
};

export type ChartEncounter = {
  id: string;
  encounterNo: string;
  status: string;
  noteStatus: string;
  appointmentId: string | null;
  patientId: string;
  patientName: string;
  mrn: string;
  doctorName: string | null;
  departmentName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  checkedInAt: string | null;
  createdAt: string;
  visitType: string;
  triageLevel: string | null;
  triageNotes: string | null;
  chiefComplaint: string | null;
  hpi: string | null;
  reviewOfSystems: string | null;
  physicalExamination: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  patientInstructions: string | null;
  followUpPlan: string | null;
  followUpDate: string | null;
  referralSource: string | null;
  referralNotes: string | null;
  signedAt: string | null;
  temperature: number | null;
  pulse: number | null;
  respRate: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  spO2: number | null;
  height: number | null;
  weight: number | null;
  diagnoses: ChartDiagnosis[];
  orders: ChartOrder[];
  attachments: ChartAttachment[];
};

type FormState = {
  visitType: string;
  chiefComplaint: string;
  hpi: string;
  reviewOfSystems: string;
  physicalExamination: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  patientInstructions: string;
  followUpPlan: string;
  followUpDate: string;
  referralSource: string;
  referralNotes: string;
  temperature: string;
  pulse: string;
  respRate: string;
  bpSystolic: string;
  bpDiastolic: string;
  spO2: string;
  height: string;
  weight: string;
};

const STATUS_BADGE: Record<string, "secondary" | "warning" | "info" | "success" | "destructive"> = {
  CHECKED_IN: "secondary",
  TRIAGE: "warning",
  IN_CONSULTATION: "info",
  COMPLETED: "success",
  SIGNED: "success",
  CANCELLED: "destructive",
};

const NOTE_BADGE: Record<string, "secondary" | "success" | "warning"> = {
  DRAFT: "secondary",
  SIGNED: "success",
  AMENDED: "warning",
};

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

const ORDER_BADGE: Record<string, "secondary" | "info" | "success" | "destructive"> = {
  PENDING: "secondary",
  ACTIVE: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const str = (v: number | null) => (v == null ? "" : String(v));

export function EncounterChart({
  encounter,
  canWrite,
  canSign,
  canPrescribe,
  labTests,
  medications,
  prescriptions,
}: {
  encounter: ChartEncounter;
  canWrite: boolean;
  canSign: boolean;
  canPrescribe: boolean;
  labTests: { id: string; label: string }[];
  medications: ComposerMedication[];
  prescriptions: EncounterPrescription[];
}) {
  const t = useTranslations("encounters");
  const tc = useTranslations("common");
  const ti = useTranslations("imaging");
  const tn = useTranslations("nursing");
  const tl = useTranslations("lab");
  const router = useRouter();

  const signed = encounter.noteStatus === "SIGNED" || encounter.noteStatus === "AMENDED";
  const cancelled = encounter.status === "CANCELLED";
  const canEditNote = canWrite && !signed && !cancelled;
  const canOrder = canWrite && !cancelled;
  const canAttach = canWrite && !cancelled;

  const [edit, setEdit] = useState(false);
  const [amendReason, setAmendReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [form, setForm] = useState<FormState>({
    visitType: encounter.visitType,
    chiefComplaint: encounter.chiefComplaint ?? "",
    hpi: encounter.hpi ?? "",
    reviewOfSystems: encounter.reviewOfSystems ?? "",
    physicalExamination: encounter.physicalExamination ?? "",
    subjective: encounter.subjective ?? "",
    objective: encounter.objective ?? "",
    assessment: encounter.assessment ?? "",
    plan: encounter.plan ?? "",
    patientInstructions: encounter.patientInstructions ?? "",
    followUpPlan: encounter.followUpPlan ?? "",
    followUpDate: encounter.followUpDate ? encounter.followUpDate.slice(0, 10) : "",
    referralSource: encounter.referralSource ?? "",
    referralNotes: encounter.referralNotes ?? "",
    temperature: str(encounter.temperature),
    pulse: str(encounter.pulse),
    respRate: str(encounter.respRate),
    bpSystolic: str(encounter.bpSystolic),
    bpDiastolic: str(encounter.bpDiastolic),
    spO2: str(encounter.spO2),
    height: str(encounter.height),
    weight: str(encounter.weight),
  });

  const [dx, setDx] = useState({ code: "", name: "", isPrimary: false });
  const [addingDx, setAddingDx] = useState(false);
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
    labPriority: "ROUTINE",
    labIndication: "",
  });
  const [addingOrder, setAddingOrder] = useState(false);
  const [attach, setAttach] = useState({ title: "", fileName: "", url: "", notes: "" });
  const [addingAttach, setAddingAttach] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revisions, setRevisions] = useState<EncounterRevisionRow[]>([]);
  const [loadingRev, setLoadingRev] = useState(false);

  const set =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (signed && amendReason.trim().length < 3) {
      toast.error(t("reasonRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = signed
        ? await amendEncounter(encounter.id, form, amendReason)
        : await updateEncounter(encounter.id, form);
      if (res.ok) {
        toast.success(t("saved"));
        setAmendReason("");
        setEdit(false);
        router.refresh();
      } else {
        toast.error(t("savedFailed"));
      }
    } catch {
      toast.error(t("savedFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function onSign() {
    setSigning(true);
    try {
      const res = await signEncounter(encounter.id);
      if (res.ok) {
        toast.success(t("signedOk"));
        router.refresh();
      } else {
        toast.error(t("signedFailed"));
      }
    } catch {
      toast.error(t("signedFailed"));
    } finally {
      setSigning(false);
    }
  }

  async function advance(status: string) {
    const res = await setEncounterStatus(encounter.id, status);
    if (res.ok) {
      toast.success(t("saved"));
      router.refresh();
    } else {
      toast.error(t("savedFailed"));
    }
  }

  async function complete() {
    const res = await completeEncounter(encounter.id);
    if (res.ok) {
      toast.success(t("visitCompleted"));
      router.refresh();
    } else {
      toast.error(t("savedFailed"));
    }
  }

  async function openHistory() {
    setHistoryOpen(true);
    setLoadingRev(true);
    setRevisions(await listEncounterRevisions(encounter.id));
    setLoadingRev(false);
  }

  async function submitDx() {
    if (!dx.name.trim()) return;
    setAddingDx(true);
    const res = await addDiagnosis(encounter.id, dx);
    setAddingDx(false);
    if (res.ok) {
      toast.success(t("saved"));
      setDx({ code: "", name: "", isPrimary: false });
      router.refresh();
    } else {
      toast.error(t("savedFailed"));
    }
  }

  async function submitOrder() {
    if (!order.name.trim()) return;
    setAddingOrder(true);
    const res = await addOrder(encounter.id, order);
    setAddingOrder(false);
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
        labPriority: "ROUTINE",
        labIndication: "",
      });
      router.refresh();
    } else if (res.error === "not-allowed") {
      toast.error(tc("failed"));
    } else {
      toast.error(t("savedFailed"));
    }
  }

  async function submitAttach() {
    if (!attach.title.trim()) return;
    setAddingAttach(true);
    const res = await addAttachment(encounter.id, attach);
    setAddingAttach(false);
    if (res.ok) {
      toast.success(t("saved"));
      setAttach({ title: "", fileName: "", url: "", notes: "" });
      router.refresh();
    } else {
      toast.error(t("savedFailed"));
    }
  }

  const field = (k: keyof FormState) => (
    <Textarea rows={3} value={form[k]} onChange={set(k)} />
  );

  const ro = (label: string, value: string | null) => (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <p className="whitespace-pre-wrap text-sm">
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );

  const vital = (label: string, value: string, k: keyof FormState) => (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {edit ? (
        <Input inputMode="decimal" value={form[k]} onChange={set(k)} />
      ) : (
        <p className="text-sm">{value || "—"}</p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_BADGE[encounter.status] ?? "secondary"}>
            {t(`status_${encounter.status}`)}
          </Badge>
          <Badge variant={NOTE_BADGE[encounter.noteStatus] ?? "secondary"}>
            {t(`note_${encounter.noteStatus}`)}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {encounter.encounterNo}
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {t(`visit_${encounter.visitType}`)}
          </span>
          {encounter.triageLevel && (
            <Badge variant={TRIAGE_BADGE[encounter.triageLevel] ?? "secondary"}>
              {tn(`triage_${encounter.triageLevel}`)}
            </Badge>
          )}
          {encounter.doctorName && (
            <span className="text-xs text-muted-foreground">{encounter.doctorName}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {edit ? (
            <>
              {signed && (
                <Input
                  className="w-56"
                  placeholder={t("amendmentReason")}
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                />
              )}
              <Button size="sm" variant="outline" onClick={() => setEdit(false)}>
                {tc("cancel")}
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {t("save")}
              </Button>
            </>
          ) : (
            <>
              {canWrite && !cancelled && encounter.status === "CHECKED_IN" && (
                <Button size="sm" variant="outline" onClick={() => advance("IN_CONSULTATION")}>
                  <Stethoscope />
                  {t("startConsultation")}
                </Button>
              )}
              {canWrite && !cancelled && encounter.status === "IN_CONSULTATION" && (
                <Button size="sm" variant="outline" onClick={complete}>
                  <CheckCircle2 />
                  {t("completeVisit")}
                </Button>
              )}
              {canEditNote && (
                <Button size="sm" variant="outline" onClick={() => setEdit(true)}>
                  {tc("edit")}
                </Button>
              )}
              {signed && canWrite && (
                <Button size="sm" variant="outline" onClick={() => setEdit(true)}>
                  {t("amend")}
                </Button>
              )}
              {canSign && !signed && !cancelled && (
                <Button size="sm" variant="success" onClick={onSign} disabled={signing}>
                  <ShieldCheck />
                  {t("sign")}
                </Button>
              )}
              {canWrite &&
                ["CHECKED_IN", "TRIAGE", "IN_CONSULTATION"].includes(encounter.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const res = await setEncounterStatus(encounter.id, "CANCELLED");
                      if (res.ok) {
                        toast.success(t("saved"));
                        router.refresh();
                      } else {
                        toast.error(t("savedFailed"));
                      }
                    }}
                  >
                    <Eraser />
                    {tc("delete")}
                  </Button>
                )}
              <Button size="sm" variant="ghost" onClick={openHistory}>
                <History />
                {t("noteHistory")}
              </Button>
            </>
          )}
        </div>
      </div>

      {signed && (
        <div className="flex items-start gap-2 rounded-xl border border-success/40 bg-success/5 p-3 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
          <span>
            {t("signedByAt", {
              date: encounter.signedAt
                ? `${fmtDate(new Date(encounter.signedAt))} ${fmtTime(new Date(encounter.signedAt))}`
                : "—",
            })}
            {" "}
            {t("amendHint")}
          </span>
        </div>
      )}

      <Tabs defaultValue="soap">
        <TabsList className="w-full flex-wrap justify-start">
          <TabsTrigger value="soap">{t("tabSoap")}</TabsTrigger>
          <TabsTrigger value="vitals">{t("tabVitals")}</TabsTrigger>
          <TabsTrigger value="diagnoses">{t("tabDiagnoses")}</TabsTrigger>
          <TabsTrigger value="orders">{t("tabOrders")}</TabsTrigger>
          <TabsTrigger value="prescriptions">{t("tabPrescriptions")}</TabsTrigger>
          <TabsTrigger value="attachments">{t("tabAttachments")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("tabTimeline")}</TabsTrigger>
        </TabsList>

        <TabsContent value="soap" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {edit && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>{t("type")}</Label>
                    <Select
                      value={form.visitType}
                      onValueChange={(v) => setForm((f) => ({ ...f, visitType: v }))}
                    >
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
                    <Label>{t("followUpDate")}</Label>
                    <Input type="date" value={form.followUpDate} onChange={set("followUpDate")} />
                  </div>
                </div>
              )}
              {edit ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label>{t("chiefComplaint")}</Label>
                    <Input value={form.chiefComplaint} onChange={set("chiefComplaint")} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("hpi")}</Label>
                    {field("hpi")}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("reviewOfSystems")}</Label>
                    {field("reviewOfSystems")}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label>{t("subjective")}</Label>
                      {field("subjective")}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>{t("objective")}</Label>
                      {field("objective")}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("physicalExamination")}</Label>
                    {field("physicalExamination")}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label>{t("assessment")}</Label>
                      {field("assessment")}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>{t("plan")}</Label>
                      {field("plan")}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("patientInstructions")}</Label>
                    {field("patientInstructions")}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label>{t("followUpPlan")}</Label>
                      {field("followUpPlan")}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>{t("referralSource")}</Label>
                      <Input value={form.referralSource} onChange={set("referralSource")} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("referralNotes")}</Label>
                    {field("referralNotes")}
                  </div>
                </>
              ) : (
                <>
                  {ro(t("chiefComplaint"), encounter.chiefComplaint)}
                  {ro(t("hpi"), encounter.hpi)}
                  {ro(t("reviewOfSystems"), encounter.reviewOfSystems)}
                  {ro(t("subjective"), encounter.subjective)}
                  {ro(t("objective"), encounter.objective)}
                  {ro(t("physicalExamination"), encounter.physicalExamination)}
                  {ro(t("assessment"), encounter.assessment)}
                  {ro(t("plan"), encounter.plan)}
                  {ro(t("patientInstructions"), encounter.patientInstructions)}
                  {ro(t("followUpPlan"), encounter.followUpPlan)}
                  {ro(
                    t("followUpDate"),
                    encounter.followUpDate ? fmtDate(new Date(encounter.followUpDate)) : null,
                  )}
                  {ro(t("referralSource"), encounter.referralSource)}
                  {ro(t("referralNotes"), encounter.referralNotes)}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="grid gap-4 sm:grid-cols-3">
              {vital(t("temperature"), str(encounter.temperature), "temperature")}
              {vital(t("pulse"), str(encounter.pulse), "pulse")}
              {vital(t("respRate"), str(encounter.respRate), "respRate")}
              {vital(t("bpSystolic"), str(encounter.bpSystolic), "bpSystolic")}
              {vital(t("bpDiastolic"), str(encounter.bpDiastolic), "bpDiastolic")}
              {vital(t("spO2"), str(encounter.spO2), "spO2")}
              {vital(t("height"), str(encounter.height), "height")}
              {vital(t("weight"), str(encounter.weight), "weight")}
              </div>
              {encounter.triageNotes && (
                <div className="flex flex-col gap-1.5 border-t pt-3">
                  <Label>{tn("triageNotes")}</Label>
                  <p className="whitespace-pre-wrap text-sm">{encounter.triageNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnoses" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {encounter.diagnoses.length === 0 ? (
                <p className="text-sm text-muted-foreground">{tc("empty")}</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {encounter.diagnoses.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 py-2 text-sm">
                      {d.code && (
                        <span className="font-mono text-xs text-muted-foreground">{d.code}</span>
                      )}
                      <span className="flex-1">{d.name}</span>
                      {d.isPrimary && <Badge variant="info">{t("primaryDx")}</Badge>}
                      {canEditNote && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            const res = await removeDiagnosis(d.id);
                            if (res.ok) router.refresh();
                            else toast.error(t("savedFailed"));
                          }}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canEditNote && (
                <div className="flex flex-wrap items-end gap-3 border-t pt-4">
                  <div className="flex w-32 flex-col gap-2">
                    <Label>{t("icdCode")}</Label>
                    <Input
                      value={dx.code}
                      onChange={(e) => setDx((d) => ({ ...d, code: e.target.value }))}
                    />
                  </div>
                  <div className="flex min-w-48 flex-1 flex-col gap-2">
                    <Label>{t("diagnosisName")}</Label>
                    <Input
                      value={dx.name}
                      onChange={(e) => setDx((d) => ({ ...d, name: e.target.value }))}
                    />
                  </div>
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={dx.isPrimary}
                      onChange={(e) => setDx((d) => ({ ...d, isPrimary: e.target.checked }))}
                    />
                    {t("primaryDx")}
                  </label>
                  <Button onClick={submitDx} disabled={addingDx}>
                    <Plus />
                    {t("addDiagnosis")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {encounter.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{tc("empty")}</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {encounter.orders.map((o) => (
                    <li key={o.id} className="flex items-center gap-3 py-2 text-sm">
                      <Badge variant="secondary">{t(`kind_${o.kind}`)}</Badge>
                      <span className="flex-1">{o.name}</span>
                      {(o.dosage || o.frequency) && (
                        <span className="text-xs text-muted-foreground">
                          {[o.dosage, o.frequency].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      <Badge variant={ORDER_BADGE[o.status] ?? "secondary"}>
                        {t(`orderStatus_${o.status}`)}
                      </Badge>
                      {canOrder && o.status !== "CANCELLED" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            const res = await cancelOrder(o.id);
                            if (res.ok) router.refresh();
                            else toast.error(t("savedFailed"));
                          }}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canOrder && (
                <div className="flex flex-col gap-3 border-t pt-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-2">
                      <Label>{t("orderKind")}</Label>
                      <Select
                        value={order.kind}
                        onValueChange={(v) => setOrder((o) => ({ ...o, kind: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["MEDICATION", "LABORATORY", "IMAGING", "OTHER"].map((k) => (
                            <SelectItem key={k} value={k}>
                              {t(`kind_${k}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label>{t("orderName")}</Label>
                      <Input
                        value={order.name}
                        onChange={(e) => setOrder((o) => ({ ...o, name: e.target.value }))}
                      />
                    </div>
                  </div>
                  {order.kind === "MEDICATION" && (
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="flex flex-col gap-2">
                        <Label>{t("dosage")}</Label>
                        <Input
                          value={order.dosage}
                          onChange={(e) => setOrder((o) => ({ ...o, dosage: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>{t("frequency")}</Label>
                        <Input
                          value={order.frequency}
                          onChange={(e) => setOrder((o) => ({ ...o, frequency: e.target.value }))}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>{t("durationDays")}</Label>
                        <Input
                          inputMode="numeric"
                          value={order.durationDays}
                          onChange={(e) =>
                            setOrder((o) => ({ ...o, durationDays: e.target.value }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>{t("qty")}</Label>
                        <Input
                          value={order.quantity}
                          onChange={(e) => setOrder((o) => ({ ...o, quantity: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                  {order.kind === "LABORATORY" && (
                    <div className="flex flex-col gap-2">
                      <Label>{t("selectTests")}</Label>
                      <div className="grid max-h-48 gap-1 overflow-auto rounded-md border p-2 sm:grid-cols-2">
                        {labTests.map((lt) => (
                          <label key={lt.id} className="flex items-center gap-2 text-sm">
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
                      <div className="flex flex-wrap gap-4">
                        <div className="flex w-44 flex-col gap-2">
                          <Label>{tl("priority")}</Label>
                          <Select
                            value={order.labPriority}
                            onValueChange={(v) => setOrder((o) => ({ ...o, labPriority: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["ROUTINE", "URGENT", "STAT"].map((p) => (
                                <SelectItem key={p} value={p}>
                                  {tl(`priority_${p}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex min-w-56 flex-1 flex-col gap-2">
                          <Label>{tl("indication")}</Label>
                          <Input
                            value={order.labIndication}
                            onChange={(e) => setOrder((o) => ({ ...o, labIndication: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {order.kind === "IMAGING" && (
                    <div className="flex w-48 flex-col gap-2">
                      <Label>{ti("modality")}</Label>
                      <Select
                        value={order.modality}
                        onValueChange={(v) => setOrder((o) => ({ ...o, modality: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODALITIES.map((m) => (
                            <SelectItem key={m} value={m}>
                              {ti(`modality_${m}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label>{t("instructions")}</Label>
                    <Input
                      value={order.instructions}
                      onChange={(e) => setOrder((o) => ({ ...o, instructions: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={submitOrder} disabled={addingOrder}>
                      <Plus />
                      {t("addOrder")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="mt-4">
          <PrescriptionPanel
            encounterId={encounter.id}
            patientId={encounter.patientId}
            medications={medications}
            prescriptions={prescriptions}
            canPrescribe={canPrescribe}
          />
        </TabsContent>

        <TabsContent value="attachments" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              {encounter.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noAttachments")}</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {encounter.attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="flex-1">
                        {a.url ? (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline"
                          >
                            {a.title}
                          </a>
                        ) : (
                          a.title
                        )}
                        {a.fileName && (
                          <span className="ms-2 font-mono text-xs text-muted-foreground">
                            {a.fileName}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(new Date(a.createdAt))}
                      </span>
                      {canAttach && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            const res = await removeAttachment(a.id);
                            if (res.ok) router.refresh();
                            else toast.error(t("savedFailed"));
                          }}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canAttach && (
                <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>{t("attachTitle")}</Label>
                    <Input
                      value={attach.title}
                      onChange={(e) => setAttach((a) => ({ ...a, title: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("attachUrl")}</Label>
                    <Input
                      value={attach.url}
                      onChange={(e) => setAttach((a) => ({ ...a, url: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("attachFileName")}</Label>
                    <Input
                      value={attach.fileName}
                      onChange={(e) => setAttach((a) => ({ ...a, fileName: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t("instructions")}</Label>
                    <Input
                      value={attach.notes}
                      onChange={(e) => setAttach((a) => ({ ...a, notes: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end sm:col-span-2">
                    <Button onClick={submitAttach} disabled={addingAttach}>
                      <Plus />
                      {t("addAttachment")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t("createdAt")}</span>
                <span>{fmtDate(new Date(encounter.createdAt))}</span>
              </div>
              {encounter.startedAt && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t("started")}</span>
                  <span>{fmtTime(new Date(encounter.startedAt))}</span>
                </div>
              )}
              {encounter.signedAt && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{t("sign")}</span>
                  <span>
                    {fmtDate(new Date(encounter.signedAt))} {fmtTime(new Date(encounter.signedAt))}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("noteHistory")}</DialogTitle>
          </DialogHeader>
          {loadingRev ? (
            <p className="text-sm text-muted-foreground">{tc("loading")}</p>
          ) : revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noRevisions")}</p>
          ) : (
            <ul className="flex max-h-96 flex-col gap-3 overflow-auto">
              {revisions.map((r) => (
                <li key={r.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={NOTE_BADGE[r.status] ?? "secondary"}>
                      {t(`note_${r.status}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {t("version")} {r.version}
                    </span>
                    <span className="ms-auto text-xs text-muted-foreground">
                      {fmtDate(new Date(r.createdAt))}
                    </span>
                  </div>
                  {r.amendedByName && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("revisedBy")}: {r.amendedByName}
                    </p>
                  )}
                  {r.reason && (
                    <p className="mt-1 text-xs">
                      {t("revisionReason")}: {r.reason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
