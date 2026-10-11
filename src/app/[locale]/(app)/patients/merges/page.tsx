import { GitMerge } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MergeDecisionButtons } from "@/components/patients/merge-decision-buttons";

const STATUS_VARIANT = {
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "destructive",
  APPLIED: "success",
} as const;

export default async function MergeRequestsPage() {
  const user = await requirePermission("patients:merge");
  const t = await getTranslations("patients");
  const locale = await getLocale();
  const clinicId = user.currentClinicId ?? "";
  const canMerge = await can(user, "patients:merge");

  const requests = clinicId
    ? await prisma.patientMergeRequest.findMany({
        where: { clinicId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          primary: {
            select: { mrn: true, firstNameAr: true, secondNameAr: true, lastNameAr: true },
          },
        },
      })
    : [];

  const duplicatesByRequest = await prisma.patient.findMany({
    where: clinicId ? { mergedIntoId: { not: null }, clinicId } : { id: "none" },
    select: { id: true, mrn: true, mergedIntoId: true },
  });
  const mrnsById = new Map(duplicatesByRequest.map((d) => [d.id, d.mrn]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("mergeRequests")}
        icon={GitMerge}
        description={t("mergeRequestsDesc")}
        actions={
          <Button asChild variant="outline">
            <Link href="/patients">{t("backToList")}</Link>
          </Button>
        }
      />

      {requests.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">
          {t("noMergeRequests")}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_VARIANT[request.status]}>
                        {t(`mergeStatus_${request.status}`)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {t("mergePrimaryLabel")}{" "}
                        <span className="font-mono">{request.primary.mrn}</span>{" "}
                        {request.primary.firstNameAr} {request.primary.lastNameAr}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(request.createdAt, locale)} · {t("mergeReason")}:{" "}
                      {request.reason}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {request.duplicateIds.map((id) => (
                        <span key={id} className="rounded-full bg-muted px-2 py-0.5 font-mono">
                          {mrnsById.get(id) ?? id}
                        </span>
                      ))}
                    </div>
                  </div>

                  <MergeDecisionButtons
                    requestId={request.id}
                    status={request.status}
                    canApprove={canMerge}
                    isRequester={request.requestedById === user.id}
                    primaryMrn={request.primary.mrn}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}