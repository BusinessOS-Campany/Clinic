"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createVitalSign,
  deleteVitalSign,
  updateVitalSign,
} from "@/app/[locale]/(app)/patients/[id]/profile-actions";
import {
  vitalSignSchema,
  type VitalSignFormValues,
} from "@/app/[locale]/(app)/patients/[id]/profile-schema";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type VitalSignRow = {
  id: string;
  measuredAt: string;
  temperature: string | null;
  pulse: number | null;
  respRate: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  spO2: number | null;
  height: string | null;
  weight: string | null;
  bmi: string | null;
  notes: string | null;
};

function toDateTimeInput(iso: string): string {
  return iso.slice(0, 16);
}

const NUMBER_KEYS = [
  "temperature",
  "pulse",
  "respRate",
  "bpSystolic",
  "bpDiastolic",
  "spO2",
  "height",
  "weight",
  "bmi",
] as const;

export function VitalSignsTab({
  patientId,
  rows,
  canWrite,
  locale,
}: {
  patientId: string;
  rows: VitalSignRow[];
  canWrite: boolean;
  locale: string;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VitalSignRow | null>(null);
  const [deleting, setDeleting] = useState<VitalSignRow | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<VitalSignFormValues>({
    resolver: zodResolver(vitalSignSchema),
    defaultValues: {
      measuredAt: "",
      temperature: "",
      pulse: "",
      respRate: "",
      bpSystolic: "",
      bpDiastolic: "",
      spO2: "",
      height: "",
      weight: "",
      bmi: "",
      notes: "",
    },
  });

  function openCreate() {
    setEditing(null);
    reset({
      measuredAt: "",
      temperature: "",
      pulse: "",
      respRate: "",
      bpSystolic: "",
      bpDiastolic: "",
      spO2: "",
      height: "",
      weight: "",
      bmi: "",
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(row: VitalSignRow) {
    setEditing(row);
    reset({
      measuredAt: toDateTimeInput(row.measuredAt),
      temperature: row.temperature ?? "",
      pulse: row.pulse != null ? String(row.pulse) : "",
      respRate: row.respRate != null ? String(row.respRate) : "",
      bpSystolic: row.bpSystolic != null ? String(row.bpSystolic) : "",
      bpDiastolic: row.bpDiastolic != null ? String(row.bpDiastolic) : "",
      spO2: row.spO2 != null ? String(row.spO2) : "",
      height: row.height ?? "",
      weight: row.weight ?? "",
      bmi: row.bmi ?? "",
      notes: row.notes ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(values: VitalSignFormValues) {
    const res = editing
      ? await updateVitalSign(patientId, editing.id, values)
      : await createVitalSign(patientId, values);
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
    const res = await deleteVitalSign(patientId, deleting.id);
    if (res.ok) {
      toast.success(t("deleteSuccess"));
      router.refresh();
    } else {
      toast.error(t("saveFailed"));
    }
    setDeleting(null);
  }

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));

  return (
    <div className="flex flex-col gap-3">
      {canWrite && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus />
            {t("add")}
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("measuredAt")}</TableHead>
              <TableHead>{t("temperature")}</TableHead>
              <TableHead>{t("pulse")}</TableHead>
              <TableHead>{t("bpSystolic")}</TableHead>
              <TableHead>{t("bpDiastolic")}</TableHead>
              <TableHead>{t("spO2")}</TableHead>
              <TableHead>{t("weight")}</TableHead>
              <TableHead>{t("bmi")}</TableHead>
              {canWrite && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canWrite ? 9 : 8}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {fmt(row.measuredAt)}
                </TableCell>
                <TableCell>{row.temperature ?? "—"}</TableCell>
                <TableCell>{row.pulse ?? "—"}</TableCell>
                <TableCell>{row.bpSystolic ?? "—"}</TableCell>
                <TableCell>{row.bpDiastolic ?? "—"}</TableCell>
                <TableCell>{row.spO2 ?? "—"}</TableCell>
                <TableCell>{row.weight ?? "—"}</TableCell>
                <TableCell>{row.bmi ?? "—"}</TableCell>
                {canWrite && (
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleting(row)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit") : t("newVitalSign")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vs-measured">{t("measuredAt")}</Label>
              <Input
                id="vs-measured"
                type="datetime-local"
                {...register("measuredAt")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {NUMBER_KEYS.map((key) => (
                <div key={key} className="flex flex-col gap-2">
                  <Label htmlFor={`vs-${key}`}>{t(key)}</Label>
                  <Input
                    id={`vs-${key}`}
                    dir="ltr"
                    inputMode="decimal"
                    {...register(key)}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vs-notes">{t("notes")}</Label>
              <Textarea id="vs-notes" rows={3} {...register("notes")} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
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
    </div>
  );
}
