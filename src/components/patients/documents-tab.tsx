"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createDocument,
  deleteDocument,
  updateDocument,
} from "@/app/[locale]/(app)/patients/[id]/profile-actions";
import {
  DOCUMENT_CATEGORIES,
  documentSchema,
  type DocumentFormValues,
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

export type DocumentRow = {
  id: string;
  title: string;
  category: (typeof DOCUMENT_CATEGORIES)[number];
  fileName: string | null;
  url: string | null;
  notes: string | null;
};

type DocumentCategory = DocumentRow["category"];

export function DocumentsTab({
  patientId,
  rows,
  canWrite,
}: {
  patientId: string;
  rows: DocumentRow[];
  canWrite: boolean;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentRow | null>(null);
  const [deleting, setDeleting] = useState<DocumentRow | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: "",
      category: "OTHER",
      fileName: "",
      url: "",
      notes: "",
    },
  });

  function openCreate() {
    setEditing(null);
    reset({ title: "", category: "OTHER", fileName: "", url: "", notes: "" });
    setOpen(true);
  }

  function openEdit(row: DocumentRow) {
    setEditing(row);
    reset({
      title: row.title,
      category: row.category,
      fileName: row.fileName ?? "",
      url: row.url ?? "",
      notes: row.notes ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(values: DocumentFormValues) {
    const res = editing
      ? await updateDocument(patientId, editing.id, values)
      : await createDocument(patientId, values);
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
    const res = await deleteDocument(patientId, deleting.id);
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
              <TableHead>{t("notes")}</TableHead>
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
                <TableCell className="font-medium">
                  {row.url ? (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {row.title}
                    </a>
                  ) : (
                    row.title
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.category}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.notes ?? "—"}
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
              {editing ? t("edit") : t("newDocument")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-title">{t("title")} *</Label>
              <Input id="doc-title" {...register("title")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("category")}</Label>
              <Select
                value={watch("category")}
                onValueChange={(v) =>
                  setValue("category", v as DocumentCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="doc-file">{t("fileName")}</Label>
                <Input id="doc-file" {...register("fileName")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="doc-url">{t("url")}</Label>
                <Input id="doc-url" dir="ltr" {...register("url")} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-notes">{t("notes")}</Label>
              <Textarea id="doc-notes" rows={3} {...register("notes")} />
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
