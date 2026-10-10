"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createAllergy,
  deleteAllergy,
  updateAllergy,
} from "@/app/[locale]/(app)/patients/[id]/profile-actions";
import {
  allergySchema,
  type AllergyFormValues,
} from "@/app/[locale]/(app)/patients/[id]/profile-schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export type AllergyRow = {
  id: string;
  allergen: string;
  reaction: string | null;
  severity: "MILD" | "MODERATE" | "SEVERE";
  notes: string | null;
};

const SEVERITIES = ["MILD", "MODERATE", "SEVERE"] as const;

const SEVERITY_VARIANT: Record<AllergyRow["severity"], "secondary" | "warning" | "destructive"> = {
  MILD: "secondary",
  MODERATE: "warning",
  SEVERE: "destructive",
};

export function AllergiesTab({
  patientId,
  rows,
  canWrite,
}: {
  patientId: string;
  rows: AllergyRow[];
  canWrite: boolean;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AllergyRow | null>(null);
  const [deleting, setDeleting] = useState<AllergyRow | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<AllergyFormValues>({
    resolver: zodResolver(allergySchema),
    defaultValues: { allergen: "", reaction: "", severity: "MILD", notes: "" },
  });

  function openCreate() {
    setEditing(null);
    reset({ allergen: "", reaction: "", severity: "MILD", notes: "" });
    setOpen(true);
  }

  function openEdit(row: AllergyRow) {
    setEditing(row);
    reset({
      allergen: row.allergen,
      reaction: row.reaction ?? "",
      severity: row.severity,
      notes: row.notes ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(values: AllergyFormValues) {
    const res = editing
      ? await updateAllergy(patientId, editing.id, values)
      : await createAllergy(patientId, values);
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
    const res = await deleteAllergy(patientId, deleting.id);
    if (res.ok) {
      toast.success(t("deleteSuccess"));
      router.refresh();
    } else {
      toast.error(t("saveFailed"));
    }
    setDeleting(null);
  }

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
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("allergen")}</TableHead>
              <TableHead>{t("reaction")}</TableHead>
              <TableHead>{t("severity")}</TableHead>
              {canWrite && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canWrite ? 4 : 3}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.allergen}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.reaction ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={SEVERITY_VARIANT[row.severity]}>
                    {t(`severity_${row.severity}`)}
                  </Badge>
                </TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("newAllergy")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="al-allergen">{t("allergen")} *</Label>
              <Input id="al-allergen" {...register("allergen")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="al-reaction">{t("reaction")}</Label>
              <Input id="al-reaction" {...register("reaction")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("severity")}</Label>
              <Select
                value={watch("severity")}
                onValueChange={(v) =>
                  setValue("severity", v as AllergyFormValues["severity"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`severity_${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="al-notes">{t("notes")}</Label>
              <Textarea id="al-notes" rows={3} {...register("notes")} />
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
