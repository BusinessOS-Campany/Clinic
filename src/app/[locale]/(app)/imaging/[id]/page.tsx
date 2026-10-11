import { ScanLine } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImagingActions } from "@/components/imaging/imaging-actions";

export default async function ImagingRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("imaging:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("imaging");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "imaging:write");
  const canReport = await can(user, "imaging:report");

  const request = await prisma.imagingRequest.findFirst({
    where: { id, clinicId },
    include: {
      order: { select: { name: true, priority: true } },
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        icon={ScanLine}
        description={`${displayName(patient, locale)} · ${patient.mrn}`}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{t(`status_${request.status}`)}</Badge>
            {request.order?.priority === "URGENT" && (
              <Badge variant="destructive">{t("priority_URGENT")}</Badge>
            )}
            {request.modality && <Badge variant="outline">{t(`modality_${request.modality}`)}</Badge>}
            {request.order?.name && (
              <span className="text-xs text-muted-foreground">← {request.order.name}</span>
            )}
            <span className="ms-auto text-xs text-muted-foreground">{fmtDate(request.createdAt)}</span>
          </div>

          {request.findings ? (
            <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
              {request.findings}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </CardContent>
      </Card>

      {(canWrite || canReport) && request.status !== "REPORTED" && request.status !== "CANCELLED" && (
        <ImagingActions
          requestId={request.id}
          status={request.status}
          canWrite={canWrite}
          canReport={canReport}
        />
      )}
    </div>
  );
}