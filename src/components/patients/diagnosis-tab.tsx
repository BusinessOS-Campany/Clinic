"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Info,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createCatalogEntry,
  createDiagnosis,
  deleteDiagnosis,
  listCatalogEntries,
  listDiagnosisRevisions,
  searchDiagnosisCatalog,
  toggleCatalogEntry,
  updateCatalogEntry,
  updateDiagnosis,
  type CatalogListRow,
  type CatalogSearchResult,
} from "@/app/[locale]/(app)/patients/[id]/profile-actions";
import {
  CODE_SYSTEMS,
  DIAGNOSIS_STATUSES,
  DIAGNOSIS_TYPES,
  catalogEntrySchema,
  diagnosisSchema,
  type CatalogEntryFormValues,
  type DiagnosisFormValues,
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
import { RevisionDialog } from "@/components/patients/medical-history-tab";

export type DiagnosisRow = {
  id: string;
  name: string;
  code: string | null;
  codeSystem: string;
  description: string | null;
  type: string;
  status: string;
  symptoms: string | null;
  clinicalFindings: string | null;
  supportiveResults: string | null;
  diagnosedOn: string | null;
  diagnosedBy: string | null;
  treatmentPlan: string | null;
  followUp: string | null;
  notes: string | null;
  isChronic: boolean;
  updatedByName: string | null;
  updatedAt: string;
};

const EMPTY: DiagnosisFormValues = {
  catalogId: "",
  name: "",
  code: "",
  codeSystem: "NONE",
  description: "",
  type: "PRIMARY",
  status: "SUSPECTED",
  symptoms: "",
  clinicalFindings: "",
  supportiveResults: "",
  diagnosedOn: "",
  diagnosedBy: "",
  treatmentPlan: "",
  followUp: "",
  notes: "",
  isChronic: false,
  encounterId: "",
  changeNote: "",
};

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "success" | "destructive" | "info"> = {
  SUSPECTED: "warning",
  PROVISIONAL: "info",
  CONFIRMED: "success",
  RULED_OUT: "secondary",
  RESOLVED: "secondary",
  CHRONIC: "destructive",
};

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function DiagnosisTab({
  patientId,
  rows,
  canWrite,
  canManage,
  locale,
}: {
  patientId: string;
  rows: DiagnosisRow[];
  canWrite: boolean;
  canManage: boolean;
  locale: string;
}) {
  const t = useTranslations("profile");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiagnosisRow | null>(null);
  const [values, setValues] = useState<DiagnosisFormValues>(EMPTY);
  const [deleting, setDeleting] = useState<DiagnosisRow | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [revTitle, setRevTitle] = useState("");
  const [revisions, setRevisions] = useState<Awaited<
    ReturnType<typeof listDiagnosisRevisions>
  > | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof DiagnosisFormValues>(
    key: K,
    value: DiagnosisFormValues[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  function openCreate() {
    setEditing(null);
    setValues(EMPTY);
    setOpen(true);
  }

  function openEdit(row: DiagnosisRow) {
    setEditing(row);
    setValues({
      catalogId: "",
      name: row.name,
      code: row.code ?? "",
      codeSystem: row.codeSystem as DiagnosisFormValues["codeSystem"],
      description: row.description ?? "",
      type: row.type as DiagnosisFormValues["type"],
      status: row.status as DiagnosisFormValues["status"],
      symptoms: row.symptoms ?? "",
      clinicalFindings: row.clinicalFindings ?? "",
      supportiveResults: row.supportiveResults ?? "",
      diagnosedOn: toDateInput(row.diagnosedOn),
      diagnosedBy: row.diagnosedBy ?? "",
      treatmentPlan: row.treatmentPlan ?? "",
      followUp: row.followUp ?? "",
      notes: row.notes ?? "",
      isChronic: row.isChronic,
      encounterId: "",
      changeNote: "",
    });
    setOpen(true);
  }

  async function onSubmit() {
    const parsed = diagnosisSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(t("saveFailed"));
      return;
    }
    setSaving(true);
    const res = editing
      ? await updateDiagnosis(patientId, editing.id, values)
      : await createDiagnosis(patientId, values);
    setSaving(false);
    if (res.ok) {
      toast.success(t("saveSuccess"));
      setOpen(false);
      window.location.reload();
    } else {
      toast.error(t("saveFailed"));
    }
  }

  async function onDelete() {
    if (!deleting) return;
    const res = await deleteDiagnosis(patientId, deleting.id);
    if (res.ok) {
      toast.success(t("deleteSuccess"));
      window.location.reload();
    } else {
      toast.error(t("saveFailed"));
    }
    setDeleting(null);
  }

  async function onHistory(row: DiagnosisRow) {
    setRevTitle(row.name);
    setRevisions([]);
    setRevisions(await listDiagnosisRevisions(patientId, row.id));
  }

  const fmt = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
          dateStyle: "medium",
        }).format(new Date(iso))
      : "—";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 rounded-xl border border-info/40 bg-info/5 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-info" />
        <span>{t("diagnosisDisclaimer")}</span>
      </div>

      {rows.some((r) => r.isChronic) && (
        <div className="flex flex-col gap-1 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="size-4" />
            {t("chronicDiagnoses")}
          </p>
          <p className="text-muted-foreground">
            {rows.filter((r) => r.isChronic).map((r) => r.name).join("، ")}
          </p>
        </div>
      )}

      {canWrite && (
        <div className="flex justify-end gap-2">
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => setCatalogOpen(true)}>
              <Settings2 />
              {t("manageCatalog")}
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus />
            {t("newDiagnosis")}
          </Button>
        </div>
      )}

      {rows.length === 0 && (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border bg-card">
          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.name}</span>
                    {row.code && (
                      <Badge variant="outline">
                        {row.codeSystem !== "NONE" ? `${row.codeSystem} ` : ""}
                        {row.code}
                      </Badge>
                    )}
                    <Badge variant={STATUS_VARIANT[row.status] ?? "secondary"}>
                      {t(`dxStatus_${row.status}`)}
                    </Badge>
                    <Badge variant="outline">{t(`type_${row.type}`)}</Badge>
                  </div>
                  {row.description && (
                    <p className="text-sm text-muted-foreground">{row.description}</p>
                  )}
                  {row.clinicalFindings && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t("clinicalFindings")}: </span>
                      {row.clinicalFindings}
                    </p>
                  )}
                  {row.treatmentPlan && (
                    <p className="text-sm">
                      {t("treatmentPlan")}: {row.treatmentPlan}
                    </p>
                  )}
                  {row.followUp && (
                    <p className="text-sm text-muted-foreground">
                      {t("followUp")}: {row.followUp}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("diagnosedOn")}: {fmt(row.diagnosedOn)}
                    {row.diagnosedBy ? ` · ${row.diagnosedBy}` : ""}
                    {" · "}
                    {t("lastUpdated")}: {fmt(row.updatedAt)}
                    {row.updatedByName ? ` (${row.updatedByName})` : ""}
                  </p>
                </div>
                {canWrite && (
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" title={t("historyRevisions")} onClick={() => void onHistory(row)}>
                      <Search />
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
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("newDiagnosis")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {canManage && <CatalogPicker onPick={(c) => applyCatalog(c, set)} />}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("name")} *</Label>
                <Input value={values.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("code")}</Label>
                <Input value={values.code ?? ""} onChange={(e) => set("code", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>{t("codeSystem")}</Label>
                <Select value={values.codeSystem} onValueChange={(v) => set("codeSystem", v as DiagnosisFormValues["codeSystem"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CODE_SYSTEMS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`codeSystem_${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("type")}</Label>
                <Select value={values.type} onValueChange={(v) => set("type", v as DiagnosisFormValues["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAGNOSIS_TYPES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`dxtype_${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("status")}</Label>
                <Select value={values.status} onValueChange={(v) => set("status", v as DiagnosisFormValues["status"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAGNOSIS_STATUSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`dxStatus_${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("description")}</Label>
              <Textarea rows={2} value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>{t("symptoms")}</Label>
                <Textarea rows={2} value={values.symptoms ?? ""} onChange={(e) => set("symptoms", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("clinicalFindings")}</Label>
                <Textarea rows={2} value={values.clinicalFindings ?? ""} onChange={(e) => set("clinicalFindings", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("supportiveResults")}</Label>
                <Textarea rows={2} value={values.supportiveResults ?? ""} onChange={(e) => set("supportiveResults", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("diagnosedOn")}</Label>
                <Input type="date" value={values.diagnosedOn ?? ""} onChange={(e) => set("diagnosedOn", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("diagnosedBy")}</Label>
                <Input value={values.diagnosedBy ?? ""} onChange={(e) => set("diagnosedBy", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("treatmentPlan")}</Label>
                <Textarea rows={2} value={values.treatmentPlan ?? ""} onChange={(e) => set("treatmentPlan", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("followUp")}</Label>
                <Textarea rows={2} value={values.followUp ?? ""} onChange={(e) => set("followUp", e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("notes")}</Label>
              <Textarea rows={2} value={values.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={values.isChronic ?? false} onChange={(e) => set("isChronic", e.target.checked)} />
              {t("isChronic")}
            </label>

            {editing && (
              <div className="flex flex-col gap-2">
                <Label>{t("changeNote")}</Label>
                <Input value={values.changeNote ?? ""} onChange={(e) => set("changeNote", e.target.value)} />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={onSubmit} disabled={saving}>
                {t("save")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RevisionDialog
        patientId={patientId}
        title={revTitle}
        revisions={revisions}
        onClose={() => setRevisions(null)}
        labels={{
          changeNote: t("changeNote"),
          changedBy: t("changedBy"),
          empty: t("noRevisions"),
        }}
      />

      {canManage && (
        <CatalogManager
          open={catalogOpen}
          onOpenChange={setCatalogOpen}
          onChanged={() => window.location.reload()}
        />
      )}
    </div>
  );
}

function applyCatalog(
  c: CatalogSearchResult,
  set: <K extends keyof DiagnosisFormValues>(k: K, v: DiagnosisFormValues[K]) => void,
) {
  set("catalogId", c.id);
  set("name", c.nameEn);
  set("code", c.code);
  set("codeSystem", c.codeSystem as DiagnosisFormValues["codeSystem"]);
  set("description", c.description ?? "");
}

function CatalogPicker({
  onPick,
}: {
  onPick: (c: CatalogSearchResult) => void;
}) {
  const t = useTranslations("profile");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CatalogSearchResult[]>([]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setResults(await searchDiagnosisCatalog(q));
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <div className="relative flex flex-col gap-2">
      <Label>{t("searchCatalog")}</Label>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("searchCatalogPlaceholder")}
      />
      {q.length >= 2 && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border bg-card">
          {results.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">{t("noCatalogResults")}</li>
          )}
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm hover:bg-accent"
                onClick={() => {
                  onPick(c);
                  setQ("");
                }}
              >
                <span>
                  {c.nameEn}
                  {c.nameAr ? ` — ${c.nameAr}` : ""}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {c.codeSystem !== "NONE" ? `${c.codeSystem} ` : ""}
                  {c.code}
                  {c.isStandard ? ` · ${t("standardCode")}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CatalogManager({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  const t = useTranslations("profile");
  const [rows, setRows] = useState<CatalogListRow[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<
    (CatalogEntryFormValues & { id?: string }) | null
  >(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    void listCatalogEntries(q).then(setRows);
  }, [open, q]);

  async function save() {
    if (!form) return;
    const parsed = catalogEntrySchema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("saveFailed"));
      return;
    }
    setSaving(true);
    const res = form.id
      ? await updateCatalogEntry(form.id, form)
      : await createCatalogEntry(form);
    setSaving(false);
    if (res.ok) {
      toast.success(t("saveSuccess"));
      setForm(null);
      setRows(await listCatalogEntries(q));
      onChanged();
    } else if (res.error === "duplicate") {
      toast.error(t("duplicateCode"));
    } else if (res.error === "standard") {
      toast.error(t("standardProtected"));
    } else {
      toast.error(t("saveFailed"));
    }
  }

  async function toggle(row: CatalogListRow) {
    const res = await toggleCatalogEntry(row.id, !row.isActive);
    if (res.ok) setRows(await listCatalogEntries(q));
    else toast.error(t("saveFailed"));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("manageCatalog")}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("searchCatalog")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() =>
              setForm({
                code: "",
                codeSystem: "LOCAL",
                nameEn: "",
                nameAr: "",
                description: "",
                category: "",
                isActive: true,
              })
            }
          >
            <Plus />
            {t("newCatalogEntry")}
          </Button>
        </div>

        {form && (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={t("code")}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <Select
                value={form.codeSystem}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    codeSystem: v as CatalogEntryFormValues["codeSystem"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODE_SYSTEMS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`codeSystem_${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder={t("nameEn")}
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              />
              <Input
                placeholder={t("nameAr")}
                value={form.nameAr ?? ""}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setForm(null)}>
                {t("cancel")}
              </Button>
              <Button onClick={save} disabled={saving}>
                {t("save")}
              </Button>
            </div>
          </div>
        )}

        <ul className="divide-y rounded-lg border">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-2 p-3 text-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {row.nameEn}
                  {row.nameAr ? ` — ${row.nameAr}` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {row.codeSystem !== "NONE" ? `${row.codeSystem} ` : ""}
                  {row.code}
                  {row.isStandard ? ` · ${t("standardCode")}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={row.isActive ? "success" : "secondary"}>
                  {row.isActive ? t("active") : t("inactive")}
                </Badge>
                {!row.isStandard && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setForm({
                          id: row.id,
                          code: row.code,
                          codeSystem: row.codeSystem as CatalogEntryFormValues["codeSystem"],
                          nameEn: row.nameEn,
                          nameAr: row.nameAr ?? "",
                          description: "",
                          category: row.category ?? "",
                          isActive: row.isActive,
                        })
                      }
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={!row.isActive}
                      onClick={() => toggle(row)}
                    >
                      <Trash2 />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
