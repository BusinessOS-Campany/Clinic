"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Wrench } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { addEquipment, addMaintenance } from "@/app/[locale]/(app)/lab/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Maintenance = {
  id: string;
  type: string | null;
  performedAt: string;
  performedBy: string | null;
  cost: number | null;
  notes: string | null;
};
type Equipment = {
  id: string;
  name: string;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  location: string | null;
  lastServiceAt: string | null;
  nextServiceDue: string | null;
  maintenance: Maintenance[];
};

export function LabEquipmentManager({
  equipment,
  canEdit,
}: {
  equipment: Equipment[];
  canEdit: boolean;
}) {
  const t = useTranslations("lab");
  const router = useRouter();
  const [eqOpen, setEqOpen] = useState(false);
  const [maintEq, setMaintEq] = useState<Equipment | null>(null);
  const [busy, setBusy] = useState(false);
  const [eq, setEq] = useState({ name: "", serialNumber: "", manufacturer: "", model: "", location: "", nextServiceDue: "" });
  const [maint, setMaint] = useState({ type: "", performedBy: "", cost: "", notes: "" });

  async function saveEq(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await addEquipment(eq);
      if (res.ok) {
        toast.success(t("equipmentAdded"));
        setEq({ name: "", serialNumber: "", manufacturer: "", model: "", location: "", nextServiceDue: "" });
        setEqOpen(false);
        router.refresh();
      } else toast.error(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function saveMaint(e: React.FormEvent) {
    e.preventDefault();
    if (!maintEq) return;
    setBusy(true);
    try {
      const res = await addMaintenance({ equipmentId: maintEq.id, ...maint });
      if (res.ok) {
        toast.success(t("maintenanceAdded"));
        setMaint({ type: "", performedBy: "", cost: "", notes: "" });
        setMaintEq(null);
        router.refresh();
      } else toast.error(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <div>
          <Button onClick={() => setEqOpen(true)}>
            <Plus />
            {t("addEquipment")}
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {equipment.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">—</CardContent>
          </Card>
        )}
        {equipment.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {[item.manufacturer, item.model, item.serialNumber].filter(Boolean).join(" · ") || "—"}
                  </div>
                  {item.location && <div className="text-xs text-muted-foreground">{item.location}</div>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {item.lastServiceAt && <span>{t("lastService")}: {item.lastServiceAt.slice(0, 10)}</span>}
                  {item.nextServiceDue && <span>{t("nextService")}: {item.nextServiceDue.slice(0, 10)}</span>}
                  {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => setMaintEq(item)}>
                      <Wrench />
                      {t("logMaintenance")}
                    </Button>
                  )}
                </div>
              </div>
              {item.maintenance.length > 0 && (
                <div className="rounded-md bg-muted/50 p-2 text-xs">
                  {item.maintenance.map((m) => (
                    <div key={m.id} className="text-muted-foreground">
                      {m.performedAt.slice(0, 10)} · {item.name} · {m.type ?? "—"}
                      {m.performedBy ? ` · ${m.performedBy}` : ""}
                      {item && item.maintenance.length ? "" : ""}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={eqOpen} onOpenChange={setEqOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addEquipment")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEq} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Label>{t("equipmentName")}</Label>
              <Input value={eq.name} onChange={(e) => setEq((s) => ({ ...s, name: e.target.value }))} required />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("serialNumber")}</Label>
              <Input value={eq.serialNumber} onChange={(e) => setEq((s) => ({ ...s, serialNumber: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("manufacturer")}</Label>
              <Input value={eq.manufacturer} onChange={(e) => setEq((s) => ({ ...s, manufacturer: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("model")}</Label>
              <Input value={eq.model} onChange={(e) => setEq((s) => ({ ...s, model: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("location")}</Label>
              <Input value={eq.location} onChange={(e) => setEq((s) => ({ ...s, location: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Label>{t("nextService")}</Label>
              <Input type="date" value={eq.nextServiceDue} onChange={(e) => setEq((s) => ({ ...s, nextServiceDue: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setEqOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {t("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(maintEq)} onOpenChange={(o) => !o && setMaintEq(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("logMaintenance")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveMaint} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label>{t("maintenanceType")}</Label>
              <Input value={maint.type} onChange={(e) => setMaint((s) => ({ ...s, type: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("performedBy")}</Label>
              <Input value={maint.performedBy} onChange={(e) => setMaint((s) => ({ ...s, performedBy: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("cost")}</Label>
              <Input type="number" min="0" step="0.01" value={maint.cost} onChange={(e) => setMaint((s) => ({ ...s, cost: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("notes")}</Label>
              <Input value={maint.notes} onChange={(e) => setMaint((s) => ({ ...s, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMaintEq(null)}>
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
