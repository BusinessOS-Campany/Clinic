"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { addLabCategory, addLabTest } from "@/app/[locale]/(app)/lab/actions";
import { LAB_RANGE_SEXES, LAB_SPECIMEN_TYPES } from "@/app/[locale]/(app)/lab/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; code: string; nameAr: string; nameEn: string };
type RangeForm = {
  sex: string;
  ageMinYears: string;
  ageMaxYears: string;
  low: string;
  high: string;
  criticalLow: string;
  criticalHigh: string;
  text: string;
};
type TestRow = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  categoryId: string | null;
  unit: string | null;
  referenceRange: string | null;
  method: string | null;
  specimenType: string;
  collectionInstructions: string | null;
  turnaroundHours: number | null;
  price: number;
  ranges: RangeForm[];
};

const emptyRange: RangeForm = {
  sex: "ANY",
  ageMinYears: "",
  ageMaxYears: "",
  low: "",
  high: "",
  criticalLow: "",
  criticalHigh: "",
  text: "",
};

const emptyTest = {
  code: "",
  nameAr: "",
  nameEn: "",
  categoryId: "",
  unit: "",
  referenceRange: "",
  method: "",
  specimenType: "BLOOD",
  collectionInstructions: "",
  turnaroundHours: "",
  price: "",
  ranges: [] as RangeForm[],
};

export function LabCatalog({ categories, tests }: { categories: Category[]; tests: TestRow[] }) {
  const t = useTranslations("lab");
  const router = useRouter();

  const [catOpen, setCatOpen] = useState(false);
  const [cat, setCat] = useState({ code: "", nameAr: "", nameEn: "" });
  const [testOpen, setTestOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(emptyTest);
  const [busy, setBusy] = useState(false);

  function openTest(row?: TestRow) {
    if (row) {
      setEditId(row.id);
      setF({
        code: row.code,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        categoryId: row.categoryId ?? "",
        unit: row.unit ?? "",
        referenceRange: row.referenceRange ?? "",
        method: row.method ?? "",
        specimenType: row.specimenType,
        collectionInstructions: row.collectionInstructions ?? "",
        turnaroundHours: row.turnaroundHours?.toString() ?? "",
        price: String(row.price),
        ranges: row.ranges.length ? row.ranges : [],
      });
    } else {
      setEditId(null);
      setF(emptyTest);
    }
    setTestOpen(true);
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await addLabCategory(cat);
      if (res.ok) {
        toast.success(t("categoryAdded"));
        setCat({ code: "", nameAr: "", nameEn: "" });
        setCatOpen(false);
        router.refresh();
      } else toast.error(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function saveTest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await addLabTest({
        ...f,
        categoryId: f.categoryId || undefined,
        category: categories.find((c) => c.id === f.categoryId)?.code,
        ranges: f.ranges.map((r) => ({
          sex: r.sex,
          ageMinYears: r.ageMinYears || undefined,
          ageMaxYears: r.ageMaxYears || undefined,
          low: r.low || undefined,
          high: r.high || undefined,
          criticalLow: r.criticalLow || undefined,
          criticalHigh: r.criticalHigh || undefined,
          text: r.text || undefined,
        })),
      });
      if (res.ok) {
        toast.success(t("testAdded"));
        setTestOpen(false);
        router.refresh();
      } else toast.error(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openTest()}>
          <Plus />
          {t("addTest")}
        </Button>
        <Button variant="outline" onClick={() => setCatOpen((v) => !v)}>
          <Plus />
          {t("addCategory")}
        </Button>
      </div>

      {catOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("addCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveCategory} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Input placeholder={t("code")} value={cat.code} onChange={(e) => setCat((s) => ({ ...s, code: e.target.value }))} />
              <Input placeholder={t("nameAr")} value={cat.nameAr} onChange={(e) => setCat((s) => ({ ...s, nameAr: e.target.value }))} />
              <Input placeholder={t("nameEn")} value={cat.nameEn} onChange={(e) => setCat((s) => ({ ...s, nameEn: e.target.value }))} />
              <Button type="submit" disabled={busy}>
                {t("save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden grid-cols-[110px_1fr_1fr_120px_90px_110px_90px] gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>{t("code")}</span>
          <span>{t("nameAr")}</span>
          <span>{t("nameEn")}</span>
          <span>{t("category")}</span>
          <span>{t("unit")}</span>
          <span>{t("specimenType")}</span>
          <span>{t("action")}</span>
        </div>
        {tests.map((test) => (
          <div key={test.id} className="grid grid-cols-1 gap-1 border-b px-3 py-2.5 text-sm last:border-b-0 sm:grid-cols-[90px_1fr_1fr_100px_100px_140px_80px] sm:items-center sm:gap-3">
            <span className="font-mono">{test.code}</span>
            <span>{test.nameAr}</span>
            <span>{test.nameEn}</span>
            <span className="text-muted-foreground">
              {categories.find((c) => c.id === test.categoryId)?.nameEn ?? "—"}
            </span>
            <span className="text-muted-foreground">
              {test.unit ?? "—"}
              {test.ranges.length > 0 && (
                <span className="ms-1 text-xs">{t("rangesCount", { count: test.ranges.length })}</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">{t(`specimen_${test.specimenType}`)}</span>
            <Button variant="ghost" size="sm" onClick={() => openTest(test)}>
              <Pencil />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? t("edit") : t("addTest")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveTest} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label>{t("code")}</Label>
                <Input value={f.code} onChange={(e) => setF((s) => ({ ...s, code: e.target.value }))} required />
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t("nameAr")}</Label>
                <Input value={f.nameAr} onChange={(e) => setF((s) => ({ ...s, nameAr: e.target.value }))} required />
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t("nameEn")}</Label>
                <Input value={f.nameEn} onChange={(e) => setF((s) => ({ ...s, nameEn: e.target.value }))} required />
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t("category")}</Label>
                <Select value={f.categoryId || "__none"} onValueChange={(v) => setF((s) => ({ ...s, categoryId: v === "__none" ? "" : v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t("unit")}</Label>
                <Input value={f.unit} onChange={(e) => setF((s) => ({ ...s, unit: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t("method")}</Label>
                <Input value={f.method} onChange={(e) => setF((s) => ({ ...s, method: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t("specimenType")}</Label>
                <Select value={f.specimenType} onValueChange={(v) => setF((s) => ({ ...s, specimenType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAB_SPECIMEN_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`specimen_${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t("turnaround")}</Label>
                <Input type="number" min="0" value={f.turnaroundHours} onChange={(e) => setF((s) => ({ ...s, turnaroundHours: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t("price")}</Label>
                <Input type="number" min="0" step="0.01" value={f.price} onChange={(e) => setF((s) => ({ ...s, price: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-3">
                <Label>{t("collectionInstructions")}</Label>
                <Input value={f.collectionInstructions} onChange={(e) => setF((s) => ({ ...s, collectionInstructions: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-3">
                <Label>{t("referenceRange")}</Label>
                <Input value={f.referenceRange} onChange={(e) => setF((s) => ({ ...s, referenceRange: e.target.value }))} />
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("referenceRanges")}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setF((s) => ({ ...s, ranges: [...s.ranges, { ...emptyRange }] }))}>
                  <Plus />
                  {t("addRange")}
                </Button>
              </div>
              {f.ranges.map((r, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 border-t pt-2 sm:grid-cols-8">
                  <Select value={r.sex} onValueChange={(v) => setF((s) => ({ ...s, ranges: s.ranges.map((x, idx) => (idx === i ? { ...x, sex: v } : x)) }))}>
                    <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LAB_RANGE_SEXES.map((sx) => (
                        <SelectItem key={sx} value={sx}>{t(`sex_${sx}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder={t("ageMin")} value={r.ageMinYears} onChange={(e) => setF((s) => ({ ...s, ranges: s.ranges.map((x, idx) => (idx === i ? { ...x, ageMinYears: e.target.value } : x)) }))} />
                  <Input placeholder={t("ageMax")} value={r.ageMaxYears} onChange={(e) => setF((s) => ({ ...s, ranges: s.ranges.map((x, idx) => (idx === i ? { ...x, ageMaxYears: e.target.value } : x)) }))} />
                  <Input placeholder={t("low")} value={r.low} onChange={(e) => setF((s) => ({ ...s, ranges: s.ranges.map((x, idx) => (idx === i ? { ...x, low: e.target.value } : x)) }))} />
                  <Input placeholder={t("high")} value={r.high} onChange={(e) => setF((s) => ({ ...s, ranges: s.ranges.map((x, idx) => (idx === i ? { ...x, high: e.target.value } : x)) }))} />
                  <Input placeholder={t("criticalLow")} value={r.criticalLow} onChange={(e) => setF((s) => ({ ...s, ranges: s.ranges.map((x, idx) => (idx === i ? { ...x, criticalLow: e.target.value } : x)) }))} />
                  <Input placeholder={t("criticalHigh")} value={r.criticalHigh} onChange={(e) => setF((s) => ({ ...s, ranges: s.ranges.map((x, idx) => (idx === i ? { ...x, criticalHigh: e.target.value } : x)) }))} />
                  <div className="flex items-center gap-1">
                    <Input placeholder={t("text")} value={r.text} onChange={(e) => setF((s) => ({ ...s, ranges: s.ranges.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)) }))} />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setF((s) => ({ ...s, ranges: s.ranges.filter((_, idx) => idx !== i) }))}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTestOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {t("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
