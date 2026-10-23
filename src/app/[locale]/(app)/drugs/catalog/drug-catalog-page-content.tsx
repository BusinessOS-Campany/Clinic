"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2, Pen, AlertTriangle, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  createDrugCatalogEntry,
  updateDrugCatalogEntry,
  deleteDrugCatalogEntry,
  createDrugInteraction,
  updateDrugInteraction,
  deleteDrugInteraction,
} from "@/app/[locale]/(app)/drugs/actions";
import { DOSAGE_FORMS, ROUTES, PREGNANCY_CATEGORIES } from "@/app/[locale]/(app)/drugs/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Drug {
  id: string;
  genericName: string;
  genericNameAr: string | null;
  brandNames: string | null;
  strength: string;
  dosageForm: string;
  route: string;
  atcCode: string | null;
  category: string | null;
  manufacturer: string | null;
  productId: string | null;
  isControlled: boolean;
  schedule: string | null;
  maxDailyDose: unknown;
  maxSingleDose: unknown;
  minAge: number | null;
  maxAge: number | null;
  pregnancyCategory: string | null;
  renalAdjustment: boolean;
  hepaticAdjustment: boolean;
  contraindications: string | null;
  monitoringRequired: string | null;
  isActive: boolean;
}

interface Interaction {
  id: string;
  severity: string;
  mechanism: string | null;
  management: string | null;
  evidenceLevel: string | null;
  onset: string | null;
  isActive: boolean;
  drug1: { id: string; genericName: string; strength: string; dosageForm: string };
  drug2: { id: string; genericName: string; strength: string; dosageForm: string };
}

export function DrugCatalogPageContent({
  drugs,
  interactions,
  canManage,
}: {
  drugs: Drug[];
  interactions: Interaction[];
  canManage: boolean;
}) {
  const t = useTranslations("drugs");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("catalog");
  const [drugDialogOpen, setDrugDialogOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [busy, setBusy] = useState(false);

  const [drugForm, setDrugForm] = useState({
    genericName: "",
    genericNameAr: "",
    brandNames: "",
    strength: "",
    dosageForm: "TABLET",
    route: "ORAL",
    atcCode: "",
    category: "",
    manufacturer: "",
    productId: "",
    isControlled: false,
    schedule: "",
    maxDailyDose: "",
    maxSingleDose: "",
    minAge: "",
    maxAge: "",
    pregnancyCategory: "",
    renalAdjustment: false,
    hepaticAdjustment: false,
    contraindications: "",
    monitoringRequired: "",
    isActive: true,
  });

  const [interactionForm, setInteractionForm] = useState({
    drugId1: "",
    drugId2: "",
    severity: "MODERATE",
    mechanism: "",
    management: "",
    evidenceLevel: "",
    onset: "",
    isActive: true,
  });

  function resetDrugForm() {
    setDrugForm({
      genericName: "",
      genericNameAr: "",
      brandNames: "",
      strength: "",
      dosageForm: "TABLET",
      route: "ORAL",
      atcCode: "",
      category: "",
      manufacturer: "",
      productId: "",
      isControlled: false,
      schedule: "",
      maxDailyDose: "",
      maxSingleDose: "",
      minAge: "",
      maxAge: "",
      pregnancyCategory: "",
      renalAdjustment: false,
      hepaticAdjustment: false,
      contraindications: "",
      monitoringRequired: "",
      isActive: true,
    });
  }

  function resetInteractionForm() {
    setInteractionForm({
      drugId1: "",
      drugId2: "",
      severity: "MODERATE",
      mechanism: "",
      management: "",
      evidenceLevel: "",
      onset: "",
      isActive: true,
    });
  }

  async function handleDrugSubmit() {
    setBusy(true);
    try {
      const data = {
        ...drugForm,
        brandNames: drugForm.brandNames ? drugForm.brandNames.split(",").map((s) => s.trim()).filter(Boolean) : [],
        maxDailyDose: drugForm.maxDailyDose ? Number(drugForm.maxDailyDose) : null,
        maxSingleDose: drugForm.maxSingleDose ? Number(drugForm.maxSingleDose) : null,
        minAge: drugForm.minAge ? Number(drugForm.minAge) : null,
        maxAge: drugForm.maxAge ? Number(drugForm.maxAge) : null,
      };
      const res = editingDrug
        ? await updateDrugCatalogEntry(editingDrug.id, data)
        : await createDrugCatalogEntry(data);
      if (res.ok) {
        toast.success(t("saved"));
        setDrugDialogOpen(false);
        resetDrugForm();
        setEditingDrug(null);
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

  async function handleInteractionSubmit() {
    if (interactionForm.drugId1 === interactionForm.drugId2) {
      toast.error(t("sameDrugError"));
      return;
    }
    setBusy(true);
    try {
      const data = { ...interactionForm };
      const res = editingInteraction
        ? await updateDrugInteraction(editingInteraction.id, data)
        : await createDrugInteraction(data);
      if (res.ok) {
        toast.success(t("saved"));
        setInteractionDialogOpen(false);
        resetInteractionForm();
        setEditingInteraction(null);
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

  async function handleDeleteDrug(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const res = await deleteDrugCatalogEntry(id);
    if (res.ok) {
      toast.success(t("deleted"));
      router.refresh();
    } else {
      toast.error(t("actionFailed"));
    }
  }

  async function handleDeleteInteraction(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const res = await deleteDrugInteraction(id);
    if (res.ok) {
      toast.success(t("deleted"));
      router.refresh();
    } else {
      toast.error(t("actionFailed"));
    }
  }

  const filteredDrugs = drugs.filter((d) =>
    d.genericName.toLowerCase().includes(search.toLowerCase()) ||
    d.brandNames?.toLowerCase().includes(search.toLowerCase()) ||
    d.strength.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  const severityBadge: Record<string, "default" | "secondary" | "destructive" | "warning" | "info"> = {
    MAJOR: "destructive",
    MODERATE: "warning",
    MINOR: "info",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("catalog")}</h1>
          <p className="text-muted-foreground">{t("catalogDescription")}</p>
        </div>
        {canManage && (
          <Button onClick={() => { setActiveTab("catalog"); setDrugDialogOpen(true); }}>
            <Plus /> {t("addDrug")}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="catalog">{t("drugCatalog")}</TabsTrigger>
          <TabsTrigger value="interactions">{t("interactions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("genericName")}</TableHead>
                    <TableHead>{t("strength")}</TableHead>
                    <TableHead>{t("dosageForm")}</TableHead>
                    <TableHead>{t("route")}</TableHead>
                    <TableHead>{t("category")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="w-32">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrugs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {search ? t("noResults") : t("noDrugs")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrugs.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.genericName}</TableCell>
                        <TableCell>{d.strength}</TableCell>
                        <TableCell>{d.dosageForm}</TableCell>
                        <TableCell>{d.route}</TableCell>
                        <TableCell>{d.category ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={d.isActive ? "success" : "secondary"}>
                            {d.isActive ? t("active") : t("inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {canManage && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingDrug(d); setDrugForm({
                                genericName: d.genericName,
                                genericNameAr: d.genericNameAr ?? "",
                                brandNames: d.brandNames ?? "",
                                strength: d.strength,
                                dosageForm: d.dosageForm,
                                route: d.route,
                                atcCode: d.atcCode ?? "",
                                category: d.category ?? "",
                                manufacturer: d.manufacturer ?? "",
                                productId: d.productId ?? "",
                                isControlled: d.isControlled,
                                schedule: d.schedule ?? "",
                                maxDailyDose: d.maxDailyDose?.toString() ?? "",
                                maxSingleDose: d.maxSingleDose?.toString() ?? "",
                                minAge: d.minAge?.toString() ?? "",
                                maxAge: d.maxAge?.toString() ?? "",
                                pregnancyCategory: d.pregnancyCategory ?? "",
                                renalAdjustment: d.renalAdjustment,
                                hepaticAdjustment: d.hepaticAdjustment,
                                contraindications: d.contraindications ?? "",
                                monitoringRequired: d.monitoringRequired ?? "",
                                isActive: d.isActive,
                              }); setDrugDialogOpen(true); }}>
                                <Pen className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteDrug(d.id)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">{t("interactions")}</h2>
            {canManage && (
              <Button onClick={() => { setActiveTab("interactions"); setInteractionDialogOpen(true); }}>
                <Plus /> {t("addInteraction")}
              </Button>
            )}
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("drug1")}</TableHead>
                    <TableHead>{t("drug2")}</TableHead>
                    <TableHead>{t("severity")}</TableHead>
                    <TableHead>{t("management")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="w-32">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">{t("noInteractions")}</TableCell>
                    </TableRow>
                  ) : (
                    interactions.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.drug1.genericName} {i.drug1.strength} {i.drug1.dosageForm}</TableCell>
                        <TableCell>{i.drug2.genericName} {i.drug2.strength} {i.drug2.dosageForm}</TableCell>
                        <TableCell>
                          <Badge variant={severityBadge[i.severity] ?? "secondary"}>
                            {t(`interactionSeverity_${i.severity}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{i.management ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={i.isActive ? "success" : "secondary"}>
                            {i.isActive ? t("active") : t("inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {canManage && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => {
                                setEditingInteraction(i);
                                setInteractionForm({
                                  drugId1: i.drug1.id,
                                  drugId2: i.drug2.id,
                                  severity: i.severity,
                                  mechanism: i.mechanism ?? "",
                                  management: i.management ?? "",
                                  evidenceLevel: i.evidenceLevel ?? "",
                                  onset: i.onset ?? "",
                                  isActive: i.isActive,
                                });
                                setInteractionDialogOpen(true);
                              }}>
                                <Pen className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteInteraction(i.id)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Drug Dialog */}
      <Dialog open={drugDialogOpen} onOpenChange={setDrugDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDrug ? t("editDrug") : t("addDrug")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleDrugSubmit(); }} className="flex flex-col gap-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-2">
                <Label>{t("genericName")} *</Label>
                <Input value={drugForm.genericName} onChange={(e) => setDrugForm((f) => ({ ...f, genericName: e.target.value }))} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("genericNameAr")}</Label>
                <Input value={drugForm.genericNameAr} onChange={(e) => setDrugForm((f) => ({ ...f, genericNameAr: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("strength")} *</Label>
                <Input value={drugForm.strength} onChange={(e) => setDrugForm((f) => ({ ...f, strength: e.target.value }))} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("dosageForm")} *</Label>
                <Select value={drugForm.dosageForm} onValueChange={(v) => setDrugForm((f) => ({ ...f, dosageForm: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOSAGE_FORMS.map((f) => <SelectItem key={f} value={f}>{t(`dosageForm_${f}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("route")} *</Label>
                <Select value={drugForm.route} onValueChange={(v) => setDrugForm((f) => ({ ...f, route: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROUTES.map((r) => <SelectItem key={r} value={r}>{t(`route_${r}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("brandNames")}</Label>
                <Input value={drugForm.brandNames} onChange={(e) => setDrugForm((f) => ({ ...f, brandNames: e.target.value }))} placeholder={t("commaSeparated")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("category")}</Label>
                <Input value={drugForm.category} onChange={(e) => setDrugForm((f) => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("atcCode")}</Label>
                <Input value={drugForm.atcCode} onChange={(e) => setDrugForm((f) => ({ ...f, atcCode: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("manufacturer")}</Label>
                <Input value={drugForm.manufacturer} onChange={(e) => setDrugForm((f) => ({ ...f, manufacturer: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("productId")}</Label>
                <Input value={drugForm.productId} onChange={(e) => setDrugForm((f) => ({ ...f, productId: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("maxDailyDose")}</Label>
                <Input type="number" step="0.1" value={drugForm.maxDailyDose} onChange={(e) => setDrugForm((f) => ({ ...f, maxDailyDose: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("maxSingleDose")}</Label>
                <Input type="number" step="0.1" value={drugForm.maxSingleDose} onChange={(e) => setDrugForm((f) => ({ ...f, maxSingleDose: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("minAge")}</Label>
                <Input type="number" min="0" value={drugForm.minAge} onChange={(e) => setDrugForm((f) => ({ ...f, minAge: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("maxAge")}</Label>
                <Input type="number" min="0" value={drugForm.maxAge} onChange={(e) => setDrugForm((f) => ({ ...f, maxAge: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("pregnancyCategory")}</Label>
                <Select value={drugForm.pregnancyCategory} onValueChange={(v) => setDrugForm((f) => ({ ...f, pregnancyCategory: v }))}>
                  <SelectTrigger><SelectValue placeholder={tc("select")} /></SelectTrigger>
                  <SelectContent>
                    {PREGNANCY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("contraindications")}</Label>
                <Textarea rows={2} value={drugForm.contraindications} onChange={(e) => setDrugForm((f) => ({ ...f, contraindications: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("monitoringRequired")}</Label>
                <Textarea rows={2} value={drugForm.monitoringRequired} onChange={(e) => setDrugForm((f) => ({ ...f, monitoringRequired: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={drugForm.isControlled} onCheckedChange={(v) => setDrugForm((f) => ({ ...f, isControlled: v }))} />
                  {t("isControlled")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={drugForm.renalAdjustment} onCheckedChange={(v) => setDrugForm((f) => ({ ...f, renalAdjustment: v }))} />
                  {t("renalAdjustment")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={drugForm.hepaticAdjustment} onCheckedChange={(v) => setDrugForm((f) => ({ ...f, hepaticAdjustment: v }))} />
                  {t("hepaticAdjustment")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={drugForm.isActive} onCheckedChange={(v) => setDrugForm((f) => ({ ...f, isActive: v }))} />
                  {t("isActive")}
                </label>
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("schedule")}</Label>
                <Input value={drugForm.schedule} onChange={(e) => setDrugForm((f) => ({ ...f, schedule: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("maxSingleDose")}</Label>
                <Input type="number" step="0.1" value={drugForm.maxSingleDose} onChange={(e) => setDrugForm((f) => ({ ...f, maxSingleDose: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("minAge")}</Label>
                <Input type="number" min="0" value={drugForm.minAge} onChange={(e) => setDrugForm((f) => ({ ...f, minAge: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("maxAge")}</Label>
                <Input type="number" min="0" value={drugForm.maxAge} onChange={(e) => setDrugForm((f) => ({ ...f, maxAge: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("pregnancyCategory")}</Label>
                <Select value={drugForm.pregnancyCategory} onValueChange={(v) => setDrugForm((f) => ({ ...f, pregnancyCategory: v }))}>
                  <SelectTrigger><SelectValue placeholder={tc("select")} /></SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D", "X", "N"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDrugDialogOpen(false); resetDrugForm(); setEditingDrug(null); }}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? tc("saving") : tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Interaction Dialog */}
      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingInteraction ? t("editInteraction") : t("addInteraction")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleInteractionSubmit(); }} className="flex flex-col gap-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("drug1")} *</Label>
                <Select value={interactionForm.drugId1} onValueChange={(v) => setInteractionForm((f) => ({ ...f, drugId1: v }))} required>
                  <SelectTrigger><SelectValue placeholder={t("selectDrug")} /></SelectTrigger>
                  <SelectContent>
                    {drugs.map((d) => <SelectItem key={d.id} value={d.id}>{d.genericName} {d.strength} {d.dosageForm}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("drug2")} *</Label>
                <Select value={interactionForm.drugId2} onValueChange={(v) => setInteractionForm((f) => ({ ...f, drugId2: v }))} required>
                  <SelectTrigger><SelectValue placeholder={t("selectDrug")} /></SelectTrigger>
                  <SelectContent>
                    {drugs.map((d) => <SelectItem key={d.id} value={d.id}>{d.genericName} {d.strength} {d.dosageForm}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("severity")} *</Label>
                <Select value={interactionForm.severity} onValueChange={(v) => setInteractionForm((f) => ({ ...f, severity: v }))} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["MAJOR", "MODERATE", "MINOR"].map((s) => <SelectItem key={s} value={s}>{t(`interactionSeverity_${s}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("onset")}</Label>
                <Input value={interactionForm.onset} onChange={(e) => setInteractionForm((f) => ({ ...f, onset: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("mechanism")}</Label>
                <Textarea rows={2} value={interactionForm.mechanism} onChange={(e) => setInteractionForm((f) => ({ ...f, mechanism: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("management")}</Label>
                <Textarea rows={2} value={interactionForm.management} onChange={(e) => setInteractionForm((f) => ({ ...f, management: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>{t("evidenceLevel")}</Label>
                <Input value={interactionForm.evidenceLevel} onChange={(e) => setInteractionForm((f) => ({ ...f, evidenceLevel: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={interactionForm.isActive} onCheckedChange={(v) => setInteractionForm((f) => ({ ...f, isActive: v }))} />
                  {t("isActive")}
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setInteractionDialogOpen(false); resetInteractionForm(); setEditingInteraction(null); }}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? tc("saving") : tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const router = { refresh: () => window.location.reload() };