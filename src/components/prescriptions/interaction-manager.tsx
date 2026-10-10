"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  createInteraction,
  deleteInteraction,
  updateInteraction,
} from "@/app/[locale]/(app)/pharmacy/interactions/actions";
import {
  INTERACTION_SEVERITIES,
  type InteractionSeverity,
} from "@/app/[locale]/(app)/pharmacy/interactions/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export type InteractionItem = {
  id: string;
  drugA: string;
  drugB: string;
  severity: string;
  description: string | null;
};

const SEVERITY_BADGE: Record<
  string,
  "secondary" | "info" | "warning" | "destructive"
> = {
  MINOR: "secondary",
  MODERATE: "info",
  MAJOR: "warning",
  CONTRAINDICATED: "destructive",
};

type FormState = {
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  description: string;
};

const EMPTY: FormState = {
  drugA: "",
  drugB: "",
  severity: "MODERATE",
  description: "",
};

export function InteractionManager({
  rows,
  drugNames,
  canManage,
}: {
  rows: InteractionItem[];
  drugNames: string[];
  canManage: boolean;
}) {
  const t = useTranslations("interactions");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.drugA, r.drugB, r.description ?? ""].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [rows, query]);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY);
    setError(null);
    setOpen(true);
  }

  function openEdit(r: InteractionItem) {
    setEditId(r.id);
    setForm({
      drugA: r.drugA,
      drugB: r.drugB,
      severity: r.severity as InteractionSeverity,
      description: r.description ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    if (!form.drugA.trim() || !form.drugB.trim()) {
      setError(t("drugsRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    const values = {
      drugA: form.drugA,
      drugB: form.drugB,
      severity: form.severity,
      description: form.description || undefined,
    };
    const res = editId
      ? await updateInteraction(editId, values)
      : await createInteraction(values);
    setBusy(false);
    if (!res.ok) {
      setError(res.error === "conflict" ? t("duplicate") : t("saveFailed"));
      return;
    }
    setOpen(false);
  }

  async function remove(id: string) {
    await deleteInteraction(id);
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
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("add")}
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">{t("colDrugA")}</th>
              <th className="px-3 py-2 text-start">{t("colDrugB")}</th>
              <th className="px-3 py-2 text-start">{t("colSeverity")}</th>
              <th className="px-3 py-2 text-start">{t("colDescription")}</th>
              {canManage && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{r.drugA}</td>
                  <td className="px-3 py-2 font-medium">{r.drugB}</td>
                  <td className="px-3 py-2">
                    <Badge variant={SEVERITY_BADGE[r.severity] ?? "secondary"}>
                      {t(`severity_${r.severity}`)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.description || "—"}
                  </td>
                  {canManage && (
                    <td className="px-3 py-2 text-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteInteraction(r.id).then(() => {})}
                      >
                        <Trash2 />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? t("edit") : t("add")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("colDrugA")}</Label>
                <Input
                  list="drug-name-options"
                  value={form.drugA}
                  onChange={(e) => setForm({ ...form, drugA: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("colDrugB")}</Label>
                <Input
                  list="drug-name-options"
                  value={form.drugB}
                  onChange={(e) => setForm({ ...form, drugB: e.target.value })}
                />
              </div>
            </div>
            <datalist id="drug-name-options">
              {drugNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <div className="flex flex-col gap-2">
              <Label>{t("colSeverity")}</Label>
              <Select
                value={form.severity}
                onValueChange={(v) =>
                  setForm({ ...form, severity: v as InteractionSeverity })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`severity_${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("colDescription")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
