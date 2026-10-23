"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, UploadCloud } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_MB = 25;

export function UploadDocumentDialog({ patientId }: { patientId: string }) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("OTHER");
  const [notes, setNotes] = useState("");

  function pick(next: File | undefined) {
    if (!next) return;
    if (next.size > MAX_MB * 1024 * 1024) {
      toast.error(t("fileTooLarge"));
      return;
    }
    setFile(next);
  }

  function sizeText(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFile(null);
      setNotes("");
    }
    setOpen(next);
  }

  async function submit() {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("patientId", patientId);
      form.append("category", category);
      form.append("notes", notes);
      form.append("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const data: unknown = await res.json().catch(() => null);
      if (res.ok && data && typeof data === "object" && "ok" in data) {
        toast.success(t("documentUploaded"));
        handleOpenChange(false);
        router.refresh();
      } else {
        toast.error(t("actionFailed"));
      }
    } catch {
      toast.error(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          {t("uploadDocument")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("uploadDocument")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("chooseFile")}</Label>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(event) => pick(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-sm",
                "text-muted-foreground hover:border-primary hover:text-foreground",
                file && "border-primary",
              )}
            >
              <UploadCloud className="size-8" aria-hidden />
              {file ? (
                <span className="font-medium text-foreground">
                  {file.name} · {sizeText(file.size)}
                </span>
              ) : (
                <span>{t("noFileChosen")}</span>
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              {t("fileTypeHint")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "IDENTITY",
                    "MEDICAL_REPORT",
                    "IMAGING",
                    "LABORATORY",
                    "CONSENT",
                    "INVOICE",
                    "OTHER",
                  ] as const
                ).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`documentCategory_${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="upload-notes">{t("notes")}</Label>
            <Textarea
              id="upload-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
          >
            {tc("cancel")}
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={busy || !file}>
            {busy ? tc("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}