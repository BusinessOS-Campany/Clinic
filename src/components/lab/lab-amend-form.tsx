"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { amendResult } from "@/app/[locale]/(app)/lab/actions";
import { LAB_RESULT_FLAGS } from "@/app/[locale]/(app)/lab/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

export function LabAmendForm({
  resultId,
  currentValue,
  currentFlag,
}: {
  resultId: string;
  currentValue: string | null;
  currentFlag: string | null;
}) {
  const t = useTranslations("lab");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentValue ?? "");
  const [flag, setFlag] = useState(currentFlag ?? "__none");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await amendResult({
        resultId,
        value,
        flag: flag === "__none" ? undefined : (flag as (typeof LAB_RESULT_FLAGS)[number]),
        reason,
      });
      if (res.ok) {
        toast.success(t("amended"));
        setOpen(false);
        setReason("");
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
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Pencil />
        {t("amend")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("amendResult")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label>{t("resultValue")}</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("flag")}</Label>
              <Select value={flag} onValueChange={setFlag}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">{t("noFlag")}</SelectItem>
                  {LAB_RESULT_FLAGS.map((fl) => (
                    <SelectItem key={fl} value={fl}>
                      {t(`flag_${fl}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("amendReason")}</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
