"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createReferral,
  deleteReferral,
  updateReferral,
} from "@/app/[locale]/(app)/patients/[id]/profile-actions";
import {
  REFERRAL_STATUSES,
  referralSchema,
  type ReferralFormValues,
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

export type ReferralRow = {
  id: string;
  referredTo: string;
  reason: string | null;
  status: (typeof REFERRAL_STATUSES)[number];
  notes: string | null;
};

type ReferralStatus = ReferralRow["status"];

export function ReferralsTab({
  patientId,
  rows,
  canWrite,
}: {
  patientId: string;
  rows: ReferralRow[];
  canWrite: boolean;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReferralRow | null>(null);
  const [deleting, setDeleting] = useState<ReferralRow | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<ReferralFormValues>({
    resolver: zodResolver(referralSchema),
    defaultValues: { referredTo: "", reason: "", status: "PENDING", notes: "" },
  });

  function openCreate() {
    setEditing(null);
    reset({ referredTo: "", reason: "", status: "PENDING", notes: "" });
    setOpen(true);
  }

  function openEdit(row: ReferralRow) {
    setEditing(row);
    reset({
      referredTo: row.referredTo,
      reason: row.reason ?? "",
      status: row.status,
      notes: row.notes ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(values: ReferralFormValues) {
    const res = editing
      ? await updateReferral(patientId, editing.id, values)
      : await createReferral(patientId, values);
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
    const res = await deleteReferral(patientId, deleting.id);
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
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("referredTo")}</TableHead>
              <TableHead>{t("reason")}</TableHead>
              <TableHead>{t("status")}</TableHead>
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
                <TableCell className="font-medium">{row.referredTo}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.reason ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.status}</Badge>
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
            <DialogTitle>
              {editing ? t("edit") : t("newReferral")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ref-to">{t("referredTo")} *</Label>
              <Input id="ref-to" {...register("referredTo")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("status")}</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as ReferralStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFERRAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ref-reason">{t("reason")}</Label>
              <Textarea id="ref-reason" rows={3} {...register("reason")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ref-notes">{t("notes")}</Label>
              <Textarea id="ref-notes" rows={3} {...register("notes")} />
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
