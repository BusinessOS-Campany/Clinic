import { FlaskConical } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate, fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LabResultForm } from "@/components/lab/lab-result-form";
import { LabVerifyButton } from "@/components/lab/lab-verify-button";

export default async function LabRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("laboratory:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("lab");
  const clinicId = user.currentClinicId ?? "";
  const canResult = await can(user, "laboratory:result");
  const canVerify = await can(user, "laboratory:verify");

  const request = await prisma.labRequest.findFirst({
    where: { id, clinicId },
    include: {
      order: { select: { id: true, name: true, priority: true } },
      tests: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!request) notFound();

  const patient = await prisma.patient.findUnique({
    where: { id: request.patientId },
    select: {
      id: true,
      mrn: true,
      firstNameAr: true,
      lastNameAr: true,
      firstNameEn: true,
      lastNameEn: true,
    },
  });
  if (!patient) notFound();

  const canEnter = canResult && (request.status === "PENDING" || request.status === "RESULTED");
  const canRelease = canVerify && request.status === "RESULTED";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("requests")}
        icon={FlaskConical}
        description={`${displayName(patient, locale)} · mrn ${patient.mrn}`}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{t(`status_${request.status}`)}</Badge>
            {request.order?.priority === "URGENT" && (
              <Badge variant="destructive">{t("priority_URGENT")}</Badge>
            )}
            {request.order?.name && (
              <span className="text-xs text-muted-foreground">← {request.order.name}</span>
            )}
            <span className="ms-auto font-mono text-xs text-muted-foreground">
              {fmtDate(request.createdAt)} {fmtTime(request.createdAt)}
            </span>
          </div>

          {request.tests.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          {request.tests.map((test) => (
            <div key={test.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{test.testName}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {test.referenceRange ? `${t("reference")}: ${test.referenceRange}` : ""}
                  {test.unit ? ` · ${test.unit}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {test.resultValue ? (
                  <span className="font-semibold">
                    {test.resultValue}
                    <span className="ms-1 text-xs text-muted-foreground">{test.unit}</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
                {test.isAbnormal === true && <Badge variant="destructive">{t("abnormal")}</Badge>}
                {test.isAbnormal === false && <Badge variant="outline">{t("normal")}</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {canEnter && (
        <LabResultForm
          requestId={request.id}
          tests={request.tests.map((test) => ({
            id: test.id,
            name: test.testName,
            unit: test.unit,
            value: test.resultValue,
            isAbnormal: test.isAbnormal,
          }))}
        />
      )}
      {canRelease && <LabVerifyButton requestId={request.id} resultCount={request.tests.length} />}

      <p className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("requestedBy")}: {request.requestedBy ?? "—"}</span>
        {request.tests.some((test) => test.enteredBy) && (
          <span>{t("resulted")}: {request.tests.map((test) => test.enteredBy).find(Boolean) ?? "—"}</span>
        )}
      </p>
    </div>
  );
}