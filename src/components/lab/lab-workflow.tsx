"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BellRing, Play, TestTube2, XCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  collectSpecimen,
  notifyCritical,
  rejectSpecimen,
  startProcessing,
  cancelRequest,
} from "@/app/[locale]/(app)/lab/actions";
import { LAB_REJECTION_REASONS, LAB_SPECIMEN_TYPES } from "@/app/[locale]/(app)/lab/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function LabWorkflow({
  requestId,
  status,
  specimenType,
  canResult,
  canVerify,
  criticalFlag,
  criticalNotified,
}: {
  requestId: string;
  status: string;
  specimenType: string | null;
  canResult: boolean;
  canVerify: boolean;
  criticalFlag: boolean;
  criticalNotified: boolean;
}) {
  const t = useTranslations("lab");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [spec, setSpec] = useState(specimenType ?? "BLOOD");
  const [barcode, setBarcode] = useState("");
  const [reason, setReason] = useState<string>("HEMOLYZED");
  const [notes, setNotes] = useState("");

  async function run(fn: () => Promise<{ ok: boolean }>, ok: string) {
    setBusy(true);
    try {
      const res = await fn();
      if (res.ok) {
        toast.success(t(ok));
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

  const showCollect = canResult && (status === "PENDING" || status === "REJECTED");
  const showStart = canResult && status === "SAMPLED";
  const showReject = canResult && ["PENDING", "SAMPLED", "IN_PROGRESS", "RESULTED"].includes(status);
  const showCancel = canVerify && status !== "VERIFIED" && status !== "CANCELLED";
  const showCritical = canResult && criticalFlag && !criticalNotified;

  if (!showCollect && !showStart && !showReject && !showCancel && !showCritical) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t("workflow")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showCollect && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
            <div className="flex flex-col gap-1">
              <Label>{t("specimenType")}</Label>
              <Select value={spec} onValueChange={setSpec}>
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAB_SPECIMEN_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`specimen_${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t("specimenId")}</Label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="LAB-…" />
            </div>
            <Button
              disabled={busy}
              onClick={() =>
                run(
                  () => collectSpecimen(requestId, { specimenType: spec, specimenId: barcode }),
                  "sampleCollected",
                )
              }
            >
              <TestTube2 />
              {t("collectSample")}
            </Button>
          </div>
        )}

        {showStart && (
          <div>
            <Button
              disabled={busy}
              onClick={() => run(() => startProcessing(requestId), "processing")}
            >
              <Play />
              {t("startProcessing")}
            </Button>
          </div>
        )}

        {showCritical && (
          <div className="flex flex-col gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
            <span className="flex items-center gap-2 text-sm font-medium text-red-700">
              <BellRing className="size-4" />
              {t("criticalResult")}
            </span>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("criticalNotes")}
              rows={2}
            />
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => run(() => notifyCritical(requestId, notes), "criticalNotified")}
            >
              <BellRing />
              {t("notifyClinician")}
            </Button>
          </div>
        )}

        {showReject && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
            <div className="flex flex-col gap-1">
              <Label>{t("rejectionReason")}</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger size="sm" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAB_REJECTION_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`reject_${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => run(() => rejectSpecimen(requestId, { reason, notes }), "sampleRejected")}
            >
              <XCircle />
              {t("rejectSample")}
            </Button>
          </div>
        )}

        {showCancel && (
          <div>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => run(() => cancelRequest(requestId), "requestCancelled")}
            >
              <XCircle />
              {t("cancelRequest")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
