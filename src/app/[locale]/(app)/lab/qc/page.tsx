import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { fmtDate, fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LabQcForm } from "@/components/lab/lab-qc-form";

export default async function LabQcPage() {
  const user = await requirePermission("laboratory:read");
  const t = await getTranslations("lab");
  const clinicId = user.currentClinicId ?? "";
  const canEdit = await can(user, "laboratory:result");

  const records = await prisma.labQcRecord.findMany({
    where: { clinicId },
    orderBy: { recordedAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("qc")}
        icon={ShieldCheck}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/lab">{t("requests")}</Link>
          </Button>
        }
      />

      {canEdit && <LabQcForm tests={[]} />}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden grid-cols-[1fr_80px_100px_1fr_1fr_90px_140px] gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>{t("testName")}</span>
          <span>{t("qcLevel")}</span>
          <span>{t("lotNumber")}</span>
          <span>{t("expected")}</span>
          <span>{t("observed")}</span>
          <span>{t("qcStatus")}</span>
          <span>{t("recordedAt")}</span>
        </div>
        {records.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">—</p>}
        {records.map((r) => (
          <div key={r.id} className="grid grid-cols-1 gap-1 border-b px-3 py-2.5 text-sm last:border-b-0 sm:grid-cols-[1fr_80px_100px_1fr_1fr_90px_140px] sm:items-center sm:gap-3">
            <span className="font-medium">{r.testName}</span>
            <span className="text-muted-foreground">{r.level ?? "—"}</span>
            <span className="font-mono text-xs">{r.lotNumber ?? "—"}</span>
            <span className="text-muted-foreground">{r.expected ?? "—"}</span>
            <span className="text-muted-foreground">{r.observed ?? "—"}</span>
            <Badge variant={r.passed ? "success" : "destructive"}>
              {r.passed ? t("qcPass") : t("qcFail")}
            </Badge>
            <span className="text-xs text-muted-foreground">{fmtDate(r.recordedAt)} {fmtTime(r.recordedAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
