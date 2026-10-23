import { Plus, Stethoscope } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListShell, ListGridRow } from "@/components/data/list-shell";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Inbox } from "lucide-react";

export default async function PatientChartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("encounters:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("encounters");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "encounters:write");

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId },
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

  const encounters = await prisma.encounter.findMany({
    where: { patientId: id, clinicId },
    include: {
      doctor: { select: { name: true } },
      _count: {
        select: { diagnoses: true, orders: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={displayName(patient, locale)}
        icon={Stethoscope}
        description={`${patient.mrn} · ${t("chart")}`}
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/encounters/new">
                <Plus />
                {t("newEncounter")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ListShell
        columns={[
          { label: t("date"), className: "flex-1" },
          { label: t("doctor"), className: "shrink-0" },
          { label: t("diagnoses"), className: "shrink-0 text-right" },
          { label: t("orders"), className: "shrink-0 text-right" },
          { label: t("status"), className: "shrink-0 text-right" },
        ]}
      >
        {encounters.length === 0 ? (
          <EmptyState icon={Inbox} title={t("noEncounters")} description={t("noEncountersDesc")} />
        ) : (
          encounters.map((e, i) => (
            <ListGridRow key={e.id} href={`/encounters/${e.id}`} index={i}>
              <span className="flex-1 font-medium">{fmtDate(e.createdAt)}</span>
              <span className="shrink-0 text-muted-foreground">{e.doctor?.name ?? "—"}</span>
              <span className="shrink-0 text-right text-xs font-medium tabular-nums">{e._count.diagnoses}</span>
              <span className="shrink-0 text-right text-xs font-medium tabular-nums">{e._count.orders}</span>
              <span className="shrink-0 text-right">
                <StatusBadge status={e.status}>
                  {e.status === "COMPLETED" ? t("completed") : t("inProgress")}
                </StatusBadge>
              </span>
            </ListGridRow>
          ))
        )}
      </ListShell>
    </div>
  );
}