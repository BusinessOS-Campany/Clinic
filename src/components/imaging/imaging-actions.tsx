"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, Check, FileText } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cancelRequest, markPerformed, submitReport } from "@/app/[locale]/(app)/imaging/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ImagingActions({
  requestId,
  status,
  canWrite,
  canReport,
}: {
  requestId: string;
  status: string;
  canWrite: boolean;
  canReport: boolean;
}) {
  const t = useTranslations("imaging");
  const router = useRouter();
  const [findings, setFindings] = useState("");
  const [busy, setBusy] = useState(false);

  async function perform() {
    setBusy(true);
    const res = await markPerformed(requestId);
    if (res.ok) router.refresh();
    else toast.error(t("reported"));
    setBusy(false);
  }

  async function report() {
    if (!findings.trim()) return;
    setBusy(true);
    const res = await submitReport(requestId, { findings });
    if (res.ok) {
      toast.success(t("reported"));
      router.refresh();
    } else {
      toast.error(t("reported"));
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t("markPerformed")} / {t("markReported")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {status === "PENDING" && canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={perform} disabled={busy}>
              <Check />
              {t("markPerformed")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                await cancelRequest(requestId);
                router.refresh();
              }}
            >
              <Ban />
              {t("status_CANCELLED")}
            </Button>
          </div>
        )}
        {status === "PERFORMED" && canReport && (
          <div className="flex flex-col gap-2">
            <Label>{t("findings")}</Label>
            <Textarea rows={4} value={findings} onChange={(e) => setFindings(e.target.value)} />
            <div className="flex justify-end">
              <Button size="sm" onClick={report} disabled={busy || !findings.trim()}>
                <FileText />
                {t("markReported")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}