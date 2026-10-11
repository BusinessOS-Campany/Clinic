"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckSquare } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { closeEncounter } from "@/app/[locale]/(app)/encounters/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CHECKLIST = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export function VisitClosure({
  encounterId,
  readOnly,
  hasPendingOrders,
}: {
  encounterId: string;
  readOnly: boolean;
  hasPendingOrders: boolean;
}) {
  const t = useTranslations("encounters");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allDone =
    CHECKLIST.length > 0 && CHECKLIST.every((c) => checked[c]);

  async function confirm() {
    if (!allDone) {
      toast.warning(t("closeIncomplete"));
      return;
    }
    setBusy(true);
    const res = await closeEncounter(encounterId);
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      toast.success(t(res.awaiting ? "awaitingResults" : "visitCompleted"));
      router.refresh();
    } else {
      toast.error(tc("failed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={readOnly ? "outline" : "default"} disabled={readOnly}>
          <CheckSquare />
          {t("closeTitle")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("closeTitle")}</DialogTitle>
          <DialogDescription>{t("closeChecklist")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {CHECKLIST.map((c) => (
            <label
              key={c}
              className="flex items-center gap-2 rounded-lg border p-2 text-sm"
            >
              <Checkbox
                checked={Boolean(checked[c])}
                onCheckedChange={(on) => setChecked({ ...checked, [c]: Boolean(on) })}
              />
              {t(`closeCheck${c}`)}
            </label>
          ))}
          {hasPendingOrders ? (
            <p className="text-xs text-muted-foreground">{t("closeHasOrders")}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("closeNoOrders")}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={confirm} disabled={busy}>
            {t("closeConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}