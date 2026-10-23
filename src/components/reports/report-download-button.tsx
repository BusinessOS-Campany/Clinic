"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ReportPeriod } from "@/lib/reports/report-data";

export function ReportDownloadButton({ period }: { period: ReportPeriod }) {
  const t = useTranslations("reports");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${period}/pdf?locale=${locale}`);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${period}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownload}
      disabled={loading}
      className="print:hidden"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {loading ? t("generating") : t("downloadPdf")}
    </Button>
  );
}
