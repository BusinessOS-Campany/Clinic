"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createConsentForm,
  deleteConsentForm,
  updateConsentForm,
} from "@/app/[locale]/(app)/patients/[id]/profile-actions";
import {
  CONSENT_STATUSES,
  consentFormSchema,
  type ConsentFormValues,
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

export type ConsentFormRow = {
  id: string;
  title: string;
  category: string | null;
  status: (typeof CONSENT_STATUSES)[number];
  signedBy: string | null;
  content: string | null;
  notes: string | null;
};

type ConsentStatus = ConsentFormRow["status"];

export function ConsentFormsTab({
  patientId,
  rows,
  canWrite,
}: {
  patientId: string;
  rows: ConsentFormRow[];
  canWrite: boolean;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ConsentFormRow | null>(null);
  const [deleting, setDeleting] = useState<ConsentFormRow | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<ConsentFormValues>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: {
      title: "",
      category: "",
      status: "PENDING",
      signedBy: "",
      content: "",
      notes: "",
    },
  });

  function openCreate() {
    setEditing(null);
    reset({
      title: "",
      category: "",
      status: "PENDING",
      signedBy: "",
      content: "",
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(row: ConsentFormRow) {
    setEditing(row);
    reset({
      title: row.title,
      category: row.category ?? "",
      status: row.status,
      signedBy: row.signedBy ?? "",
      content: row.content ?? "",
      notes: row.notes ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(values: ConsentFormValues) {
    const res = editing
      ? await updateConsentForm(patientId, editing.id, values)
      : await createConsentForm(patientId, values);
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
    const res = await deleteConsentForm(patientId, deleting.id);
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
              <TableHead>{t("title")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("signedBy")}</TableHead>
              {canWrite && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canWrite ? 5 : 4}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.category ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={row.status === "SIGNED" ? "success" : "secondary"}
                  >
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.signedBy ?? "—"}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit") : t("newConsentForm")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cf-title">{t("title")} *</Label>
                <Input id="cf-title" {...register("title")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cf-category">{t("category")}</Label>
                <Input id="cf-category" {...register("category")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("status")}</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as ConsentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cf-signedBy">{t("signedBy")}</Label>
                <Input id="cf-signedBy" {...register("signedBy")} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-content">{t("content")}</Label>
              <Textarea id="cf-content" rows={5} {...register("content")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cf-notes">{t("notes")}</Label>
              <Textarea id="cf-notes" rows={3} {...register("notes")} />
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
