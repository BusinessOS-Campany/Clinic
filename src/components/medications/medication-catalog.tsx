"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Search } from "lucide-react";
import {
  createMedication,
  toggleMedicationActive,
  updateMedication,
} from "@/app/[locale]/(app)/pharmacy/medications/actions";
import {
  MEDICATION_FORMS,
  MEDICATION_ROUTES,
  type MedicationFormValue,
  type MedicationRouteValue,
} from "@/app/[locale]/(app)/pharmacy/medications/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export type CatalogMedication = {
  id: string;
  code: string;
  genericName: string;
  brandName: string | null;
  strength: string | null;
  strengthUnit: string | null;
  form: string;
  route: string;
  category: string | null;
  isActive: boolean;
};

type FormState = {
  code: string;
  genericName: string;
  brandName: string;
  strength: string;
  strengthUnit: string;
  form: MedicationFormValue;
  route: MedicationRouteValue;
  category: string;
  isControlled: boolean;
  isActive: boolean;
};

const EMPTY: FormState = {
  code: "",
  genericName: "",
  brandName: "",
  strength: "",
  strengthUnit: "",
  form: "TABLET",
  route: "ORAL",
  category: "",
  isControlled: false,
  isActive: true,
};

export function MedicationCatalog({
  rows,
  canManage,
}: {
  rows: CatalogMedication[];
  canManage: boolean;
}) {
  const t = useTranslations("medications");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((m) =>
      [m.code, m.genericName, m.brandName, m.category]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY);
    setError(null);
    setOpen(true);
  }

  function openEdit(m: CatalogMedication) {
    setEditId(m.id);
    setForm({
      code: m.code,
      genericName: m.genericName,
      brandName: m.brandName ?? "",
      strength: m.strength ?? "",
      strengthUnit: m.strengthUnit ?? "",
      form: m.form as MedicationFormValue,
      route: m.route as MedicationRouteValue,
      category: m.category ?? "",
      isControlled: false,
      isActive: m.isActive,
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const values = {
      code: form.code,
      genericName: form.genericName,
      brandName: form.brandName || undefined,
      strength: form.strength || undefined,
      strengthUnit: form.strengthUnit || undefined,
      form: form.form,
      route: form.route,
      category: form.category || undefined,
      isControlled: form.isControlled,
      isActive: form.isActive,
    };
    const res = editId
      ? await updateMedication(editId, values)
      : await createMedication(values);
    setBusy(false);
    if (!res.ok) {
      setError(res.error === "conflict" ? t("codeTaken") : t("saveFailed"));
      return;
    }
    setOpen(false);
  }

  async function toggle(id: string) {
    await toggleMedicationActive(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-8"
          />
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditId(null);
              setForm(EMPTY);
              setError(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("add")}
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-start text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">{t("colMedication")}</th>
              <th className="px-3 py-2 text-start">{t("colStrength")}</th>
              <th className="px-3 py-2 text-start">{t("colForm")}</th>
              <th className="px-3 py-2 text-start">{t("colRoute")}</th>
              <th className="px-3 py-2 text-start">{t("colStatus")}</th>
              {canManage && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 6 : 5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{m.genericName}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.brandName ? `${m.brandName} · ` : ""}
                      {m.code}
                      {m.category ? ` · ${m.category}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {m.strength ? `${m.strength} ${m.strengthUnit ?? ""}`.trim() : "—"}
                  </td>
                  <td className="px-3 py-2">{t(`form_${m.form}`)}</td>
                  <td className="px-3 py-2">{t(`route_${m.route}`)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        m.isActive
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                          : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      }
                    >
                      {m.isActive ? t("active") : t("inactive")}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-3 py-2 text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setForm({
                            code: m.code,
                            genericName: m.genericName,
                            brandName: m.brandName ?? "",
                            strength: m.strength ?? "",
                            strengthUnit: m.strengthUnit ?? "",
                            form: m.form as MedicationFormValue,
                            route: m.route as MedicationRouteValue,
                            category: m.category ?? "",
                            isControlled: false,
                            isActive: m.isActive,
                          });
                          setEditId(m.id);
                          setError(null);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-4" />
                        {t("edit")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggle(m.id)}
                      >
                        {m.isActive ? t("inactivate") : t("activate")}
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? t("edit") : t("add")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("fieldGeneric")}</Label>
              <Input
                value={form.genericName}
                onChange={(e) => setForm({ ...form, genericName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("fieldCode")}</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("fieldBrand")}</Label>
              <Input
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("fieldCategory")}</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("fieldStrength")}</Label>
              <Input
                value={form.strength}
                onChange={(e) => setForm({ ...form, strength: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("fieldStrengthUnit")}</Label>
              <Input
                value={form.strengthUnit}
                onChange={(e) => setForm({ ...form, strengthUnit: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("colForm")}</Label>
              <Select
                value={form.form}
                onValueChange={(v) => setForm({ ...form, form: v as MedicationFormValue })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDICATION_FORMS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {t(`form_${f}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("colRoute")}</Label>
              <Select
                value={form.route}
                onValueChange={(v) => setForm({ ...form, route: v as MedicationRouteValue })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDICATION_ROUTES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`route_${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? t("saving") : t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
