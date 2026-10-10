"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  History as HistoryIcon,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createMedicalHistory,
  deleteMedicalHistory,
  listMedicalHistoryRevisions,
  reviewMedicalHistory,
  updateMedicalHistory,
  type RevisionEntry,
} from "@/app/[locale]/(app)/patients/[id]/profile-actions";
import {
  HISTORY_SOURCES,
  HISTORY_STATUSES,
  HISTORY_VERIFICATIONS,
  MEDICAL_HISTORY_CATEGORIES,
  medicalHistorySchema,
  type MedicalHistoryFormValues,
} from "@/app/[locale]/(app)/patients/[id]/profile-schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MedicalHistoryRow = {
  id: string;
  category: string;
  condition: string;
  detail: string | null;
  medication: string | null;
  diagnosis: string | null;
  notes: string | null;
  startedOn: string | null;
  resolvedOn: string | null;
  status: string;
  verification: string;
  source: string;
  sourceName: string | null;
  isAlert: boolean;
  alertNote: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  updatedAt: string;
};

const EMPTY: MedicalHistoryFormValues = {
  category: "PREVIOUS_ILLNESS",
  condition: "",
  detail: "",
  medication: "",
  diagnosis: "",
  notes: "",
  startedOn: "",
  resolvedOn: "",
  status: "ACTIVE",
  verification: "PATIENT_REPORTED",
  source: "PATIENT",
  sourceName: "",
  isAlert: false,
  alertNote: "",
  changeNote: "",
};

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function MedicalHistoryTab({
  patientId,
  rows,
  canWrite,
  locale,
}: {
  patientId: string;
  rows: MedicalHistoryRow[];
  canWrite: boolean;
  locale: string;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MedicalHistoryRow | null>(null);
  const [deleting, setDeleting] = useState<MedicalHistoryRow | null>(null);
  const [revisions, setRevisions] = useState<RevisionEntry[] | null>(null);
  const [revTitle, setRevTitle] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<MedicalHistoryFormValues>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: EMPTY,
  });

  const isAlert = watch("isAlert");

  function openCreate() {
    setEditing(null);
    reset(EMPTY);
    setOpen(true);
  }

  function openEdit(row: MedicalHistoryRow) {
    setEditing(row);
    reset({
      category: row.category as MedicalHistoryFormValues["category"],
      condition: row.condition,
      detail: row.detail ?? "",
      medication: row.medication ?? "",
      diagnosis: row.diagnosis ?? "",
      notes: row.notes ?? "",
      startedOn: toDateInput(row.startedOn),
      resolvedOn: toDateInput(row.resolvedOn),
      status: row.status as MedicalHistoryFormValues["status"],
      verification: row.verification as MedicalHistoryFormValues["verification"],
      source: row.source as MedicalHistoryFormValues["source"],
      sourceName: row.sourceName ?? "",
      isAlert: row.isAlert,
      alertNote: row.alertNote ?? "",
      changeNote: "",
    });
    setOpen(true);
  }

  async function onSubmit(values: MedicalHistoryFormValues) {
    const res = editing
      ? await updateMedicalHistory(patientId, editing.id, values)
      : await createMedicalHistory(patientId, values);
    if (res.ok) {
      toast.success(t("saveSuccess"));
      setOpen(false);
      router.refresh();
    } else {
      toast.error(t("saveFailed"));
    }
  }

  async function onDelete() {
    if (!deleting) return;
    const res = await deleteMedicalHistory(patientId, deleting.id);
    if (res.ok) {
      toast.success(t("deleteSuccess"));
      router.refresh();
    } else {
      toast.error(t("saveFailed"));
    }
    setDeleting(null);
  }

  async function onReview(row: MedicalHistoryRow) {
    const res = await reviewMedicalHistory(patientId, row.id);
    if (res.ok) {
      toast.success(t("saveSuccess"));
      router.refresh();
    } else {
      toast.error(t("saveFailed"));
    }
  }

  async function onHistory(row: MedicalHistoryRow) {
    setRevTitle(row.condition);
    setRevisions([]);
    const list = await listMedicalHistoryRevisions(patientId, row.id);
    setRevisions(list);
  }

  const fmt = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
          dateStyle: "medium",
        }).format(new Date(iso))
      : "—";

  const alerts = rows.filter((r) => r.isAlert);
  const grouped = MEDICAL_HISTORY_CATEGORIES.map((category) => ({
    category,
    items: rows.filter((r) => r.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {rows.some((r) => r.isAlert) && (
        <div className="flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="size-4" />
            {t("historyAlerts")}
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {rows
              .filter((r) => r.isAlert)
              .map((r) => (
                <li key={r.id}>
                  <span className="font-medium">{r.condition}</span>
                  {r.alertNote ? ` — ${r.alertNote}` : ""}
                </li>
              ))}
          </ul>
        </div>
      )}

      {canWrite && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus />
            {t("add")}
          </Button>
        </div>
      )}

      {rows.length === 0 && (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      )}

      {MEDICAL_HISTORY_CATEGORIES.map((cat) => {
        const items = rows.filter((r) => r.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="rounded-xl border bg-card">
            <div className="border-b px-4 py-2.5">
              <h3 className="text-sm font-semibold">{t(`category_${cat}`)}</h3>
            </div>
            <ul className="divide-y">
              {items.map((row) => (
                <li key={row.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{row.condition}</span>
                      {row.isAlert && (
                        <Badge variant="destructive">
                          <AlertTriangle /> {t("alert")}
                        </Badge>
                      )}
                      <Badge variant="secondary">{t(`hstatus_${row.status}`)}</Badge>
                      <Badge variant={row.verification === "CLINICIAN_CONFIRMED" ? "success" : "outline"}>
                        {t(`verification_${row.verification}`)}
                      </Badge>
                    </div>
                    {row.detail && <p className="text-sm text-muted-foreground">{row.detail}</p>}
                    {row.medication && (
                      <p className="text-sm text-muted-foreground">
                        {t("medication")}: {row.medication}
                      </p>
                    )}
                    {row.notes && <p className="text-sm text-muted-foreground">{row.notes}</p>}
                    <p className="text-xs text-muted-foreground">
                      {t("source")}: {t(`source_${row.source}`)}
                      {row.sourceName ? ` (${row.sourceName})` : ""}
                      {" · "}
                      {t("startedOn")}: {row.startedOn ? toDateInput(row.startedOn) : "—"}
                      {" · "}
                      {t("resolvedOn")}: {row.resolvedOn ? toDateInput(row.resolvedOn) : "—"}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {row.reviewedAt ? (
                        <>
                          <ShieldCheck className="size-3.5 text-emerald-600" />
                          {t("reviewedByUser", { name: row.reviewedByName ?? "—" })}
                          {" · "}
                          {toDateInput(row.reviewedAt)}
                        </>
                      ) : (
                        t("notReviewed")
                      )}
                    </p>
                  </div>
                  {canWrite && (
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="ghost" title={t("historyRevisions")} onClick={() => void onHistory(row)}>
                        <HistoryIcon />
                      </Button>
                      <Button size="icon" variant="ghost" title={t("review")} onClick={() => onReview(row)}>
                        <CheckCircle2 />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                        <Pencil />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleting(row)}>
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("newMedicalHistory")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t("category")} *</Label>
              <Select
                value={watch("category")}
                onValueChange={(v) => setValue("category", v as MedicalHistoryFormValues["category"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL_HISTORY_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`category_${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="mh-condition">{t("condition")} *</Label>
              <Input id="mh-condition" {...register("condition")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mh-detail">{t("detail")}</Label>
                <Textarea id="mh-detail" rows={2} {...register("detail")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mh-medication">{t("medication")}</Label>
                <Input id="mh-medication" {...register("medication")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>{t("status")}</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as MedicalHistoryFormValues["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HISTORY_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`hstatus_${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("startedOn")}</Label>
                <Input type="date" {...register("startedOn")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("resolvedOn")}</Label>
                <Input type="date" {...register("resolvedOn")} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("verification")}</Label>
                <Select
                  value={watch("verification")}
                  onValueChange={(v) => setValue("verification", v as MedicalHistoryFormValues["verification"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HISTORY_VERIFICATIONS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`verification_${v}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("source")}</Label>
                <Select
                  value={watch("source")}
                  onValueChange={(v) => setValue("source", v as MedicalHistoryFormValues["source"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HISTORY_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`source_${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="mh-source-name">{t("sourceName")}</Label>
              <Input id="mh-source-name" {...register("sourceName")} />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("isAlert")} />
              {t("markAsAlert")}
            </label>
            {isAlert && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="mh-alert-note">{t("alertNote")}</Label>
                <Input id="mh-alert-note" {...register("alertNote")} />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="mh-diagnosis">{t("diagnosis")}</Label>
              <Input id="mh-diagnosis" {...register("diagnosis")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mh-notes">{t("notes")}</Label>
              <Textarea id="mh-notes" rows={2} {...register("notes")} />
            </div>
            {editing && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="mh-change-note">{t("changeNote")}</Label>
                <Input id="mh-change-note" {...register("changeNote")} />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? tc("saving") : tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>{tc("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RevisionDialog
        patientId={patientId}
        title={revTitle}
        revisions={revisions}
        onClose={() => setRevisions(null)}
      />
    </div>
  );
}

export function RevisionDialog({
  title,
  revisions,
  onClose,
  labels,
}: {
  patientId?: string;
  title: string;
  revisions: RevisionEntry[] | null;
  onClose: () => void;
  labels?: {
    heading?: string;
    empty?: string;
    changedBy?: string;
    changeNote?: string;
  };
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const l = {
    heading: labels?.heading ?? t("historyRevisions"),
    empty: labels?.empty ?? t("noRevisions"),
    changedBy: labels?.changedBy ?? t("changedBy"),
    changeNote: labels?.changeNote ?? t("changeNote"),
  };
  return (
    <Dialog open={revisions !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {l.heading}: {title}
          </DialogTitle>
        </DialogHeader>
        {revisions && revisions.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">{l.empty}</p>
        )}
        <ul className="flex flex-col gap-3">
          {revisions?.map((r) => (
            <li key={r.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">
                {new Date(r.createdAt).toLocaleString()}
                {r.changedByName ? ` · ${l.changedBy}: ${r.changedByName}` : ""}
              </p>
              {r.changeNote && (
                <p className="text-muted-foreground">
                  {l.changeNote}: {r.changeNote}
                </p>
              )}
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted-foreground" dir="ltr">
                {JSON.stringify(r.snapshot, null, 1)}
              </pre>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {tc("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
