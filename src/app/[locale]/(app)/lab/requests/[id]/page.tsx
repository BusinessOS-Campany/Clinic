import { AlertTriangle, FlaskConical, Printer } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate, fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LabResultForm } from "@/components/lab/lab-result-form";
import { LabVerifyButton } from "@/components/lab/lab-verify-button";
import { LabWorkflow } from "@/components/lab/lab-workflow";
import { LabAmendForm } from "@/components/lab/lab-amend-form";

const FLAG_BADGE: Record<string, "secondary" | "warning" | "success" | "destructive" | "outline"> = {
  NORMAL: "success",
  LOW: "warning",
  HIGH: "warning",
  ABNORMAL: "warning",
  CRITICAL_LOW: "destructive",
  CRITICAL_HIGH: "destructive",
};

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
  const canVerifyRole = await can(user, "laboratory:verify");

  const request = await prisma.labRequest.findFirst({
    where: { id, clinicId },
    include: {
      order: { select: { id: true, name: true } },
      tests: {
        orderBy: { createdAt: "asc" },
        include: {
          test: { include: { referenceRanges: true } },
          amendments: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!request) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("title")} icon={FlaskConical} description={t("notFound")} />
      </div>
    );
  }

  const patient = await prisma.patient.findUnique({
    where: { id: request.patientId },
    select: {
      id: true,
      mrn: true,
      gender: true,
      birthDate: true,
      firstNameAr: true,
      secondNameAr: true,
      lastNameAr: true,
      firstNameEn: true,
      lastNameEn: true,
    },
  });
  if (!patient) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("title")} icon={FlaskConical} description={t("notFound")} />
      </div>
    );
  }

  const ageYears = patient.birthDate
    ? Math.floor((Date.now() - patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const canEnter =
    canResult && ["PENDING", "SAMPLED", "IN_PROGRESS", "RESULTED"].includes(request.status);
  const canRelease = canVerifyRole && request.status === "RESULTED";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={request.requestNo ?? t("requests")}
        icon={FlaskConical}
        description={`${displayName(patient, locale)} · ${t("mrn")} ${patient.mrn}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/lab/reports/${request.id}`}>
              <Printer />
              {t("printReport")}
            </Link>
          </Button>
        }
      />

      {request.criticalFlag && !request.criticalNotedAt && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle className="size-4" />
          {t("criticalPendingBanner")}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{t(`status_${request.status}`)}</Badge>
            {request.priority !== "ROUTINE" && <Badge variant="warning">{t(`priority_${request.priority}`)}</Badge>}
            {request.order?.name && (
              <span className="text-xs text-muted-foreground">← {request.order.name}</span>
            )}
            <span className="ms-auto font-mono text-xs text-muted-foreground">
              {fmtDate(request.createdAt)} {fmtTime(request.createdAt)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
            {request.clinicalIndication && (
              <span className="sm:col-span-4">{t("indication")}: {request.clinicalIndication}</span>
            )}
            {request.specimenType && <span>{t("specimenType")}: {t(`specimen_${request.specimenType}`)}</span>}
            {request.specimenId && <span>{t("specimenId")}: {request.specimenId}</span>}
            {request.collectedAt && <span>{t("collectedAt")}: {fmtDate(request.collectedAt)} {fmtTime(request.collectedAt)}</span>}
            {request.externalLab && <span>{t("externalLab")}: {request.externalLab}</span>}
            {request.rejectionReason && <span>{t("rejectionReason")}: {t(`reject_${request.rejectionReason}`)}</span>}
          </div>

          {request.tests.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          {request.tests.map((test) => {
            const refText = test.test?.referenceRanges.find((r) => r.text)?.text ?? test.referenceRange;
            return (
              <div key={test.id} className="flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{test.testName}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {refText ? `${t("reference")}: ${refText}` : ""}
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
                    {test.flag && <Badge variant={FLAG_BADGE[test.flag] ?? "outline"}>{t(`flag_${test.flag}`)}</Badge>}
                    {!test.flag && test.isAbnormal === true && <Badge variant="destructive">{t("abnormal")}</Badge>}
                    {canVerifyRole && test.status === "VERIFIED" && (
                      <LabAmendForm resultId={test.id} currentValue={test.resultValue} currentFlag={test.flag} />
                    )}
                  </div>
                </div>
                {test.method && <span className="text-xs text-muted-foreground">{t("method")}: {test.method}</span>}
                {test.comments && <span className="text-xs text-muted-foreground">{test.comments}</span>}
                {test.amendments.length > 0 && (
                  <div className="rounded-md bg-muted/50 p-2 text-xs">
                    {test.amendments.map((a) => (
                      <div key={a.id} className="text-muted-foreground">
                        {t("amendedFrom", { from: a.previousValue ?? "—", to: a.newValue ?? "—" })}
                        {a.reason ? ` · ${a.reason}` : ""} · {a.amendedBy ?? "—"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <LabWorkflow
        requestId={request.id}
        status={request.status}
        specimenType={request.specimenType}
        canResult={canResult}
        canVerify={canVerifyRole}
        criticalFlag={request.criticalFlag}
        criticalNotified={Boolean(request.criticalNotedAt)}
      />

      {canResult && !["VERIFIED", "CANCELLED"].includes(request.status) && (
        <LabResultForm
          requestId={request.id}
          patientSex={patient.gender}
          patientAgeYears={ageYears}
          tests={request.tests.map((test) => ({
            id: test.id,
            name: test.testName,
            unit: test.unit,
            value: test.resultValue,
            flag: test.flag,
            method: test.method,
            comments: test.comments,
            ranges: (test.test?.referenceRanges ?? []).map((r) => ({
              sex: r.sex,
              ageMinYears: r.ageMinYears,
              ageMaxYears: r.ageMaxYears,
              low: r.low === null ? null : Number(r.low),
              high: r.high === null ? null : Number(r.high),
              criticalLow: r.criticalLow === null ? null : Number(r.criticalLow),
              criticalHigh: r.criticalHigh === null ? null : Number(r.criticalHigh),
              text: r.text,
            })),
          }))}
        />
      )}
      {canVerifyRole && request.status === "RESULTED" && (
        <LabVerifyButton requestId={request.id} resultCount={request.tests.length} />
      )}

      <p className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("requestedBy")}: {request.requestedBy ?? "—"}</span>
        {request.releasedAt && <span>{t("releasedAt")}: {fmtDate(request.releasedAt)} {fmtTime(request.releasedAt)}</span>}
      </p>
    </div>
  );
}
